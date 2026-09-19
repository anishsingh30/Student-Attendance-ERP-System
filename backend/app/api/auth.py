import os
import uuid
from typing import Optional
from datetime import timedelta, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Request, UploadFile, File
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, validate_password_strength
from app.core.config import settings
from app.core.rate_limiter import rate_limit
from app.models.user import User
from app.models.student import Student
from app.models.faculty import Faculty
from app.schemas.auth import LoginRequest, RegisterRequest, Token, UserResponse, ForceChangePasswordRequest, ChangePasswordRequest
from app.api.deps import get_current_user
from app.services.audit_service import log_system_action

router = APIRouter(prefix="/auth", tags=["Authentication"])

AVATAR_UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "avatars")
os.makedirs(AVATAR_UPLOAD_DIR, exist_ok=True)
MAX_PHOTO_SIZE = 2 * 1024 * 1024  # 2MB
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

from sqlalchemy import func

@router.post("/login", response_model=Token)
def login(
    login_data: LoginRequest, 
    db: Session = Depends(get_db),
    _rate_check: bool = Depends(rate_limit(max_requests=15, window_seconds=60, endpoint_tag="login"))
):
    identifier = (login_data.email or "").strip()
    if not identifier:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Please enter your Student ID, Roll Number, or Email.")

    if not login_data.password or not login_data.password.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Please enter your password.")

    # 1. Search by email
    user = db.query(User).filter(func.lower(User.email) == identifier.lower()).first()
    
    # 2. If not found by email, resolve by student roll number
    if not user:
        student = db.query(Student).filter(func.lower(Student.roll_number) == identifier.lower()).first()
        if student:
            user = student.user or db.query(User).filter(User.id == student.user_id).first()
            
    # 3. If not found, resolve by faculty employee ID
    if not user:
        faculty = db.query(Faculty).filter(func.lower(Faculty.employee_id) == identifier.lower()).first()
        if faculty:
            user = faculty.user or db.query(User).filter(User.id == faculty.user_id).first()

    if not user or not verify_password(login_data.password, user.password_hash):
        log_system_action(db, "LOGIN_FAILED", f"identifier: {identifier}", status="FAILED")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect ID/email or password. Please check your credentials and try again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        log_system_action(db, "LOGIN_BLOCKED_INACTIVE", f"user_id: {user.id}", status="BLOCKED")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Your account is currently inactive. Please contact the administrator.")

    # Check portal role mismatch if caller specified portal_role
    if login_data.portal_role:
        expected_role = login_data.portal_role.strip().lower()
        if expected_role in ["student", "faculty", "admin"] and user.role.lower() != expected_role:
            log_system_action(db, "LOGIN_ROLE_MISMATCH", f"user_id: {user.id}, attempted_portal: {expected_role}, actual_role: {user.role}", status="REJECTED")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="The selected portal role does not match this account. Please select the correct portal role."
            )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role, "id": user.id},
        expires_delta=access_token_expires
    )

    log_system_action(db, "LOGIN_SUCCESS", f"user_id: {user.id}", status="SUCCESS", user_id=user.id)

    return Token(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        profile_photo_url=user.profile_photo_url,
        must_change_password=bool(user.must_change_password)
    )

@router.post("/register", response_model=UserResponse)
def register(
    reg_data: RegisterRequest, 
    db: Session = Depends(get_db),
    _rate_check: bool = Depends(rate_limit(max_requests=8, window_seconds=60, endpoint_tag="register"))
):
    # Enforce password policy
    is_valid_pw, pw_error = validate_password_strength(reg_data.password)
    if not is_valid_pw:
        raise HTTPException(status_code=400, detail=pw_error)

    existing = db.query(User).filter(User.email == reg_data.email.strip().lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email address is already registered.")

    role = reg_data.role.lower()
    if role not in ["student", "faculty", "admin"]:
        role = "student"

    hashed_pw = get_password_hash(reg_data.password)
    user = User(
        email=reg_data.email.strip().lower(),
        password_hash=hashed_pw,
        full_name=reg_data.full_name.strip(),
        role=role,
        is_active=True,
        must_change_password=False
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    profile_id = None
    roll_no = None
    if role == "student":
        roll_no = reg_data.roll_number or f"STU{user.id:04d}"
        student = Student(
            user_id=user.id,
            roll_number=roll_no,
            department=reg_data.department or "Computer Science",
            semester=reg_data.semester or 5,
            section=reg_data.section or "A"
        )
        db.add(student)
        db.commit()
        db.refresh(student)
        profile_id = student.id

    log_system_action(db, "USER_REGISTERED", f"user_id: {user.id}", user_id=user.id)

    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        is_active=user.is_active,
        profile_photo_url=user.profile_photo_url,
        created_at=user.created_at,
        profile_id=profile_id,
        roll_number=roll_no,
        department=reg_data.department or "Computer Science",
        semester=reg_data.semester or 5,
        must_change_password=bool(user.must_change_password)
    )

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile_id = None
    roll_number = None
    employee_id = None
    department = None
    semester = None

    if current_user.role == "student":
        student = current_user.student_profile or db.query(Student).filter(Student.user_id == current_user.id).first()
        if student:
            profile_id = student.id
            roll_number = student.roll_number
            department = student.department
            semester = student.semester
    elif current_user.role == "faculty":
        faculty = current_user.faculty_profile or db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
        if faculty:
            profile_id = faculty.id
            employee_id = faculty.employee_id
            department = faculty.department

    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        is_active=current_user.is_active,
        profile_photo_url=current_user.profile_photo_url,
        created_at=current_user.created_at,
        profile_id=profile_id,
        roll_number=roll_number,
        employee_id=employee_id,
        department=department,
        semester=semester,
        must_change_password=bool(current_user.must_change_password)
    )

