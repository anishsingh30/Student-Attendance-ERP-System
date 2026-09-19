from typing import List, Optional
from pydantic import BaseModel

class SubjectAttendanceDetail(BaseModel):
    subject_id: int
    subject_code: str
    subject_name: str
    faculty_name: Optional[str] = None
    classes_attended: int
    classes_conducted: int
    percentage: float
    risk_level: str  # GREEN, YELLOW, ORANGE, RED
    required_threshold: float
    is_at_risk: bool
    consecutive_classes_needed: int
    max_classes_can_miss: int
    status_label: str

class AttendanceTrendPoint(BaseModel):
    label: str
    percentage: float
    attended: int
    conducted: int

class StudentDashboardResponse(BaseModel):
    student_id: int
    user_id: int
    full_name: str
    roll_number: str
    department: str
    semester: int
    overall_percentage: float
    overall_risk_level: str
    total_subjects: int
    subjects_below_threshold: int
    critical_subjects_count: int
    active_alerts_count: int
    unread_notifications_count: int
    subjects: List[SubjectAttendanceDetail]
    attendance_trends: List[AttendanceTrendPoint]
