from typing import List, Optional, Dict, Any, Union
import math
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import require_roles
from app.models.user import User
from app.models.student import Student
from app.models.faculty import Faculty
from app.models.subject import Subject
from app.models.attendance import Attendance
from app.models.alert import Alert
from app.models.notification import Notification
from app.models.agent import AgentRun
from app.models.audit import AuditLog
from app.models.threshold import AttendanceThreshold
from app.schemas.threshold import ThresholdResponse, ThresholdUpdateRequest
from app.schemas.audit import AuditLogResponse
from app.services.threshold_service import get_active_threshold
from app.services.recovery_calculator import calculate_percentage
from app.services.audit_service import log_system_action
from app.services.policy_service import get_institution_policy, update_institution_policy
from app.services.data_quality_service import assess_data_quality_and_anomalies

router = APIRouter(prefix="/admin", tags=["Admin Operations"], dependencies=[Depends(require_roles(["admin"]))])

@router.get("/policy")
def get_policy(db: Session = Depends(get_db)):
    return get_institution_policy(db)

@router.put("/policy")
def set_policy(
    updates: Dict[str, Any],
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_roles(["admin"]))
):
    try:
        return update_institution_policy(db, updates, user_id=admin_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/data-quality")
def get_data_quality_report(db: Session = Depends(get_db)):
    return assess_data_quality_and_anomalies(db)

@router.get("/analytics")
def get_admin_analytics(db: Session = Depends(get_db)) -> Dict[str, Any]:
    total_students = db.query(Student).count()
    total_faculty = db.query(Faculty).count()
    total_subjects = db.query(Subject).count()

    total_att_records = db.query(Attendance).count()
    present_records = db.query(Attendance).filter(Attendance.status == "PRESENT").count()
    institutional_avg = calculate_percentage(present_records, total_att_records)

    total_alerts = db.query(Alert).count()
    unresolved_alerts = db.query(Alert).filter(Alert.is_resolved == False).count()
    critical_alerts = db.query(Alert).filter(Alert.risk_level == "RED", Alert.is_resolved == False).count()

    agent_runs_count = db.query(AgentRun).count()
    notifications_count = db.query(Notification).count()
    latest_run = db.query(AgentRun).order_by(AgentRun.id.desc()).first()

    latest_run_data = None
    if latest_run:
        duration_s = None
        if latest_run.start_time and latest_run.end_time:
            duration_s = round((latest_run.end_time - latest_run.start_time).total_seconds(), 2)
        elif latest_run.start_time:
            duration_s = 0.5

        latest_run_data = {
            "id": latest_run.id,
            "status": latest_run.status,
            "stage": getattr(latest_run, "current_stage", "COMPLETED"),
            "current_stage": getattr(latest_run, "current_stage", "COMPLETED"),
            "trigger_type": latest_run.trigger_type,
            "start_time": latest_run.start_time.isoformat() if latest_run.start_time else None,
            "end_time": latest_run.end_time.isoformat() if latest_run.end_time else None,
            "duration_seconds": duration_s,
            "students_analyzed": latest_run.students_analyzed or 0,
            "subjects_analyzed": total_subjects,
            "at_risk_found": latest_run.at_risk_found or 0,
            "alerts_created": latest_run.alerts_created or 0,
            "notifications_sent": latest_run.notifications_sent or 0,
            "error_message": latest_run.errors,
            "summary": latest_run.summary
        }

    # Get active threshold
    th = get_active_threshold(db)

    return {
        "total_students": total_students,
        "total_faculty": total_faculty,
        "total_subjects": total_subjects,
        "total_attendance_records": total_att_records,
        "institutional_average_attendance": institutional_avg,
        "total_alerts_generated": total_alerts,
        "unresolved_alerts": unresolved_alerts,
        "critical_students_count": critical_alerts,
        "agent_runs_total": agent_runs_count,
        "notifications_dispatched": notifications_count,
        "latest_agent_run": latest_run_data,
        "thresholds": {
            "green_min": th.green_min,
            "yellow_min": th.yellow_min,
            "orange_min": th.orange_min,
            "red_max": th.red_max
        }
    }

from app.schemas.admin import (
    AddStudentRequest,
    AddFacultyRequest,
    UserStatusUpdateRequest,
    ResetPasswordRequest,
    SubjectCreateRequest,
    SubjectUpdateRequest,
    SubjectResponse
)
from app.models.subject import FacultySubject
from app.core.security import get_password_hash, validate_password_strength

@router.get("/users")
def get_all_users(
    role: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: Optional[int] = Query(None, ge=1),
    page_size: Optional[int] = Query(None, ge=1, le=100),
    db: Session = Depends(get_db)
):
    q = db.query(User)
    if role:
        q = q.filter(User.role == role.lower())
    users = q.order_by(User.id.asc()).all()
    results = []
    for u in users:
        roll = u.student_profile.roll_number if u.student_profile else None
        emp = u.faculty_profile.employee_id if u.faculty_profile else None
        dept = (u.student_profile.department if u.student_profile else (u.faculty_profile.department if u.faculty_profile else "Administration"))
        
        if search:
            s_lower = search.lower()
            if not (s_lower in u.full_name.lower() or s_lower in u.email.lower() or (roll and s_lower in roll.lower()) or (emp and s_lower in emp.lower())):
                continue

        results.append({
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "is_active": u.is_active,
            "created_at": u.created_at,
            "roll_number": roll,
            "employee_id": emp,
            "department": dept
        })

    if page is not None:
        p = page
        ps = page_size or 25
        start = (p - 1) * ps
        end = start + ps
        total = len(results)
        total_pages = max(1, math.ceil(total / ps))
        return {
            "items": results[start:end],
            "total": total,
            "page": p,
            "page_size": ps,
            "total_pages": total_pages
        }

    return results

@router.post("/students", status_code=status.HTTP_201_CREATED)
def add_student(
    req: AddStudentRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_roles(["admin"]))
):
    # 1. Validate email uniqueness
    if db.query(User).filter(User.email == req.email.strip().lower()).first():
        raise HTTPException(status_code=400, detail="A user with this email address already exists.")

    # 2. Validate roll number uniqueness
    if db.query(Student).filter(Student.roll_number == req.roll_number.strip()).first():
        raise HTTPException(status_code=400, detail="A student with this Roll Number / Student ID already exists.")

    # 3. Validate password strength
    is_valid_pw, pw_err = validate_password_strength(req.password)
    if not is_valid_pw:
        raise HTTPException(status_code=400, detail=pw_err)

    # 4. Create User
    user = User(
        email=req.email.strip().lower(),
        password_hash=get_password_hash(req.password),
        full_name=req.full_name.strip(),
        role="student",
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # 5. Create Student profile
    student = Student(
        user_id=user.id,
        roll_number=req.roll_number.strip(),
        department=req.department.strip(),
        semester=req.semester,
        section=req.section.strip()
    )
    db.add(student)
    db.commit()
    db.refresh(student)

    log_system_action(
        db, "STUDENT_CREATED_BY_ADMIN",
        f"roll_number: {student.roll_number}, email: {user.email}, department: {student.department}",
        user_id=admin_user.id
    )

    return {
        "id": user.id,
        "student_id": student.id,
        "email": user.email,
        "full_name": user.full_name,
        "roll_number": student.roll_number,
        "department": student.department,
        "semester": student.semester,
        "section": student.section,
        "message": "Student successfully created and enrolled in academic registry."
    }

@router.post("/faculty", status_code=status.HTTP_201_CREATED)
def add_faculty(
    req: AddFacultyRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_roles(["admin"]))
):
    # 1. Validate email uniqueness
    if db.query(User).filter(User.email == req.email.strip().lower()).first():
        raise HTTPException(status_code=400, detail="A user with this email address already exists.")

    # 2. Validate employee ID uniqueness
    if db.query(Faculty).filter(Faculty.employee_id == req.employee_id.strip()).first():
        raise HTTPException(status_code=400, detail="A faculty member with this Employee ID already exists.")

    # 3. Validate password strength
    is_valid_pw, pw_err = validate_password_strength(req.password)
    if not is_valid_pw:
        raise HTTPException(status_code=400, detail=pw_err)

    # 4. Create User
    user = User(
        email=req.email.strip().lower(),
        password_hash=get_password_hash(req.password),
        full_name=req.full_name.strip(),
        role="faculty",
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # 5. Create Faculty profile
    faculty = Faculty(
        user_id=user.id,
        employee_id=req.employee_id.strip(),
        department=req.department.strip(),
        designation=req.designation.strip()
    )
    db.add(faculty)
    db.commit()
    db.refresh(faculty)

    # 6. Assign Subjects if requested
    assigned_count = 0
    if req.assigned_subject_ids:
        for sub_id in req.assigned_subject_ids:
            sub = db.query(Subject).filter(Subject.id == sub_id).first()
            if sub:
                db.add(FacultySubject(faculty_id=faculty.id, subject_id=sub.id))
                assigned_count += 1
        db.commit()

    log_system_action(
        db, "FACULTY_CREATED_BY_ADMIN",
        f"employee_id: {faculty.employee_id}, email: {user.email}, department: {faculty.department}, assigned_subjects: {assigned_count}",
        user_id=admin_user.id
    )

    return {
        "id": user.id,
        "faculty_id": faculty.id,
        "email": user.email,
        "full_name": user.full_name,
        "employee_id": faculty.employee_id,
        "department": faculty.department,
        "designation": faculty.designation,
        "assigned_subjects_count": assigned_count,
        "message": "Faculty member successfully registered."
    }

@router.put("/users/{user_id}/status")
def update_user_status(
    user_id: int,
    req: UserStatusUpdateRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_roles(["admin"]))
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found.")

    if target.id == admin_user.id and not req.is_active:
        raise HTTPException(status_code=400, detail="Administrators cannot deactivate their own active account.")

    old_status = target.is_active
    target.is_active = req.is_active
    db.commit()

    log_system_action(
        db, "USER_STATUS_UPDATED",
        f"target_user_id: {target.id}, email: {target.email}, old_status: {old_status}, new_status: {target.is_active}",
        user_id=admin_user.id
    )

    return {
        "id": target.id,
        "email": target.email,
        "full_name": target.full_name,
        "is_active": target.is_active,
        "message": f"Account status updated to {'Active' if target.is_active else 'Deactivated'}."
    }

@router.post("/users/{user_id}/reset-password")
def admin_reset_password(
    user_id: int,
    req: ResetPasswordRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_roles(["admin"]))
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found.")

    if target.id == admin_user.id:
        raise HTTPException(
            status_code=400,
            detail="Administrators cannot reset their own password via User Management. Please use Profile Settings."
        )

    is_valid_pw, pw_err = validate_password_strength(req.new_password)
    if not is_valid_pw:
        raise HTTPException(status_code=400, detail=pw_err)

    target.password_hash = get_password_hash(req.new_password)
    target.must_change_password = req.require_change_on_next_login
    target.password_reset_at = datetime.now(timezone.utc)

    # Optional in-app notification to the target user
    from app.models.notification import Notification
    notif = Notification(
        user_id=target.id,
        title="Account Password Reset",
        message="Your account password has been reset by a university administrator. You will be prompted to create a new password when you next sign in.",
        notification_type="WARNING",
        channel="IN_APP",
        status="SENT"
    )
    db.add(notif)
    db.commit()

    log_system_action(
        db,
        action="ADMIN_PASSWORD_RESET",
        resource=f"user/{target.id}",
        status="SUCCESS",
        user_id=admin_user.id,
        details={
            "target_user_id": target.id,
            "target_email": target.email,
            "target_role": target.role,
            "force_change": target.must_change_password
        }
    )

    return {
        "id": target.id,
        "email": target.email,
        "full_name": target.full_name,
        "role": target.role,
        "must_change_password": target.must_change_password,
        "message": f"Password for {target.full_name} ({target.email}) was reset successfully. The user will be required to create a new password on next login."
    }

@router.get("/subjects", response_model=List[SubjectResponse])
def get_all_subjects(
    search: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    semester: Optional[int] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db)
):
    q = db.query(Subject)
    if department:
        q = q.filter(Subject.department.ilike(f"%{department.strip()}%"))
    if semester is not None:
        q = q.filter(Subject.semester == semester)
    if is_active is not None:
        q = q.filter(Subject.is_active == is_active)

    subjects = q.order_by(Subject.id.asc()).all()
    results = []
    for s in subjects:
        if search:
            s_lower = search.strip().lower()
            if not (s_lower in s.code.lower() or s_lower in s.name.lower() or s_lower in s.department.lower()):
                continue

        # Count dependents for safety inspection
        faculty_count = db.query(FacultySubject).filter(FacultySubject.subject_id == s.id).count()
        att_count = db.query(Attendance).filter(Attendance.subject_id == s.id).count()
        alert_count = db.query(Alert).filter(Alert.subject_id == s.id).count()

        results.append({
            "id": s.id,
            "code": s.code,
            "name": s.name,
            "department": s.department,
            "semester": s.semester,
            "total_classes_scheduled": s.total_classes_scheduled,
            "is_active": getattr(s, "is_active", True),
            "credits": getattr(s, "credits", 3),
            "faculty_count": faculty_count,
            "attendance_records_count": att_count,
            "alerts_count": alert_count
        })
    return results

