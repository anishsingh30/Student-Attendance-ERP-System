import pytest
from datetime import date
from app.core.database import SessionLocal
from app.models.student import Student
from app.models.subject import Subject
from app.services.csv_service import parse_and_import_attendance_csv

def test_csv_import_valid_and_duplicate():
    db = SessionLocal()
    st = db.query(Student).first()
    sub = db.query(Subject).first()
    assert st is not None
    assert sub is not None

    csv_data = f"""student_id,student_name,subject,date,status
{st.roll_number},Test Student,{sub.code},2026-09-01,PRESENT
{st.roll_number},Test Student,{sub.code},2026-09-02,ABSENT
"""
    result = parse_and_import_attendance_csv(db, csv_data)
    assert result.records_processed == 2
    assert result.failed_records == 0

    # Running duplicate
    result_dup = parse_and_import_attendance_csv(db, csv_data)
    assert result_dup.duplicate_records == 2
    db.close()

def test_csv_import_invalid_format():
    db = SessionLocal()
    invalid_csv = """name,status\nJohn,PRESENT"""
    result = parse_and_import_attendance_csv(db, invalid_csv)
    assert result.records_processed == 0
    assert len(result.errors) > 0
    db.close()
