import pytest
from datetime import datetime, timezone
from sqlalchemy.exc import IntegrityError
from app.core.database import SessionLocal
from app.models.alert import Alert
from app.models.student import Student
from app.models.subject import Subject

def test_alert_database_idempotency():
    """Verify that multiple active alerts for the same (student_id, subject_id) are prevented at DB level."""
    db = SessionLocal()
    try:
        student = db.query(Student).first()
        subject = db.query(Subject).first()
        assert student is not None
        assert subject is not None

        # Clean up any existing active alerts for this pair first
        db.query(Alert).filter(
            Alert.student_id == student.id,
            Alert.subject_id == subject.id
        ).delete()
        db.commit()

        # Create first active alert
        alert1 = Alert(
            student_id=student.id,
            subject_id=subject.id,
            risk_level="RED",
            current_percentage=60.0,
            required_percentage=75.0,
            classes_attended=18,
            classes_conducted=30,
            classes_required=8,
            title="Active Red Alert",
            explanation="Critical shortage",
            recommended_action="Meet HOD",
            is_resolved=False
        )
        db.add(alert1)
        db.commit()

        # Attempt to insert a second ACTIVE alert for the same student + subject
        # This must raise an IntegrityError due to partial unique index uix_active_student_subject_alert
        alert2 = Alert(
            student_id=student.id,
            subject_id=subject.id,
            risk_level="ORANGE",
            current_percentage=62.0,
            required_percentage=75.0,
            classes_attended=19,
            classes_conducted=31,
            classes_required=7,
            title="Duplicate Active Alert",
            explanation="Shortage",
            recommended_action="Attend classes",
            is_resolved=False
        )
        db.add(alert2)
        with pytest.raises(IntegrityError):
            db.commit()
        db.rollback()

        # Now resolve the first alert
        alert1 = db.query(Alert).filter(Alert.student_id == student.id, Alert.subject_id == subject.id, Alert.is_resolved == False).first()
        alert1.is_resolved = True
        db.commit()

        # Now creating a new active alert MUST SUCCEED because the previous alert is resolved
        alert3 = Alert(
            student_id=student.id,
            subject_id=subject.id,
            risk_level="YELLOW",
            current_percentage=76.0,
            required_percentage=75.0,
            classes_attended=23,
            classes_conducted=30,
            classes_required=0,
            title="Subsequent Active Alert After Resolution",
            explanation="Borderline warning",
            recommended_action="Maintain attendance",
            is_resolved=False
        )
        db.add(alert3)
        db.commit()
        assert alert3.id is not None

    finally:
        # Cleanup
        db.query(Alert).filter(
            Alert.student_id == student.id,
            Alert.subject_id == subject.id
        ).delete()
        db.commit()
        db.close()
