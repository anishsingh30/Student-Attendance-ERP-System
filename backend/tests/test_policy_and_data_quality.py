import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import create_access_token

client = TestClient(app)

def test_institutional_policy_management_and_validation():
    """Verify that administrators can query and update institutional attendance policies with validation."""
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.role == "admin").first()
        student = db.query(User).filter(User.role == "student").first()
        assert admin is not None and student is not None

        admin_token = create_access_token({"sub": admin.email, "role": admin.role, "user_id": admin.id})
        student_token = create_access_token({"sub": student.email, "role": student.role, "user_id": student.id})

        # 1. Student access must be forbidden
        res_stu = client.get("/api/admin/policy", headers={"Authorization": f"Bearer {student_token}"})
        assert res_stu.status_code == 403

        # 2. Admin retrieves policy
        res_adm = client.get("/api/admin/policy", headers={"Authorization": f"Bearer {admin_token}"})
        assert res_adm.status_code == 200
        policy = res_adm.json()
        assert "statutory_minimum_percentage" in policy
        assert policy["statutory_minimum_percentage"] >= 50.0

        # 3. Admin updates policy with valid values
        update_payload = {
            "statutory_minimum_percentage": 75.0,
            "warning_threshold_percentage": 82.0,
            "critical_threshold_percentage": 60.0,
            "consecutive_absence_trigger_streak": 4,
            "alert_cooldown_hours": 36
        }
        res_up = client.put("/api/admin/policy", json=update_payload, headers={"Authorization": f"Bearer {admin_token}"})
        assert res_up.status_code == 200
        updated = res_up.json()
        assert updated["warning_threshold_percentage"] == 82.0
        assert updated["alert_cooldown_hours"] == 36

        # 4. Invalid policy ordering must be rejected with 400 Bad Request
        invalid_payload = {
            "statutory_minimum_percentage": 90.0,
            "warning_threshold_percentage": 70.0 # warning < statutory is invalid
        }
        res_inv = client.put("/api/admin/policy", json=invalid_payload, headers={"Authorization": f"Bearer {admin_token}"})
        assert res_inv.status_code == 400

    finally:
        db.close()

def test_data_quality_and_integrity_anomalies():
    """Verify that administrators can inspect institutional data quality metrics and anomaly signals."""
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.role == "admin").first()
        token = create_access_token({"sub": admin.email, "role": admin.role, "user_id": admin.id})

        res = client.get("/api/admin/data-quality", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "ANALYSIS_COMPLETE"
        assert "data_health_rating" in data
        assert "total_attendance_records" in data
        assert "integrity_anomalies" in data
        assert isinstance(data["integrity_anomalies"], list)

    finally:
        db.close()
