import os
import io
import pytest
import joblib
from datetime import datetime, timezone
from sklearn.ensemble import RandomForestClassifier
from app.core.database import SessionLocal
from app.models.model_version import ModelVersion
from app.models.user import User
from app.services.model_storage_service import model_storage_service, ModelStorageService
from app.ml.train import train_and_evaluate_model, MODEL_PATH, METRICS_PATH
from app.ml.predictor import ml_predictor

def test_model_artifact_upload_and_retrieval():
    """Verify artifact upload and retrieval via PostgreSQL BYTEA without filesystem writes."""
    db = SessionLocal()
    try:
        clf = RandomForestClassifier(n_estimators=5, random_state=42)
        clf.fit([[80.0, 0.8, 0, 20, 20, 1]], [0])
        
        buf = io.BytesIO()
        joblib.dump(clf, buf)
        raw_bytes = buf.getvalue()

        version_name = f"test-v1-{datetime.now(timezone.utc).timestamp()}"
        metadata = {
            "metrics": {"accuracy": 0.95, "f1_score": 0.94},
            "baseline_comparison": {"baseline_accuracy": 0.85},
            "confusion_matrix": [[10, 0], [1, 9]],
            "feature_importances": {"overall_percentage": 0.8},
            "hyperparameters": {"n_estimators": 5}
        }

        # 1. Save model with status INACTIVE
        record = model_storage_service.save_model(
            model_version=version_name,
            model_bytes=raw_bytes,
            metadata=metadata,
            db=db
        )
        assert record.id is not None
        assert record.status == "INACTIVE"
        assert record.storage_backend == "POSTGRES_BLOB"
        assert record.artifact_size_bytes == len(raw_bytes)

        # 2. Activate model
        activated = model_storage_service.activate_model(db, version_name)
        assert activated.status == "ACTIVE"

        # 3. Retrieve active model bytes
        retrieved_bytes = model_storage_service.load_active_model(db)
        assert retrieved_bytes is not None
        assert retrieved_bytes == raw_bytes

        # 4. Verify deserialized model can predict
        loaded_clf = joblib.load(io.BytesIO(retrieved_bytes))
        pred = loaded_clf.predict([[80.0, 0.8, 0, 20, 20, 1]])
        assert pred[0] == 0
    finally:
        db.close()


def test_model_metadata_persistence():
    """Verify metadata is correctly saved and retrieved from model_versions database record."""
    db = SessionLocal()
    try:
        version_name = f"test-v2-meta-{datetime.now(timezone.utc).timestamp()}"
        metadata = {
            "metrics": {"accuracy": 0.98, "precision": 0.97, "recall": 0.98, "f1_score": 0.975},
            "baseline_comparison": {"baseline_accuracy": 0.80},
            "confusion_matrix": [[5, 1], [0, 6]],
            "feature_importances": {"overall_percentage": 0.5, "streak": 0.5},
            "hyperparameters": {"n_estimators": 100, "max_depth": 5},
            "feature_schema": ["overall_percentage", "streak"],
            "dataset_metadata": {"total_samples": 12}
        }

        model_storage_service.save_model(
            model_version=version_name,
            model_bytes=b"dummy_serialized_model_bytes_12345",
            metadata=metadata,
            db=db
        )
        model_storage_service.activate_model(db, version_name)

        active_meta = model_storage_service.get_active_model_metadata(db)
        assert active_meta is not None
        assert active_meta["model_version"] == version_name
        assert active_meta["metrics"]["accuracy"] == 0.98
        assert active_meta["metrics"]["f1_score"] == 0.975
        assert active_meta["baseline_comparison"]["baseline_accuracy"] == 0.80
        assert active_meta["hyperparameters"]["max_depth"] == 5
        assert active_meta["storage_backend"] == "POSTGRES_BLOB"
        assert active_meta["artifact_size_bytes"] == len(b"dummy_serialized_model_bytes_12345")
    finally:
        db.close()


