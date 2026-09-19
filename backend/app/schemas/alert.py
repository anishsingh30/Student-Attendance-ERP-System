from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field

class AlertInterventionBase(BaseModel):
    action_type: str = Field(..., description="Action type: REMINDER_SENT, COUNSELING_SCHEDULED, PARENTAL_NOTIFICATION, RECOVERY_PLAN_ASSIGNED, ACADEMIC_REVIEW, RESOLVED, DISMISSED, NOTE_ADDED")
    notes: Optional[str] = None
    new_status: Optional[str] = None
    attendance_before: Optional[float] = None
    attendance_after: Optional[float] = None
    outcome_status: Optional[str] = "PENDING"

class AlertInterventionCreate(AlertInterventionBase):
    pass

class AlertInterventionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    alert_id: int
    action_type: str
    previous_status: Optional[str] = None
    new_status: Optional[str] = None
    notes: Optional[str] = None
    attendance_before: Optional[float] = None
    attendance_after: Optional[float] = None
    outcome_status: Optional[str] = "PENDING"
    performed_by_user_id: int
    performed_by_name: Optional[str] = None
    created_at: datetime

class AlertActionRequest(BaseModel):
    action_type: str = Field("NOTE_ADDED", description="Action type for audit/intervention history")
    notes: Optional[str] = None
    assigned_to_user_id: Optional[int] = None
    dismiss_reason: Optional[str] = None

class AlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    student_id: int
    student_name: Optional[str] = None
    roll_number: Optional[str] = None
    subject_id: int
    subject_name: Optional[str] = None
    subject_code: Optional[str] = None
    risk_level: str
    current_percentage: float
    required_percentage: float
    classes_attended: int
    classes_conducted: int
    classes_required: int
    title: str
    explanation: str
    recommended_action: str
    lifecycle_status: str = "NEW"
    is_resolved: bool
    assigned_to_user_id: Optional[int] = None
    resolved_at: Optional[datetime] = None
    resolved_by_user_id: Optional[int] = None
    dismiss_reason: Optional[str] = None
    created_at: datetime
    interventions: List[AlertInterventionResponse] = []

class AlertResolveRequest(BaseModel):
    is_resolved: bool = True
    notes: Optional[str] = None


