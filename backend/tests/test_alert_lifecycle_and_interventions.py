import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.user import User
from app.models.student import Student
from app.models.subject import Subject
from app.models.alert import Alert, AlertIntervention
from app.core.security import create_access_token

client = TestClient(app)

def test_alert_lifecycle_and_interventions_flow():
    """Tests the full alert lifecycle: creation -> ACKNOWLEDGED -> INTERVENTION -> ESCALATED -> RESOLVE."""
    db = SessionLocal()
    try:
        faculty = db.query(User).filter(User.role == "faculty").first()
        student = db.query(Student).first()
        subject = db.query(Subject).first()
        assert faculty is not None and student is not None and subject is not None

        token = create_access_token({"sub": faculty.email, "role": faculty.role, "user_id": faculty.id})
        headers = {"Authorization": f"Bearer {token}"}

        # Clean any existing active alert for this pair
        db.query(Alert).filter(Alert.student_id == student.id, Alert.subject_id == subject.id).delete()
        db.commit()

        # 1. Create alert in NEW state
        alert = Alert(
            student_id=student.id,
            subject_id=subject.id,
            risk_level="RED",
            current_percentage=55.0,
            required_percentage=75.0,
            classes_attended=11,
            classes_conducted=20,
            classes_required=10,
            title="Critical Attendance Shortage",
            explanation="Statutory shortfall detected",
            recommended_action="Meet Faculty Mentor",
            lifecycle_status="NEW",
            is_resolved=False
        )
        db.add(alert)
        db.commit()
        db.refresh(alert)

        # 2. Acknowledge Alert
        ack_res = client.post(f"/api/alerts/{alert.id}/acknowledge", json={"notes": "Reviewed with class counselor"}, headers=headers)
        assert ack_res.status_code == 200
        ack_data = ack_res.json()
        assert ack_data["lifecycle_status"] == "ACKNOWLEDGED"
        assert ack_data["assigned_to_user_id"] == faculty.id

        # 3. Record Intervention (Counseling scheduled)
        inv_payload = {
            "action_type": "COUNSELING_SCHEDULED",
            "notes": "Parent-teacher counseling session booked for Friday",
            "new_status": "IN_PROGRESS"
        }
        inv_res = client.post(f"/api/alerts/{alert.id}/intervene", json=inv_payload, headers=headers)
        assert inv_res.status_code == 200
        inv_data = inv_res.json()
        assert inv_data["lifecycle_status"] == "IN_PROGRESS"

        # 4. Escalate Alert
        esc_res = client.post(f"/api/alerts/{alert.id}/escalate", json={"notes": "Student missed 2 consecutive counseling meetings"}, headers=headers)
        assert esc_res.status_code == 200
        esc_data = esc_res.json()
        assert esc_data["lifecycle_status"] == "ESCALATED"

        # 5. Get Alert Interventions
        history_res = client.get(f"/api/alerts/{alert.id}/interventions", headers=headers)
        assert history_res.status_code == 200
        history = history_res.json()
        assert len(history) >= 3
        actions = [h["action_type"] for h in history]
        assert "ACKNOWLEDGED" in actions
        assert "COUNSELING_SCHEDULED" in actions
        assert "ESCALATED" in actions

        # 6. Resolve Alert
        res_res = client.put(f"/api/alerts/{alert.id}/resolve", json={"is_resolved": True, "notes": "Student attended 8 consecutive classes and recovered standing"}, headers=headers)
        assert res_res.status_code == 200
        res_data = res_res.json()
        assert res_data["is_resolved"] is True
        assert res_data["lifecycle_status"] == "RESOLVED"
        assert res_data["resolved_at"] is not None

    finally:
        if 'alert' in locals() and alert.id:
            db.query(AlertIntervention).filter(AlertIntervention.alert_id == alert.id).delete()
            db.query(Alert).filter(Alert.id == alert.id).delete()
            db.commit()
        db.close()
