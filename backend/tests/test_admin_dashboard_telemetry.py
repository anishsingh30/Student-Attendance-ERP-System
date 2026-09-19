import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.core.database import SessionLocal
from app.models.user import User
from app.models.agent import AgentRun
from app.core.security import create_access_token
from app.core.rate_limiter import limiter

client = TestClient(app)

@pytest.fixture
def db_session():
    limiter.reset()
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
        limiter.reset()

def get_role_token(db: Session, role: str) -> str:
    user = db.query(User).filter(User.role == role, User.is_active == True).first()
    assert user is not None, f"No active user found for role {role}"
    return create_access_token(data={"sub": user.email, "role": user.role, "id": user.id})

def test_admin_dashboard_telemetry_success(db_session: Session):
    """
    Verifies that GET /api/admin/analytics succeeds for authorized admins
    and returns valid administrative metrics without AttributeError or crash.
    """
    token = get_role_token(db_session, "admin")
    resp = client.get("/api/admin/analytics", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200, f"Expected 200 OK, got {resp.status_code}: {resp.text}"
    data = resp.json()

    # Core metrics required by AdminDashboard
    assert "total_students" in data and isinstance(data["total_students"], int)
    assert "total_faculty" in data and isinstance(data["total_faculty"], int)
    assert "total_subjects" in data and isinstance(data["total_subjects"], int)
    assert "total_attendance_records" in data and isinstance(data["total_attendance_records"], int)
    assert "institutional_average_attendance" in data and isinstance(data["institutional_average_attendance"], (int, float))
    assert "total_alerts_generated" in data and isinstance(data["total_alerts_generated"], int)
    assert "critical_students_count" in data and isinstance(data["critical_students_count"], int)
    assert "agent_runs_total" in data and isinstance(data["agent_runs_total"], int)
    assert "notifications_dispatched" in data and isinstance(data["notifications_dispatched"], int)
    assert "thresholds" in data

    # Verify latest_agent_run format if present
    if data.get("latest_agent_run"):
        run = data["latest_agent_run"]
        assert "id" in run
        assert "status" in run
        assert "students_analyzed" in run
        assert "subjects_analyzed" in run
        assert "at_risk_found" in run
        assert "alerts_created" in run
        assert "notifications_sent" in run

def test_admin_dashboard_telemetry_with_active_agent_run(db_session: Session):
    """
    Verifies that GET /api/admin/analytics safely handles agent runs
    with various stage states and error fields without raising AttributeError.
    """
    test_run = AgentRun(
        trigger_type="MANUAL",
        status="COMPLETED",
        current_stage="COMPLETED",
        start_time=datetime.now(timezone.utc),
        end_time=datetime.now(timezone.utc),
        students_analyzed=10,
        at_risk_found=2,
        alerts_created=2,
        notifications_sent=2,
        summary="Test agent run execution summary",
        errors=None
    )
    db_session.add(test_run)
    db_session.commit()
    db_session.refresh(test_run)

    token = get_role_token(db_session, "admin")
    resp = client.get("/api/admin/analytics", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["latest_agent_run"] is not None
    assert data["latest_agent_run"]["id"] == test_run.id
    assert data["latest_agent_run"]["status"] == "COMPLETED"
    assert data["latest_agent_run"]["stage"] == "COMPLETED"
    assert data["latest_agent_run"]["summary"] == "Test agent run execution summary"

def test_admin_dashboard_telemetry_rbac_rejections(db_session: Session):
    """
    Verifies that student and faculty roles are strictly rejected (HTTP 403 Forbidden)
    and unauthenticated requests are rejected (HTTP 401 Unauthorized).
    """
    student_token = get_role_token(db_session, "student")
    faculty_token = get_role_token(db_session, "faculty")

    # Student rejection
    resp_student = client.get("/api/admin/analytics", headers={"Authorization": f"Bearer {student_token}"})
    assert resp_student.status_code == 403

    # Faculty rejection
    resp_faculty = client.get("/api/admin/analytics", headers={"Authorization": f"Bearer {faculty_token}"})
    assert resp_faculty.status_code == 403

    # Unauthenticated rejection
    resp_anon = client.get("/api/admin/analytics")
    assert resp_anon.status_code == 401
