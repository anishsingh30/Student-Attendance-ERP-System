from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    alert_id = Column(Integer, ForeignKey("alerts.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), nullable=False, default="INFO")  # WARNING, CRITICAL, INFO, RECOVERY
    channel = Column(String(50), nullable=False, default="IN_APP")  # IN_APP, EMAIL
    status = Column(String(50), nullable=False, default="SENT")  # QUEUED, SENT, FAILED, READ, UNCONFIGURED
    retry_count = Column(Integer, default=0)
    sent_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    # Relationships
    user = relationship("User", back_populates="notifications")