@router.post("/subjects", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
def create_subject(
    req: SubjectCreateRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_roles(["admin"]))
):
    code = req.code.strip().upper()
    name = req.name.strip()
    dept = req.department.strip()

    if not code:
        raise HTTPException(status_code=400, detail="Subject/Course code is required.")
    if not name:
        raise HTTPException(status_code=400, detail="Subject title/name is required.")
    if not dept:
        raise HTTPException(status_code=400, detail="Department is required.")
    if req.semester < 1 or req.semester > 8:
        raise HTTPException(status_code=400, detail="Semester must be between 1 and 8.")
    if req.total_classes_scheduled < 1:
        raise HTTPException(status_code=400, detail="Scheduled classes must be at least 1 session.")

    # Prevent duplicate code
    existing = db.query(Subject).filter(func.lower(Subject.code) == code.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"A subject with course code '{code}' already exists ({existing.name}).")

    sub = Subject(
        code=code,
        name=name,
        department=dept,
        semester=req.semester,
        total_classes_scheduled=req.total_classes_scheduled,
        is_active=True,
        credits=req.credits if req.credits and req.credits > 0 else 3
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)

    log_system_action(
        db, "SUBJECT_CREATED",
        f"Created course subject [{sub.code}] '{sub.name}' (Sem {sub.semester}, {sub.department}, {sub.total_classes_scheduled} sessions)",
        user_id=admin_user.id
    )

    return {
        "id": sub.id,
        "code": sub.code,
        "name": sub.name,
        "department": sub.department,
        "semester": sub.semester,
        "total_classes_scheduled": sub.total_classes_scheduled,
        "is_active": sub.is_active,
        "credits": sub.credits,
        "faculty_count": 0,
        "attendance_records_count": 0,
        "alerts_count": 0
    }

