from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user, get_current_student_profile, verify_student_access
from app.models.user import User
from app.models.student import Student
from app.models.attendance import Attendance
from app.models.subject import Subject
from app.schemas.student import StudentDashboardResponse
from app.schemas.attendance import AttendanceRecordResponse
from app.services.attendance_service import get_student_dashboard_data

router = APIRouter(prefix="/students", tags=["Students"])

@router.get("/me/dashboard", response_model=StudentDashboardResponse)
def get_my_dashboard(
    db: Session = Depends(get_db),
    student: Student = Depends(get_current_student_profile)
):
    """
    Returns full deterministic attendance telemetry, risk analysis, recovery metrics, and trends for current student.
    """
    return get_student_dashboard_data(db, student.id)

@router.get("/me/attendance", response_model=List[AttendanceRecordResponse])
def get_my_attendance_records(
    subject_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    student: Student = Depends(get_current_student_profile)
):
    query = db.query(Attendance).filter(Attendance.student_id == student.id)
    if subject_id:
        query = query.filter(Attendance.subject_id == subject_id)
    if status:
        query = query.filter(Attendance.status == status.upper())

    records = query.order_by(Attendance.date.desc()).all()
    results = []
    for r in records:
        results.append(AttendanceRecordResponse(
            id=r.id,
            student_id=r.student_id,
            student_name=student.user.full_name if student.user else None,
            roll_number=student.roll_number,
            subject_id=r.subject_id,
            subject_name=r.subject.name if r.subject else None,
            subject_code=r.subject.code if r.subject else None,
            date=r.date,
            status=r.status,
            notes=r.notes,
            created_at=r.created_at
        ))
    return results

@router.get("/{student_id}/dashboard", response_model=StudentDashboardResponse)
def get_student_dashboard_by_id(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Data Privacy Check:
    Verifies that the caller has explicit authorized permission to access this student's attendance.
    Students attempting to view another student's attendance receive 403 Forbidden.
    """
    target_student = verify_student_access(student_id, current_user, db)
    return get_student_dashboard_data(db, target_student.id)
