import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.model_version import ModelVersion

logger = logging.getLogger("attendance.ml.storage")

class ModelStorageService:
    """
    Persistent model storage service using PostgreSQL/Neon BYTEA and relational metadata.
    Avoids all runtime writes to the local read-only filesystem (/var/task in serverless environments).
    """

    def save_model(
        self,
        model_version: str,
        model_bytes: bytes,
        metadata: Dict[str, Any],
        db: Session,
        created_by_user_id: Optional[int] = None,
    ) -> ModelVersion:
        """
        Stores serialized model bytes and associated evaluation metrics into the database
        with an initial status of INACTIVE.
        """
        if not model_bytes or len(model_bytes) == 0:
            raise ValueError("Cannot persist empty model artifact bytes.")

        trained_at = metadata.get("trained_at")
        if isinstance(trained_at, str):
            try:
                trained_dt = datetime.fromisoformat(trained_at)
            except Exception:
                trained_dt = datetime.now(timezone.utc)
        elif isinstance(trained_at, datetime):
            trained_dt = trained_at
        else:
            trained_dt = datetime.now(timezone.utc)

        # Ensure timezone awareness
        if trained_dt.tzinfo is None:
            trained_dt = trained_dt.replace(tzinfo=timezone.utc)

        now_utc = datetime.now(timezone.utc)

        # Check if version already exists
        existing = db.query(ModelVersion).filter(ModelVersion.model_version == model_version).first()
        if existing:
            existing.status = "INACTIVE"
            existing.storage_backend = "POSTGRES_BLOB"
            existing.artifact_bytes = model_bytes
            existing.artifact_size_bytes = len(model_bytes)
            existing.metrics = metadata.get("metrics")
            existing.baseline_comparison = metadata.get("baseline_comparison")
            existing.confusion_matrix = metadata.get("confusion_matrix")
            existing.feature_importances = metadata.get("feature_importances")
            existing.hyperparameters = metadata.get("hyperparameters")
            existing.feature_schema = metadata.get("feature_schema")
            existing.dataset_metadata = metadata.get("dataset_metadata")
            existing.trained_at = trained_dt
            existing.created_by_user_id = created_by_user_id
            existing.error_message = None
            db.flush()
            logger.info(f"Updated existing model version record {model_version} ({len(model_bytes)} bytes)")
            return existing

        record = ModelVersion(
            model_version=model_version,
            status="INACTIVE",
            storage_backend="POSTGRES_BLOB",
            artifact_bytes=model_bytes,
            artifact_size_bytes=len(model_bytes),
            metrics=metadata.get("metrics"),
            baseline_comparison=metadata.get("baseline_comparison"),
            confusion_matrix=metadata.get("confusion_matrix"),
            feature_importances=metadata.get("feature_importances"),
            hyperparameters=metadata.get("hyperparameters"),
            feature_schema=metadata.get("feature_schema"),
            dataset_metadata=metadata.get("dataset_metadata"),
            trained_at=trained_dt,
            created_at=now_utc,
            created_by_user_id=created_by_user_id,
            error_message=None
        )
        db.add(record)
        db.flush()
        logger.info(f"Persisted new model version {model_version} ({len(model_bytes)} bytes) with status INACTIVE")
        return record

    def activate_model(
        self,
        db: Session,
        model_version: str,
    ) -> ModelVersion:
        """
        Atomically sets previous active model(s) to INACTIVE and marks the target model as ACTIVE.
        Ensures artifact exists and is non-empty before activation.
        """
        target = db.query(ModelVersion).filter(ModelVersion.model_version == model_version).first()
        if not target:
            raise ValueError(f"Model version '{model_version}' not found in database.")

        if not target.artifact_bytes or len(target.artifact_bytes) == 0:
            raise ValueError(f"Cannot activate model version '{model_version}' because artifact_bytes is empty.")

        # Atomic transition: deactivate others
        active_models = db.query(ModelVersion).filter(
            ModelVersion.status == "ACTIVE",
            ModelVersion.id != target.id
        ).all()
        for m in active_models:
            m.status = "INACTIVE"

        target.status = "ACTIVE"
        db.commit()
        db.refresh(target)
        logger.info(f"Successfully activated model version {model_version}")
        return target

    def load_active_model(
        self,
        db: Session,
    ) -> Optional[bytes]:
        """
        Retrieves the active model artifact bytes from the database.
        Returns None if no active model is found.
        """
        record = (
            db.query(ModelVersion)
            .filter(ModelVersion.status == "ACTIVE")
            .order_by(ModelVersion.trained_at.desc())
            .first()
        )
        if not record or not record.artifact_bytes:
            return None
        return bytes(record.artifact_bytes)

    def get_active_model_record(
        self,
        db: Session,
    ) -> Optional[ModelVersion]:
        """Returns the active ModelVersion database record."""
        return (
            db.query(ModelVersion)
            .filter(ModelVersion.status == "ACTIVE")
            .order_by(ModelVersion.trained_at.desc())
            .first()
        )

    def get_active_model_metadata(
        self,
        db: Session,
    ) -> Optional[Dict[str, Any]]:
        """
        Returns full evaluation metadata dictionary for the active model.
        """
        record = self.get_active_model_record(db)
        if not record:
            return None

        labels = []
        if record.confusion_matrix and isinstance(record.confusion_matrix, list):
            labels = ["SAFE", "WARNING", "SHORTAGE", "CRITICAL"][:len(record.confusion_matrix)]

        return {
            "model_version": record.model_version,
            "algorithm": "RandomForestClassifier",
            "status": record.status,
            "storage_backend": record.storage_backend,
            "artifact_size_bytes": record.artifact_size_bytes,
            "trained_at": record.trained_at.isoformat() if record.trained_at else None,
            "evaluated_at": record.trained_at.isoformat() if record.trained_at else None,
            "metrics": record.metrics or {},
            "baseline_comparison": record.baseline_comparison or {},
            "labels": labels,
            "confusion_matrix": record.confusion_matrix or [],
            "feature_importances": record.feature_importances or {},
            "hyperparameters": record.hyperparameters or {},
            "feature_schema": record.feature_schema or [],
            "dataset_metadata": record.dataset_metadata or {},
        }

model_storage_service = ModelStorageService()
