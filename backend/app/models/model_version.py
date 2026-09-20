from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, LargeBinary, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class ModelVersion(Base):
    __tablename__ = "model_versions"

    id = Column(Integer, primary_key=True, index=True)
    model_version = Column(String(100), unique=True, nullable=False, index=True)
    status = Column(String(50), nullable=False, default="INACTIVE", index=True)  # ACTIVE, INACTIVE, FAILED
    storage_backend = Column(String(50), nullable=False, default="POSTGRES_BLOB")
    artifact_bytes = Column(LargeBinary, nullable=True)  # PostgreSQL BYTEA
    artifact_size_bytes = Column(Integer, nullable=True)
    metrics = Column(JSON, nullable=True)
    baseline_comparison = Column(JSON, nullable=True)
    confusion_matrix = Column(JSON, nullable=True)
    feature_importances = Column(JSON, nullable=True)
    hyperparameters = Column(JSON, nullable=True)
    feature_schema = Column(JSON, nullable=True)
    dataset_metadata = Column(JSON, nullable=True)
    trained_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    created_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    error_message = Column(Text, nullable=True)

    # Relationship
    created_by = relationship("User", foreign_keys=[created_by_user_id])
