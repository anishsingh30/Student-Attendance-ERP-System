from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.student import Student
from app.models.faculty import Faculty
from app.models.subject import Subject
from app.models.attendance import Attendance
from app.services.threshold_service import get_active_threshold
from app.services.policy_service import get_institution_policy
from app.core.rate_limiter import rate_limit

router = APIRouter(prefix="/public", tags=["Public Institutional Data"])

@router.get("/landing-stats")
def get_landing_stats(
    db: Session = Depends(get_db),
    _rate_check: bool = Depends(rate_limit(max_requests=60, window_seconds=60, endpoint_tag="public_landing_stats"))
) -> Dict[str, Any]:
    """
    Secure, public, read-only aggregate endpoint for university landing page.
    Exposes non-sensitive institutional counts, active policy thresholds,
    and verified platform properties without disclosing any student PII,
    credentials, or sensitive internal data.
    """
    total_students = db.query(Student).count()
    total_faculty = db.query(Faculty).count()
    total_courses = db.query(Subject).count()
    total_attendance_records = db.query(Attendance).count()

    threshold = get_active_threshold(db)
    policy = get_institution_policy(db)

    return {
        "institution_name": "Apex Institute of Technology",
        "system_name": "AttendanceAI",
        "academic_edition": "University ERP Edition",
        "academic_session": "2025–2026",
        "metrics": {
            "total_students": total_students,
            "total_faculty": total_faculty,
            "total_courses": total_courses,
            "total_attendance_records": total_attendance_records,
        },
        "thresholds": {
            "statutory_minimum": policy.get("statutory_minimum_percentage", threshold.yellow_min),
            "warning_threshold": policy.get("warning_threshold_percentage", threshold.green_min),
            "critical_threshold": policy.get("critical_threshold_percentage", threshold.orange_min),
            "green_min": threshold.green_min,
            "yellow_min": threshold.yellow_min,
            "orange_min": threshold.orange_min,
            "red_max": threshold.red_max,
        },
        "security_features": [
            "Role-Based Access Control (Student / Faculty / Admin)",
            "Deterministic Recovery & Mathematical Logic",
            "Immutable Audit Trail & Activity Logging",
            "Multi-Tier Academic Risk Classification",
            "Automated Early Alert Dispatch System"
        ],
        "status": "operational"
    }
