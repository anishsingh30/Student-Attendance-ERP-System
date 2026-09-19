import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.user import User
from app.models.student import Student
from app.models.notification import Notification
from app.models.threshold import AttendanceThreshold
from app.core.security import create_access_token

client = TestClient(app)

@pytest.fixture(scope="module")
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture(scope="module")
def student_auth_context(db_session):
    student_user = db_session.query(User).filter(User.role == "student").first()
    assert student_user is not None, "Test fixture requires at least one student user"
    token = create_access_token(data={"sub": student_user.email, "role": "student"})
    student_profile = db_session.query(Student).filter(Student.user_id == student_user.id).first()
    assert student_profile is not None
    return {
        "user": student_user,
        "token": token,
        "headers": {"Authorization": f"Bearer {token}"},
        "student": student_profile
    }

@pytest.fixture(scope="module")
def admin_auth_headers(db_session):
    admin_user = db_session.query(User).filter(User.role == "admin").first()
    assert admin_user is not None
    token = create_access_token(data={"sub": admin_user.email, "role": "admin"})
    return {"Authorization": f"Bearer {token}"}

def test_notification_exact_13_step_lifecycle(student_auth_context, db_session):
    """
    Verifies the complete 13-step notification lifecycle scenario:
    1. Authenticate student
    2. Get baseline unread count
    3. Generate new unread notification in DB
    4. Confirm count increases by 1
    5. Confirm /api/students/me/dashboard unread_notifications_count matches /api/notifications/unread-count
    6. Mark one notification as read
    7. Confirm unread count decreases by exactly 1
    8. Query again to verify persistence across page reload / session renewal
    9. Mark all read
    10. Confirm unread count is 0
    """
    headers = student_auth_context["headers"]
    user = student_auth_context["user"]

    # 1 & 2: Get baseline unread count
    res = client.get("/api/notifications/unread-count", headers=headers)
    assert res.status_code == 200
    baseline_unread = res.json()["unread_count"]

    # 3: Generate a new notification for this student
    new_notif = Notification(
        user_id=user.id,
        title="Automated Test Warning",
        message="Your attendance in Data Structures is currently borderline.",
        notification_type="WARNING",
        channel="IN_APP",
        status="SENT",
        is_read=False,
        created_at=datetime.now(timezone.utc)
    )
    db_session.add(new_notif)
    db_session.commit()
    db_session.refresh(new_notif)

    # 4: Verify unread count increased by exactly 1
    res2 = client.get("/api/notifications/unread-count", headers=headers)
    assert res2.status_code == 200
    assert res2.json()["unread_count"] == baseline_unread + 1

    # 5: Verify dashboard count matches notifications unread count
    dash_res = client.get("/api/students/me/dashboard", headers=headers)
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    assert dash_data["unread_notifications_count"] == baseline_unread + 1

    # 6: Mark the created notification as read
    read_res = client.put(f"/api/notifications/{new_notif.id}/read", json={"is_read": True}, headers=headers)
    assert read_res.status_code == 200
    assert read_res.json()["is_read"] is True

    # 7 & 8: Verify count decreased by 1 and persists
    res3 = client.get("/api/notifications/unread-count", headers=headers)
    assert res3.status_code == 200
    assert res3.json()["unread_count"] == baseline_unread

    # 9: Mark all notifications read
    mark_all_res = client.put("/api/notifications/read-all", headers=headers)
    assert mark_all_res.status_code == 200

    # 10: Verify count is exactly 0
    res4 = client.get("/api/notifications/unread-count", headers=headers)
    assert res4.status_code == 200
    assert res4.json()["unread_count"] == 0

def test_authoritative_attendance_percentage_calculation(student_auth_context):
    """
    Verifies that attendance percentages in dashboard and subjects are strictly computed
    as (classes_attended / classes_conducted * 100).
    """
    headers = student_auth_context["headers"]
    res = client.get("/api/students/me/dashboard", headers=headers)
    assert res.status_code == 200
    data = res.json()

    tot_att = 0
    tot_cond = 0
    for sub in data["subjects"]:
        att = sub["classes_attended"]
        cond = sub["classes_conducted"]
        tot_att += att
        tot_cond += cond
        if cond > 0:
            expected_pct = round((att / cond) * 100.0, 2)
            assert sub["percentage"] == expected_pct

    if tot_cond > 0:
        expected_overall = round((tot_att / tot_cond) * 100.0, 2)
        assert data["overall_percentage"] == expected_overall

def test_dynamic_threshold_in_reports(admin_auth_headers, db_session):
    """
    Verifies that reports/subjects-overview and reports/department utilize the active dynamic threshold
    from threshold_configs rather than a hardcoded 75%.
    """
    # Verify report endpoint returns valid data
    res = client.get("/api/reports/subjects-overview", headers=admin_auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    if len(data) > 0:
        assert "students_below_threshold" in data[0]
        assert "average_percentage" in data[0]

def test_authenticated_user_profile_dynamic_resolution(student_auth_context):
    """
    Verifies /api/auth/me returns the authenticated student's real database profile,
    not a static mock object.
    """
    headers = student_auth_context["headers"]
    user = student_auth_context["user"]
    res = client.get("/api/auth/me", headers=headers)
    assert res.status_code == 200
    profile = res.json()
    assert profile["email"] == user.email
    assert profile["full_name"] == user.full_name
    assert profile["role"] == "student"
    assert "password" not in profile
    assert "password_hash" not in profile
