from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Float, Boolean, DateTime, ForeignKey
from app.core.database import Base

class AttendanceThreshold(Base):
    __tablename__ = "attendance_thresholds"

    id = Column(Integer, primary_key=True, index=True)
    green_min = Column(Float, nullable=False, default=80.0)
    yellow_min = Column(Float, nullable=False, default=75.0)
    orange_min = Column(Float, nullable=False, default=65.0)
    red_max = Column(Float, nullable=False, default=65.0)
    is_active = Column(Boolean, default=True)
    updated_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

