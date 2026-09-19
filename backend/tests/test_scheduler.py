import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.core.security import create_access_token
from app.models.user import User
from app.services.scheduler_service import attendance_scheduler

client = TestClient(app)

def get_token_by_role(role: str) -> str:
    db = SessionLocal()
    try:
        u = db.query(User).filter(User.role == role).first()
        assert u is not None, f"No user with role {role}"
        return create_access_token({"sub": u.email, "role": u.role, "id": u.id})
    finally:
        db.close()

def test_scheduler_service_status():
    """Verify scheduler status contains required operational fields."""
    db = SessionLocal()
    try:
        status = attendance_scheduler.get_status(db)
        assert "enabled" in status
        assert "interval_hours" in status
        assert "is_currently_running" in status
        assert status["interval_hours"] >= 1
    finally:
        db.close()

def test_scheduler_api_rbac():
    """Verify only admin can view or modify scheduler configuration."""
    student_token = get_token_by_role("student")
    admin_token = get_token_by_role("admin")

    # Student cannot view scheduler status
    res = client.get("/api/scheduler/status", headers={"Authorization": f"Bearer {student_token}"})
    assert res.status_code == 403

    # Admin can view scheduler status
    res_admin = client.get("/api/scheduler/status", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_admin.status_code == 200
    assert "enabled" in res_admin.json()

    # Admin updates interval
    res_update = client.post(
        "/api/scheduler/config",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"enabled": True, "interval_hours": 12}
    )
    assert res_update.status_code == 200
    assert res_update.json()["interval_hours"] == 12

def test_cron_trigger_endpoint_authorization():
    """Verify /cron-trigger endpoint security and execution."""
    admin_token = get_token_by_role("admin")
    student_token = get_token_by_role("student")

    # 1. Reject unauthenticated/unauthorized callers when CRON_SECRET is set
    from app.core.config import settings
    orig_cron_secret = settings.CRON_SECRET
    orig_env = settings.ENVIRONMENT
    try:
        settings.CRON_SECRET = "test_cron_secret_12345"
        settings.ENVIRONMENT = "production"

        # No header
        res_no_auth = client.get("/api/scheduler/cron-trigger")
        assert res_no_auth.status_code == 401

        # Invalid secret
        res_wrong_auth = client.get(
            "/api/scheduler/cron-trigger",
            headers={"Authorization": "Bearer wrong_secret"}
        )
        assert res_wrong_auth.status_code == 401

        # Student token should not be authorized as cron secret
        res_student = client.get(
            "/api/scheduler/cron-trigger",
            headers={"Authorization": f"Bearer {student_token}"}
        )
        assert res_student.status_code == 401

        # Valid CRON_SECRET header succeeds
        res_valid_secret = client.get(
            "/api/scheduler/cron-trigger",
            headers={"Authorization": "Bearer test_cron_secret_12345"}
        )
        assert res_valid_secret.status_code == 200
        data = res_valid_secret.json()
        assert data["status"] == "success"
        assert data["triggered_by"] == "cron"

        # 2. Valid Admin JWT fallback succeeds even when CRON_SECRET is set
        res_admin_jwt = client.get(
            "/api/scheduler/cron-trigger",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert res_admin_jwt.status_code == 200
        data_admin = res_admin_jwt.json()
        assert data_admin["status"] == "success"
        assert data_admin["triggered_by"] == "cron"

        # 3. Non-admin JWT (student) is rejected with 401
        res_student_rejected = client.get(
            "/api/scheduler/cron-trigger",
            headers={"Authorization": f"Bearer {student_token}"}
        )
        assert res_student_rejected.status_code == 401

    finally:
        settings.CRON_SECRET = orig_cron_secret
        settings.ENVIRONMENT = orig_env
