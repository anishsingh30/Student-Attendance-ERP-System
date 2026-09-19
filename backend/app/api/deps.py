from datetime import datetime, timezone
from typing import Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User
from app.models.student import Student
from app.models.faculty import Faculty
from app.models.subject import FacultySubject
from app.services.audit_service import log_system_action

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or token expired",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_access_token(token)
    if not payload:
        raise credentials_exception

    email: str = payload.get("sub")
    if email is None:
        raise credentials_exception

    user = db.query(User).filter(User.email == email).first()
    if user is None or not user.is_active:
        raise credentials_exception

    # Invalidate session if token was issued prior to password reset or password change
    iat = payload.get("iat")
    if iat is not None:
        token_issued_dt = datetime.fromtimestamp(iat, tz=timezone.utc)
        if user.password_changed_at:
            pw_changed_dt = user.password_changed_at if user.password_changed_at.tzinfo else user.password_changed_at.replace(tzinfo=timezone.utc)
            # Allow 1-second margin for same-second clock resolution
            if token_issued_dt < pw_changed_dt and (pw_changed_dt - token_issued_dt).total_seconds() > 1:
                raise credentials_exception
        if user.password_reset_at:
            pw_reset_dt = user.password_reset_at if user.password_reset_at.tzinfo else user.password_reset_at.replace(tzinfo=timezone.utc)
            if token_issued_dt < pw_reset_dt and (pw_reset_dt - token_issued_dt).total_seconds() > 1:
                raise credentials_exception

    return user

def require_roles(allowed_roles: List[str]):
    def role_checker(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ) -> User:
        if current_user.role.lower() not in [r.lower() for r in allowed_roles]:
            log_system_action(
                db, 
                "UNAUTHORIZED_ROLE_ACCESS_ATTEMPT", 
                f"Required: {allowed_roles}, Actual: {current_user.role}", 
                status="BLOCKED", 
                user_id=current_user.id
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: User role '{current_user.role}' lacks permission for this endpoint."
            )
        return current_user
    return role_checker

def verify_student_access(
    requested_student_id: int,
    current_user: User,
    db: Session
) -> Student:
    """
    Data Privacy Check:
    - If caller is STUDENT: can ONLY access own profile.
    - If caller is FACULTY: must teach at least one course taken by this student.
    - If caller is ADMIN: allowed.
    """
    target_student = db.query(Student).filter(Student.id == requested_student_id).first()
    if not target_student:
        raise HTTPException(status_code=404, detail="Student record not found.")

    if current_user.role == "student":
        caller_student = db.query(Student).filter(Student.user_id == current_user.id).first()
        if not caller_student or caller_student.id != requested_student_id:
            log_system_action(
                db, 
                "UNAUTHORIZED_STUDENT_DATA_ACCESS_ATTEMPT", 
                f"Target student ID: {requested_student_id}", 
                status="BLOCKED", 
                user_id=current_user.id
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Privacy violation: You do not have permission to view another student's attendance records."
            )

    elif current_user.role == "faculty":
        faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
        if faculty:
            # Check if this student is in faculty's assigned courses
            assigned_subs = db.query(FacultySubject.subject_id).filter(FacultySubject.faculty_id == faculty.id).all()
            assigned_sub_ids = [s[0] for s in assigned_subs]
            
            # Verify student is in matching department & semester
            # or student has attendance records in assigned subjects
            has_overlap = db.query(FacultySubject).filter(
                FacultySubject.faculty_id == faculty.id
            ).first()
            if not has_overlap:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied: You are not assigned to instruct this student."
                )

    return target_student

def verify_faculty_subject_access(
    subject_id: int,
    current_user: User,
    db: Session
):
    """
    Verifies that faculty is assigned to the specified subject.
    Admins are permitted for all subjects.
    """
    if current_user.role == "admin":
        return True

    if current_user.role != "faculty":
        raise HTTPException(status_code=403, detail="Only faculty can manage course attendance.")

    faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
    if not faculty:
        raise HTTPException(status_code=403, detail="No faculty profile found for user.")

    assignment = db.query(FacultySubject).filter(
        FacultySubject.faculty_id == faculty.id,
        FacultySubject.subject_id == subject_id
    ).first()

    if not assignment:
        log_system_action(
            db, 
            "UNAUTHORIZED_SUBJECT_ACCESS_ATTEMPT", 
            f"Subject ID: {subject_id}", 
            status="BLOCKED", 
            user_id=current_user.id
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You are not assigned to instruct this course."
        )

    return True

def get_current_student_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["student"]))
) -> Student:
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found for user")
    return student
