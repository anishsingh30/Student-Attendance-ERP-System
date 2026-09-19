import re
from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.rate_limiter import rate_limit
from app.api.deps import get_current_user, require_roles, verify_faculty_subject_access
from app.models.user import User
from app.models.student import Student
from app.models.attendance import Attendance, AttendanceCorrection
from app.schemas.attendance import (
    AttendanceRecordCreate,
    AttendanceRecordUpdate,
    AttendanceRecordResponse,
    AttendanceCorrectionResponse,
    WhatIfRequest,
    WhatIfResponse,
    CSVImportResult
)
from app.services.csv_service import parse_and_import_attendance_csv
from app.services.what_if_service import simulate_attendance_scenario
from app.services.audit_service import log_system_action
from datetime import timezone, datetime

router = APIRouter(prefix="/attendance", tags=["Attendance Management"])

MAX_CSV_FILE_SIZE = 2 * 1024 * 1024  # 2MB Limit

@router.get("/", response_model=List[AttendanceRecordResponse])
def get_attendance(
    subject_id: Optional[int] = Query(None),
    student_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Attendance)

    # If student, strictly constrain to self
    if current_user.role == "student":
        student = db.query(Student).filter(Student.user_id == current_user.id).first()
        if not student:
            return []
        query = query.filter(Attendance.student_id == student.id)
    elif student_id:
        query = query.filter(Attendance.student_id == student_id)

    if subject_id:
        query = query.filter(Attendance.subject_id == subject_id)
    if status:
        query = query.filter(Attendance.status == status.upper())
    if start_date:
        query = query.filter(Attendance.date >= start_date)
    if end_date:
        query = query.filter(Attendance.date <= end_date)

    records = query.order_by(Attendance.date.desc()).limit(limit).all()

    results = []
    for r in records:
        corrections = [
            AttendanceCorrectionResponse(
                id=c.id,
                attendance_id=c.attendance_id,
                corrected_by_user_id=c.corrected_by_user_id,
                corrected_by_name=c.corrected_by.full_name if c.corrected_by else None,
                previous_status=c.previous_status,
                new_status=c.new_status,
                reason=c.reason,
                corrected_at=c.corrected_at
            ) for c in (r.corrections or [])
        ]
        results.append(AttendanceRecordResponse(
            id=r.id,
            student_id=r.student_id,
            student_name=r.student.user.full_name if r.student and r.student.user else None,
            roll_number=r.student.roll_number if r.student else None,
            subject_id=r.subject_id,
            subject_name=r.subject.name if r.subject else None,
            subject_code=r.subject.code if r.subject else None,
            date=r.date,
            status=r.status,
            notes=r.notes,
            created_at=r.created_at,
            corrections=corrections
        ))
    return results