def _validate_image_signature(content: bytes, ext: str) -> bool:
    if len(content) < 12:
        return False
    if ext in [".jpg", ".jpeg"]:
        return content.startswith(b"\xff\xd8\xff")
    elif ext == ".png":
        return content.startswith(b"\x89PNG\r\n\x1a\n")
    elif ext == ".webp":
        return content.startswith(b"RIFF") and b"WEBP" in content[:12]
    return False

@router.post("/profile/photo", response_model=UserResponse)
async def upload_profile_photo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Uploads and saves a user profile avatar image with type & size validation."""
    filename = file.filename or ""
    # Path traversal protection in original filename
    base_filename = os.path.basename(filename)
    ext = os.path.splitext(base_filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid image format. Allowed formats: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    content = await file.read(MAX_PHOTO_SIZE + 1)
    if len(content) > MAX_PHOTO_SIZE:
        raise HTTPException(
            status_code=413,
            detail="Profile picture exceeds the maximum size limit of 2MB."
        )

    # Validate file magic bytes signature
    if not _validate_image_signature(content, ext):
        raise HTTPException(
            status_code=400,
            detail="Security rejection: File content does not match a valid image signature."
        )

    # Generate safe unique filename
    unique_name = f"user_{current_user.id}_{uuid.uuid4().hex[:12]}{ext}"
    file_path = os.path.join(AVATAR_UPLOAD_DIR, unique_name)

    # Verify path containment
    canonical_upload_dir = os.path.realpath(AVATAR_UPLOAD_DIR)
    canonical_file_path = os.path.realpath(file_path)
    if not canonical_file_path.startswith(canonical_upload_dir):
        raise HTTPException(status_code=400, detail="Invalid destination path.")

    with open(file_path, "wb") as f:
        f.write(content)

    # Save relative URL
    photo_url = f"/uploads/avatars/{unique_name}"
    current_user.profile_photo_url = photo_url
    db.commit()
    db.refresh(current_user)

    log_system_action(db, "PROFILE_PHOTO_UPDATED", f"user_id: {current_user.id}", user_id=current_user.id)
    return get_me(current_user=current_user, db=db)

@router.delete("/profile/photo", response_model=UserResponse)
def remove_profile_photo(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Removes the user's custom profile avatar."""
    current_user.profile_photo_url = None
    db.commit()
    db.refresh(current_user)
    log_system_action(db, "PROFILE_PHOTO_REMOVED", f"user_id: {current_user.id}", user_id=current_user.id)
    return get_me(current_user=current_user, db=db)

@router.post("/change-password")
def change_password(
    data: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not data.current_password or not data.new_password:
        raise HTTPException(status_code=400, detail="Current password and new password are required.")

    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password does not match.")

    is_valid, pw_err = validate_password_strength(data.new_password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=pw_err)

    current_user.password_hash = get_password_hash(data.new_password)
    current_user.must_change_password = False
    current_user.password_changed_at = datetime.now(timezone.utc)
    db.commit()

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    new_access_token = create_access_token(
        data={"sub": current_user.email, "role": current_user.role, "id": current_user.id},
        expires_delta=access_token_expires
    )

    log_system_action(
        db,
        action="PASSWORD_CHANGED_SELF",
        resource=f"user/{current_user.id}",
        status="SUCCESS",
        user_id=current_user.id,
        details={"status": "SUCCESS"}
    )
    return {"message": "Password updated successfully.", "access_token": new_access_token}

@router.post("/force-change-password", response_model=UserResponse)
def force_change_password(
    data: ForceChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mandatory password change workflow for accounts reset by administrators.
    Allows creating a new password without requiring the old temporary password.
    """
    if not data.new_password:
        raise HTTPException(status_code=400, detail="New password is required.")

    is_valid, pw_err = validate_password_strength(data.new_password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=pw_err)

    current_user.password_hash = get_password_hash(data.new_password)
    current_user.must_change_password = False
    current_user.password_changed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(current_user)

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    new_access_token = create_access_token(
        data={"sub": current_user.email, "role": current_user.role, "id": current_user.id},
        expires_delta=access_token_expires
    )

    log_system_action(
        db,
        action="PASSWORD_MANDATORY_RECOVERY_COMPLETED",
        resource=f"user/{current_user.id}",
        status="SUCCESS",
        user_id=current_user.id,
        details={"status": "COMPLETED"}
    )
    user_resp = get_me(current_user=current_user, db=db)
    user_resp.access_token = new_access_token
    return user_resp

