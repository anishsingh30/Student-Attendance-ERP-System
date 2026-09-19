from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user, require_roles
from app.models.user import User
from app.models.faculty import Faculty
from app.models.subject import Subject, FacultySubject
from app.models.student import Student
from app.services.attendance_service import get_faculty_class_overview

router = APIRouter(prefix="/faculty", tags=["Faculty"])

@router.get("/dashboard")
def get_faculty_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["faculty", "admin"]))
) -> Dict[str, Any]:
    faculty_id = 1
    if current_user.role == "faculty" and current_user.faculty_profile:
        faculty_id = current_user.faculty_profile.id
    elif current_user.role == "faculty":
        # Check if faculty profile exists by user_id
        f = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
        if f:
            faculty_id = f.id

    return get_faculty_class_overview(db, faculty_id)

@router.get("/subjects")
def get_faculty_subjects(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["faculty", "admin"]))
):
    if current_user.role == "admin":
        subjects = db.query(Subject).all()
    else:
        faculty_id = None
        if current_user.faculty_profile:
            faculty_id = current_user.faculty_profile.id
        else:
            f = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
            if f:
                faculty_id = f.id

        if faculty_id:
            faculty_subs = db.query(FacultySubject).filter(
                FacultySubject.faculty_id == faculty_id
            ).all()
            sub_ids = [fs.subject_id for fs in faculty_subs]
            if sub_ids:
                subjects = db.query(Subject).filter(Subject.id.in_(sub_ids)).all()
            else:
                subjects = db.query(Subject).all()
        else:
            subjects = db.query(Subject).all()

    return [
        {
            "id": s.id,
            "code": s.code,
            "name": s.name,
            "department": s.department,
            "semester": s.semester,
            "total_classes_scheduled": s.total_classes_scheduled
        }
        for s in subjects
    ]

@router.get("/students")
def get_faculty_students(
    subject_id: Optional[int] = Query(None),
    risk_level: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["faculty", "admin"]))
):
    faculty_id = 1
    if current_user.role == "faculty" and current_user.faculty_profile:
        faculty_id = current_user.faculty_profile.id
    elif current_user.role == "faculty":
        f = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
        if f:
            faculty_id = f.id

    overview = get_faculty_class_overview(db, faculty_id)
    roster = overview.get("student_roster", [])

    if risk_level:
        roster = [s for s in roster if s["risk_level"].upper() == risk_level.upper()]

    if search:
        s_term = search.lower()
        roster = [s for s in roster if (s_term in s["name"].lower() or s_term in s["roll_number"].lower())]

    return roster