@router.get("/corrections", response_model=List[AttendanceCorrectionResponse])
def get_attendance_corrections(
    attendance_id: Optional[int] = Query(None),
    student_id: Optional[int] = Query(None),
    subject_id: Optional[int] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves immutable audit history of attendance corrections."""
    query = db.query(AttendanceCorrection).join(Attendance)

    if current_user.role == "student":
        student = db.query(Student).filter(Student.user_id == current_user.id).first()
        if not student:
            return []
        query = query.filter(Attendance.student_id == student.id)
    elif student_id:
        query = query.filter(Attendance.student_id == student_id)

    if attendance_id:
        query = query.filter(AttendanceCorrection.attendance_id == attendance_id)
    if subject_id:
        query = query.filter(Attendance.subject_id == subject_id)

    corrections = query.order_by(AttendanceCorrection.corrected_at.desc()).limit(limit).all()

    return [
        AttendanceCorrectionResponse(
            id=c.id,
            attendance_id=c.attendance_id,
            corrected_by_user_id=c.corrected_by_user_id,
            corrected_by_name=c.corrected_by.full_name if c.corrected_by else None,
            previous_status=c.previous_status,
            new_status=c.new_status,
            reason=c.reason,
            corrected_at=c.corrected_at
        ) for c in corrections
    ]

@router.get("/{attendance_id}/corrections", response_model=List[AttendanceCorrectionResponse])
def get_record_corrections(
    attendance_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves correction history for a specific attendance record."""
    att = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not att:
        raise HTTPException(status_code=404, detail="Attendance record not found.")

    if current_user.role == "student":
        student = db.query(Student).filter(Student.user_id == current_user.id).first()
        if not student or att.student_id != student.id:
            raise HTTPException(status_code=403, detail="Forbidden: You can only view corrections for your own records.")

    corrections = db.query(AttendanceCorrection).filter(
        AttendanceCorrection.attendance_id == attendance_id
    ).order_by(AttendanceCorrection.corrected_at.desc()).all()

    return [
        AttendanceCorrectionResponse(
            id=c.id,
            attendance_id=c.attendance_id,
            corrected_by_user_id=c.corrected_by_user_id,
            corrected_by_name=c.corrected_by.full_name if c.corrected_by else None,
            previous_status=c.previous_status,
            new_status=c.new_status,
            reason=c.reason,
            corrected_at=c.corrected_at
        ) for c in corrections
    ]

@router.post("/", response_model=AttendanceRecordResponse, status_code=status.HTTP_201_CREATED)
def mark_attendance(
    rec: AttendanceRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["faculty", "admin"]))
):
    # Authorization check: verify faculty is assigned to this subject
    verify_faculty_subject_access(rec.subject_id, current_user, db)

    st = db.query(Student).filter(Student.id == rec.student_id).first()
    if not st:
        raise HTTPException(status_code=404, detail="Student not found.")
    sub = db.query(Subject).filter(Subject.id == rec.subject_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subject not found.")

    existing = db.query(Attendance).filter(
        Attendance.student_id == rec.student_id,
        Attendance.subject_id == rec.subject_id,
        Attendance.date == rec.date
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Attendance record already exists for this student and subject on this date.")

    new_att = Attendance(
        student_id=rec.student_id,
        subject_id=rec.subject_id,
        date=rec.date,
        status=rec.status.upper(),
        marked_by=current_user.id,
        notes=rec.notes
    )
    db.add(new_att)
    db.commit()
    db.refresh(new_att)

    log_system_action(
        db, "ATTENDANCE_ADDED",
        f"student: {st.roll_number}, subject: {sub.code}, status: {rec.status}",
        user_id=current_user.id
    )

    return AttendanceRecordResponse(
        id=new_att.id,
        student_id=new_att.student_id,
        student_name=st.user.full_name if st.user else None,
        roll_number=st.roll_number,
        subject_id=new_att.subject_id,
        subject_name=sub.name,
        subject_code=sub.code,
        date=new_att.date,
        status=new_att.status,
        notes=new_att.notes,
        created_at=new_att.created_at,
        corrections=[]
    )

@router.put("/{attendance_id}", response_model=AttendanceRecordResponse)
def update_attendance(
    attendance_id: int,
    rec_update: AttendanceRecordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["faculty", "admin"]))
):
    att = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not att:
        raise HTTPException(status_code=404, detail="Attendance record not found.")

    verify_faculty_subject_access(att.subject_id, current_user, db)

    old_status = att.status
    new_status = rec_update.status.upper()
    reason = rec_update.reason or "Manual faculty status correction"

    if old_status != new_status:
        # Persist immutable AttendanceCorrection audit record
        correction = AttendanceCorrection(
            attendance_id=att.id,
            corrected_by_user_id=current_user.id,
            previous_status=old_status,
            new_status=new_status,
            reason=reason,
            corrected_at=datetime.now(timezone.utc)
        )
        db.add(correction)

    att.status = new_status
    if rec_update.notes:
        att.notes = rec_update.notes
    db.commit()
    db.refresh(att)

    log_system_action(
        db, "ATTENDANCE_MODIFIED",
        f"record_id: {att.id}, status changed from {old_status} to {att.status}, reason: {reason}",
        user_id=current_user.id
    )

    corrections = [
        AttendanceCorrectionResponse(
            id=c.id,
            attendance_id=c.attendance_id,
            corrected_by_user_id=c.corrected_by_user_id,
            corrected_by_name=c.corrected_by.full_name if c.corrected_by else None,
            previous_status=c.previous_status,
            new_status=c.new_status,
            reason=c.reason,
            corrected_at=c.corrected_at
        ) for c in (att.corrections or [])
    ]

    return AttendanceRecordResponse(
        id=att.id,
        student_id=att.student_id,
        student_name=att.student.user.full_name if att.student and att.student.user else None,
        roll_number=att.student.roll_number if att.student else None,
        subject_id=att.subject_id,
        subject_name=att.subject.name if att.subject else None,
        subject_code=att.subject.code if att.subject else None,
        date=att.date,
        status=att.status,
        notes=att.notes,
        created_at=att.created_at,
        corrections=corrections
    )

