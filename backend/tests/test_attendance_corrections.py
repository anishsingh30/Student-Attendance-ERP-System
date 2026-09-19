import pytest
from datetime import date, datetime, timezone
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.user import User
from app.models.student import Student
from app.models.subject import Subject
from app.models.attendance import Attendance, AttendanceCorrection
from app.core.security import create_access_token

client = TestClient(app)

def test_attendance_correction_persists_on_update():
    """Verify that updating an attendance status persists an immutable AttendanceCorrection audit record."""
    db = SessionLocal()
    try:
        faculty = db.query(User).filter(User.role == "faculty").first()
        student = db.query(Student).first()
        subject = db.query(Subject).first()
        assert faculty is not None
        assert student is not None
        assert subject is not None

        token = create_access_token({"sub": faculty.email, "role": faculty.role, "user_id": faculty.id})

        # Create attendance record with unique test date
        att = Attendance(
            student_id=student.id,
            subject_id=subject.id,
            date=date(2035, 11, 23),
            status="ABSENT",
            marked_by=faculty.id,
            notes="Initial absent"
        )
        db.add(att)
        db.commit()
        db.refresh(att)

        # Update attendance status to PRESENT with reason
        headers = {"Authorization": f"Bearer {token}"}
        update_payload = {
            "status": "PRESENT",
            "notes": "Medical certificate submitted",
            "reason": "Student produced medical certificate approved by HOD"
        }
        res = client.put(f"/api/attendance/{att.id}", json=update_payload, headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "PRESENT"
        assert len(data.get("corrections", [])) >= 1

        # Check DB AttendanceCorrection record
        correction = db.query(AttendanceCorrection).filter(
            AttendanceCorrection.attendance_id == att.id
        ).first()
        assert correction is not None
        assert correction.previous_status == "ABSENT"
        assert correction.new_status == "PRESENT"
        assert "medical certificate" in correction.reason.lower()
        assert correction.corrected_by_user_id == faculty.id

        # Query corrections list endpoint
        res_list = client.get("/api/attendance/corrections", headers=headers)
        assert res_list.status_code == 200
        corrections_data = res_list.json()
        assert any(c["attendance_id"] == att.id for c in corrections_data)

        # Query single record corrections endpoint
        res_rec = client.get(f"/api/attendance/{att.id}/corrections", headers=headers)
        assert res_rec.status_code == 200
        rec_corrections = res_rec.json()
        assert len(rec_corrections) >= 1
        assert rec_corrections[0]["previous_status"] == "ABSENT"
        assert rec_corrections[0]["new_status"] == "PRESENT"

    finally:
        # Cleanup
        if 'att' in locals() and att.id:
            db.query(AttendanceCorrection).filter(AttendanceCorrection.attendance_id == att.id).delete()
            db.query(Attendance).filter(Attendance.id == att.id).delete()
            db.commit()
        db.close()
