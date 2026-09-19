import csv
import io
from datetime import datetime, date
from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.attendance import Attendance
from app.models.student import Student
from app.models.subject import Subject
from app.schemas.attendance import CSVImportResult

def parse_and_import_attendance_csv(
    db: Session,
    csv_content: str,
    marked_by_user_id: Optional[int] = None
) -> CSVImportResult:
    """
    Parses and validates attendance CSV records.
    Expected columns: student_id (or roll_number), student_name, subject (code or id), date, status.
    """
    reader = csv.DictReader(io.StringIO(csv_content))
    
    # Normalize headers
    if not reader.fieldnames:
        return CSVImportResult(
            records_processed=0,
            successful_records=0,
            failed_records=0,
            duplicate_records=0,
            errors=["CSV file is empty or missing headers."]
        )

    headers = {h.strip().lower(): h for h in reader.fieldnames}
    
    # Map required columns
    student_col = None
    for cand in ['student_id', 'roll_number', 'roll_no', 'student']:
        if cand in headers:
            student_col = headers[cand]
            break

    subject_col = None
    for cand in ['subject', 'subject_code', 'course_code', 'subject_id']:
        if cand in headers:
            subject_col = headers[cand]
            break

    date_col = headers.get('date')
    status_col = headers.get('status')

    if not student_col or not subject_col or not date_col or not status_col:
        return CSVImportResult(
            records_processed=0,
            successful_records=0,
            failed_records=0,
            duplicate_records=0,
            errors=[f"Invalid CSV format. Missing required columns. Found: {reader.fieldnames}"]
        )

    processed = 0
    successful = 0
    failed = 0
    duplicates = 0
    errors: List[str] = []

    for row_idx, row in enumerate(reader, start=2):
        processed += 1
        raw_st = (row.get(student_col) or "").strip()
        raw_sub = (row.get(subject_col) or "").strip()
        raw_date = (row.get(date_col) or "").strip()
        raw_status = (row.get(status_col) or "").strip().upper()

        if not raw_st or not raw_sub or not raw_date or not raw_status:
            failed += 1
            errors.append(f"Row {row_idx}: Missing required fields.")
            continue

        # Status validation
        if raw_status not in ["PRESENT", "ABSENT"]:
            failed += 1
            errors.append(f"Row {row_idx}: Status must be 'PRESENT' or 'ABSENT' (got '{raw_status}').")
            continue

        # Date validation
        parsed_date: Optional[date] = None
        for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%m/%d/%Y", "%d/%m/%Y"):
            try:
                parsed_date = datetime.strptime(raw_date, fmt).date()
                break
            except ValueError:
                pass

        if not parsed_date:
            failed += 1
            errors.append(f"Row {row_idx}: Invalid date format '{raw_date}'. Use YYYY-MM-DD.")
            continue

        # Student lookup (by roll number or integer ID)
        student = None
        if raw_st.isdigit():
            student = db.query(Student).filter((Student.id == int(raw_st)) | (Student.roll_number == raw_st)).first()
        else:
            student = db.query(Student).filter(Student.roll_number.ilike(raw_st)).first()

        if not student:
            failed += 1
            errors.append(f"Row {row_idx}: Student '{raw_st}' not found.")
            continue

        # Subject lookup (by code or integer ID)
        subject = None
        if raw_sub.isdigit():
            subject = db.query(Subject).filter((Subject.id == int(raw_sub)) | (Subject.code == raw_sub)).first()
        else:
            subject = db.query(Subject).filter(Subject.code.ilike(raw_sub)).first()

        if not subject:
            failed += 1
            errors.append(f"Row {row_idx}: Subject '{raw_sub}' not found.")
            continue

        # Duplicate check in DB
        existing = db.query(Attendance).filter(
            Attendance.student_id == student.id,
            Attendance.subject_id == subject.id,
            Attendance.date == parsed_date
        ).first()

        if existing:
            duplicates += 1
            # Update status if different
            if existing.status != raw_status:
                existing.status = raw_status
                existing.marked_by = marked_by_user_id
            continue

        # Insert new record
        att_rec = Attendance(
            student_id=student.id,
            subject_id=subject.id,
            date=parsed_date,
            status=raw_status,
            marked_by=marked_by_user_id,
            notes="Imported via CSV batch"
        )
        db.add(att_rec)
        successful += 1

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        return CSVImportResult(
            records_processed=processed,
            successful_records=0,
            failed_records=processed,
            duplicate_records=duplicates,
            errors=[f"Database commit error: {str(e)}"]
        )

    return CSVImportResult(
        records_processed=processed,
        successful_records=successful,
        failed_records=failed,
        duplicate_records=duplicates,
        errors=errors[:15]  # Return top 15 errors for readability
    )