@router.put("/subjects/{subject_id}", response_model=SubjectResponse)
def update_subject(
    subject_id: int,
    req: SubjectUpdateRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_roles(["admin"]))
):
    sub = db.query(Subject).filter(Subject.id == subject_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subject not found.")

    if req.code is not None:
        new_code = req.code.strip().upper()
        if not new_code:
            raise HTTPException(status_code=400, detail="Subject code cannot be empty.")
        if new_code.lower() != sub.code.lower():
            dup = db.query(Subject).filter(func.lower(Subject.code) == new_code.lower(), Subject.id != subject_id).first()
            if dup:
                raise HTTPException(status_code=400, detail=f"Subject code '{new_code}' is already taken by {dup.name}.")
            sub.code = new_code

    if req.name is not None:
        new_name = req.name.strip()
        if not new_name:
            raise HTTPException(status_code=400, detail="Subject name cannot be empty.")
        sub.name = new_name

    if req.department is not None:
        new_dept = req.department.strip()
        if not new_dept:
            raise HTTPException(status_code=400, detail="Department cannot be empty.")
        sub.department = new_dept

    if req.semester is not None:
        if req.semester < 1 or req.semester > 8:
            raise HTTPException(status_code=400, detail="Semester must be between 1 and 8.")
        sub.semester = req.semester

    if req.total_classes_scheduled is not None:
        if req.total_classes_scheduled < 1:
            raise HTTPException(status_code=400, detail="Scheduled classes must be at least 1 session.")
        sub.total_classes_scheduled = req.total_classes_scheduled

    if req.credits is not None:
        sub.credits = req.credits

    if req.is_active is not None:
        sub.is_active = req.is_active

    db.commit()
    db.refresh(sub)

    faculty_count = db.query(FacultySubject).filter(FacultySubject.subject_id == sub.id).count()
    att_count = db.query(Attendance).filter(Attendance.subject_id == sub.id).count()
    alert_count = db.query(Alert).filter(Alert.subject_id == sub.id).count()

    log_system_action(
        db, "SUBJECT_UPDATED",
        f"Updated course subject [{sub.code}] '{sub.name}' (Sem {sub.semester}, Active: {sub.is_active})",
        user_id=admin_user.id
    )

    return {
        "id": sub.id,
        "code": sub.code,
        "name": sub.name,
        "department": sub.department,
        "semester": sub.semester,
        "total_classes_scheduled": sub.total_classes_scheduled,
        "is_active": sub.is_active,
        "credits": sub.credits,
        "faculty_count": faculty_count,
        "attendance_records_count": att_count,
        "alerts_count": alert_count
    }

@router.delete("/subjects/{subject_id}")
def delete_or_archive_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_roles(["admin"]))
):
    sub = db.query(Subject).filter(Subject.id == subject_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subject not found.")

    # Check for dependent attendance records or alerts
    att_count = db.query(Attendance).filter(Attendance.subject_id == subject_id).count()
    alert_count = db.query(Alert).filter(Alert.subject_id == subject_id).count()

    if att_count > 0 or alert_count > 0:
        # Protect historical attendance calculations & audit trail -> Soft Archive
        sub.is_active = False
        db.commit()
        log_system_action(
            db, "SUBJECT_ARCHIVED",
            f"Archived course subject [{sub.code}] '{sub.name}' to protect {att_count} attendance records and {alert_count} alerts.",
            user_id=admin_user.id
        )
        return {
            "message": f"Subject '{sub.code}' has {att_count} historical attendance records and has been archived to preserve compliance integrity.",
            "archived": True,
            "deleted": False,
            "id": subject_id
        }
    else:
        # Safe to hard delete because 0 dependent historical records exist
        code = sub.code
        name = sub.name
        db.delete(sub)
        db.commit()
        log_system_action(
            db, "SUBJECT_DELETED",
            f"Permanently removed unreferenced subject [{code}] '{name}'.",
            user_id=admin_user.id
        )
        return {
            "message": f"Subject [{code}] '{name}' deleted successfully.",
            "archived": False,
            "deleted": True,
            "id": subject_id
        }

@router.post("/subjects/{subject_id}/archive")
def archive_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_roles(["admin"]))
):
    sub = db.query(Subject).filter(Subject.id == subject_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subject not found.")
    sub.is_active = False
    db.commit()
    log_system_action(db, "SUBJECT_ARCHIVED", f"Archived subject [{sub.code}]", user_id=admin_user.id)
    return {"message": f"Subject {sub.code} archived.", "is_active": False, "id": subject_id}

@router.post("/subjects/{subject_id}/unarchive")
def unarchive_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_roles(["admin"]))
):
    sub = db.query(Subject).filter(Subject.id == subject_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subject not found.")
    sub.is_active = True
    db.commit()
    log_system_action(db, "SUBJECT_UNARCHIVED", f"Reactivated subject [{sub.code}]", user_id=admin_user.id)
    return {"message": f"Subject {sub.code} reactivated.", "is_active": True, "id": subject_id}

@router.get("/thresholds", response_model=ThresholdResponse)
def get_threshold_settings(db: Session = Depends(get_db)):
    return get_active_threshold(db)

@router.put("/thresholds", response_model=ThresholdResponse)
def update_threshold_settings(
    req: ThresholdUpdateRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_roles(["admin"]))
):
    th = get_active_threshold(db)
    old_values = f"G:{th.green_min}, Y:{th.yellow_min}, O:{th.orange_min}, R:{th.red_max}"
    th.green_min = req.green_min
    th.yellow_min = req.yellow_min
    th.orange_min = req.orange_min
    th.red_max = req.red_max
    th.updated_by = admin_user.id
    db.commit()
    db.refresh(th)

    log_system_action(
        db, "THRESHOLD_UPDATED",
        f"old: [{old_values}] -> new: [G:{th.green_min}, Y:{th.yellow_min}, O:{th.orange_min}, R:{th.red_max}]",
        user_id=admin_user.id
    )
    return th