def test_atomic_activation_and_deactivation():
    """Verify activation marks previous ACTIVE model as INACTIVE atomically."""
    db = SessionLocal()
    try:
        v1 = f"test-atomic-v1-{datetime.now(timezone.utc).timestamp()}"
        v2 = f"test-atomic-v2-{datetime.now(timezone.utc).timestamp()}"

        model_storage_service.save_model(v1, b"model_bytes_v1", {}, db)
        model_storage_service.activate_model(db, v1)

        rec1 = db.query(ModelVersion).filter(ModelVersion.model_version == v1).first()
        assert rec1.status == "ACTIVE"

        # Save and activate v2
        model_storage_service.save_model(v2, b"model_bytes_v2", {}, db)
        model_storage_service.activate_model(db, v2)

        # Refresh rec1
        db.refresh(rec1)
        rec2 = db.query(ModelVersion).filter(ModelVersion.model_version == v2).first()

        assert rec1.status == "INACTIVE"
        assert rec2.status == "ACTIVE"
        assert model_storage_service.load_active_model(db) == b"model_bytes_v2"
    finally:
        db.close()


def test_failed_upload_leaves_previous_model_active():
    """Verify that a failed upload/save leaves the previous active model intact."""
    db = SessionLocal()
    try:
        v_good = f"test-good-{datetime.now(timezone.utc).timestamp()}"
        model_storage_service.save_model(v_good, b"valid_model_bytes", {}, db)
        model_storage_service.activate_model(db, v_good)

        # Attempt to save with invalid empty bytes
        with pytest.raises(ValueError, match="Cannot persist empty model artifact bytes"):
            model_storage_service.save_model("test-corrupt", b"", {}, db)

        # Verify previous model is still active
        active_rec = model_storage_service.get_active_model_record(db)
        assert active_rec.model_version == v_good
        assert active_rec.status == "ACTIVE"
    finally:
        db.close()


def test_failed_activation_leaves_previous_model_active():
    """Verify that a failed activation attempt does not deactivate the current active model."""
    db = SessionLocal()
    try:
        v_current = f"test-current-{datetime.now(timezone.utc).timestamp()}"
        model_storage_service.save_model(v_current, b"current_active_bytes", {}, db)
        model_storage_service.activate_model(db, v_current)

        # Attempt to activate nonexistent model
        with pytest.raises(ValueError, match="not found in database"):
            model_storage_service.activate_model(db, "nonexistent-version-xyz")

        # Verify current model is STILL active
        active_rec = model_storage_service.get_active_model_record(db)
        assert active_rec.model_version == v_current
        assert active_rec.status == "ACTIVE"
    finally:
        db.close()


def test_production_never_writes_to_model_store_filesystem():
    """
    CRITICAL VERCEL TEST:
    Verify that train_and_evaluate_model does NOT overwrite or touch
    the read-only files in backend/app/ml/model_store/ (e.g. on /var/task).
    """
    db = SessionLocal()
    try:
        mtime_model_before = os.path.getmtime(MODEL_PATH) if os.path.exists(MODEL_PATH) else None
        mtime_metrics_before = os.path.getmtime(METRICS_PATH) if os.path.exists(METRICS_PATH) else None

        # Execute training
        res = train_and_evaluate_model(db)
        assert "model_version" in res
        new_version = res["model_version"]

        # Verify active model was saved to database BYTEA
        active_meta = model_storage_service.get_active_model_metadata(db)
        assert active_meta["model_version"] == new_version

        # Verify disk files were NOT touched or overwritten
        if mtime_model_before is not None:
            mtime_model_after = os.path.getmtime(MODEL_PATH)
            assert mtime_model_after == mtime_model_before, "MODEL_PATH was modified! Production filesystem must remain untouched."

        if mtime_metrics_before is not None:
            mtime_metrics_after = os.path.getmtime(METRICS_PATH)
            assert mtime_metrics_after == mtime_metrics_before, "METRICS_PATH was modified! Production filesystem must remain untouched."
    finally:
        db.close()
