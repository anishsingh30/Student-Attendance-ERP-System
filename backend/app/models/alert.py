from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Index, text
from sqlalchemy.orm import relationship
from app.core.database import Base

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    risk_level = Column(String(20), nullable=False)  # GREEN, YELLOW, ORANGE, RED
    current_percentage = Column(Float, nullable=False)
    required_percentage = Column(Float, nullable=False, default=75.0)
    classes_attended = Column(Integer, nullable=False)
    classes_conducted = Column(Integer, nullable=False)
    classes_required = Column(Integer, nullable=False, default=0)
    title = Column(String(255), nullable=False)
    explanation = Column(Text, nullable=False)
    recommended_action = Column(Text, nullable=False)
    lifecycle_status = Column(String(30), default="NEW", nullable=False, index=True) # NEW, ACKNOWLEDGED, ACTION_REQUIRED, IN_PROGRESS, RESOLVED, DISMISSED, ESCALATED
    is_resolved = Column(Boolean, default=False, nullable=False, index=True)
    assigned_to_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    resolved_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    dismiss_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    __table_args__ = (
        Index(
            "uix_active_student_subject_alert",
            "student_id",
            "subject_id",
            unique=True,
            sqlite_where=text("is_resolved = 0"),
            postgresql_where=text("is_resolved = false")
        ),
    )

    # Relationships
    student = relationship("Student", back_populates="alerts")
    subject = relationship("Subject", back_populates="alerts")
    assigned_to = relationship("User", foreign_keys=[assigned_to_user_id])
    resolved_by = relationship("User", foreign_keys=[resolved_by_user_id])
    interventions = relationship("AlertIntervention", back_populates="alert", cascade="all, delete-orphan", order_by="AlertIntervention.created_at.desc()")


class AlertIntervention(Base):
    __tablename__ = "alert_interventions"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(Integer, ForeignKey("alerts.id", ondelete="CASCADE"), nullable=False, index=True)
    action_type = Column(String(50), nullable=False)  # REMINDER_SENT, COUNSELING_SCHEDULED, PARENTAL_NOTIFICATION, RECOVERY_PLAN_ASSIGNED, ACADEMIC_REVIEW, RESOLVED, DISMISSED, NOTE_ADDED
    previous_status = Column(String(30), nullable=True)
    new_status = Column(String(30), nullable=True)
    notes = Column(Text, nullable=True)
    attendance_before = Column(Float, nullable=True)
    attendance_after = Column(Float, nullable=True)
    outcome_status = Column(String(30), default="PENDING", nullable=False, index=True)  # PENDING, IMPROVED, STABLE, DECLINED
    performed_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    # Relationships
    alert = relationship("Alert", back_populates="interventions")
    performed_by = relationship("User", foreign_keys=[performed_by_user_id])