@router.post("/import", response_model=CSVImportResult)
async def import_attendance_csv_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["faculty", "admin"]))
):
    # 1. Validate file extension
    filename = file.filename or ""
    if not filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Invalid file type. Only standard CSV files (.csv) are accepted.")

    # 2. Validate file size (max 2MB)
    content = await file.read(MAX_CSV_FILE_SIZE + 1)
    if len(content) > MAX_CSV_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Uploaded CSV exceeds the maximum permitted limit of 2MB."
        )

    # 3. Decode content safely
    try:
        decoded_text = content.decode("utf-8")
    except UnicodeDecodeError:
        try:
            decoded_text = content.decode("latin-1")
        except Exception:
            raise HTTPException(status_code=400, detail="Failed to decode CSV text. Ensure file uses valid UTF-8 encoding.")

    # 4. Injection Protection: Block script injection or dangerous formula injection
    dangerous_patterns = [
        r"<\s*script[^>]*>",
        r"javascript\s*:",
        r"^[=+\-@]\s*(?:cmd|powershell|curl|bash|exec)",
    ]
    for pattern in dangerous_patterns:
        if re.search(pattern, decoded_text, re.IGNORECASE | re.MULTILINE):
            log_system_action(
                db, "MALICIOUS_CSV_UPLOAD_BLOCKED",
                f"filename: {filename}, matched: {pattern}",
                status="BLOCKED",
                user_id=current_user.id
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Security rejection: File contains disallowed executable script or formula syntax."
            )

    result = parse_and_import_attendance_csv(db, decoded_text, marked_by_user_id=current_user.id)
    
    log_system_action(
        db, "CSV_UPLOADED",
        f"filename: {filename}, processed: {result.records_processed}, success: {result.successful_records}, duplicates: {result.duplicate_records}",
        user_id=current_user.id
    )
    return result

@router.post("/what-if", response_model=WhatIfResponse)
def run_what_if_simulation(
    req: WhatIfRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _rate_check: bool = Depends(rate_limit(max_requests=30, window_seconds=60, endpoint_tag="whatif"))
):
    student_id = req.student_id
    if current_user.role == "student":
        student = db.query(Student).filter(Student.user_id == current_user.id).first()
        if not student:
            raise HTTPException(status_code=404, detail="Student profile not found.")
        student_id = student.id
    elif not student_id:
        raise HTTPException(status_code=400, detail="student_id is required for faculty/admin requests.")

    # Bound inputs to prevent irrational simulator loops
    if req.classes_to_attend < 0 or req.classes_to_attend > 100:
        raise HTTPException(status_code=400, detail="Classes to attend must be between 0 and 100.")
    if req.classes_to_miss < 0 or req.classes_to_miss > 100:
        raise HTTPException(status_code=400, detail="Classes to miss must be between 0 and 100.")

    return simulate_attendance_scenario(
        db=db,
        student_id=student_id,
        subject_id=req.subject_id,
        classes_to_attend=req.classes_to_attend,
        classes_to_miss=req.classes_to_miss
    )