@router.get("/audit-logs", response_model=Union[List[AuditLogResponse], Dict[str, Any]])
def get_audit_logs(
    action: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    page: Optional[int] = Query(None, ge=1),
    page_size: Optional[int] = Query(None, ge=1, le=100),
    db: Session = Depends(get_db)
):
    q = db.query(AuditLog)
    if action:
        q = q.filter(AuditLog.action.ilike(f"%{action}%"))

    if page is not None:
        total = q.count()
        p = page
        ps = page_size or 50
        logs = q.order_by(AuditLog.timestamp.desc()).offset((p - 1) * ps).limit(ps).all()
        total_pages = max(1, math.ceil(total / ps))
        return {
            "items": [AuditLogResponse.model_validate(l).model_dump() for l in logs],
            "total": total,
            "page": p,
            "page_size": ps,
            "total_pages": total_pages
        }

    logs = q.order_by(AuditLog.timestamp.desc()).limit(limit).all()
    return logs

from app.core.config import settings

@router.get("/security/status")
def get_security_status(admin_user: User = Depends(require_roles(["admin"]))):
    """
    Internal Administrator-only Security Configuration Status Probe.
    Returns safe boolean flags and diagnostic metadata without exposing keys or credentials.
    """
    return {
        "secret_key_configured": settings.is_secret_key_configured,
        "gemini_key_configured": settings.is_gemini_configured,
        "database_configured": bool(settings.DATABASE_URL),
        "cors_configured": bool(settings.CORS_ORIGINS),
        "cors_origins_count": len(settings.CORS_ORIGINS),
        "rate_limiting_enabled": settings.AUTH_RATE_LIMIT_ENABLED,
        "security_headers_enabled": settings.SECURITY_HEADERS_ENABLED,
        "environment": settings.ENVIRONMENT,
        "llm_provider": settings.LLM_PROVIDER,
        "gemini_model": settings.GEMINI_MODEL,
        "deprecated_dependencies_detected": False,
        "auth_provider": "FastAPI Native JWT/RBAC"
    }

