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
