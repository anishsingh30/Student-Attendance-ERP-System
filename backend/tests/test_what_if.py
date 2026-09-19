import pytest
from app.core.database import SessionLocal
from app.models.student import Student
from app.models.subject import Subject
from app.services.what_if_service import simulate_attendance_scenario

def test_what_if_simulation_math():
    db = SessionLocal()
    student = db.query(Student).first()
    subject = db.query(Subject).first()
    assert student is not None
    assert subject is not None

    res = simulate_attendance_scenario(
        db=db,
        student_id=student.id,
        subject_id=subject.id,
        classes_to_attend=5,
        classes_to_miss=0
    )
    assert res.simulated_classes_attended == res.current_attended + 5
    assert res.simulated_classes_conducted == res.current_conducted + 5
    assert res.projected_percentage >= res.current_percentage
    assert len(res.ai_explanation) > 10
    db.close()
