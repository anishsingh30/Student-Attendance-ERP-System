import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.core.database import SessionLocal
from app.models.user import User
from app.models.student import Student
from app.models.faculty import Faculty
from app.models.audit import AuditLog
from app.core.security import create_access_token, verify_password, get_password_hash

client = TestClient(app)

@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()

def test_admin_password_reset_and_force_change_flow(db: Session):
    """
    Comprehensive verification of admin-controlled password reset,
    RBAC authorization boundaries, audit logging, and mandatory force-change workflow.
    """
    # 1. Fetch test users
    admin_user = db.query(User).filter(User.role == "admin").first()
    student_user = db.query(User).filter(User.role == "student").first()
    faculty_user = db.query(User).filter(User.role == "faculty").first()

    assert admin_user is not None
    assert student_user is not None
    assert faculty_user is not None

    admin_token = create_access_token({"sub": admin_user.email, "role": "admin", "id": admin_user.id})
    student_token = create_access_token({"sub": student_user.email, "role": "student", "id": student_user.id})
    faculty_token = create_access_token({"sub": faculty_user.email, "role": "faculty", "id": faculty_user.id})

    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    student_headers = {"Authorization": f"Bearer {student_token}"}
    faculty_headers = {"Authorization": f"Bearer {faculty_token}"}

    # 2. RBAC: Student & Faculty CANNOT use admin reset endpoint
    res_stu_hack = client.post(
        f"/api/admin/users/{faculty_user.id}/reset-password",
        json={"new_password": "HackerPassword123!"},
        headers=student_headers
    )
    assert res_stu_hack.status_code == 403, "Student was able to call admin password reset endpoint"

    res_fac_hack = client.post(
        f"/api/admin/users/{student_user.id}/reset-password",
        json={"new_password": "HackerPassword123!"},
        headers=faculty_headers
    )
    assert res_fac_hack.status_code == 403, "Faculty was able to call admin password reset endpoint"

    # 3. Validation: Weak password is rejected
    res_weak = client.post(
        f"/api/admin/users/{student_user.id}/reset-password",
        json={"new_password": "123"},
        headers=admin_headers
    )
    assert res_weak.status_code == 400
    assert "at least 8 characters" in res_weak.json()["detail"]

    # 4. Admin cannot casually reset own password via user management
    res_self = client.post(
        f"/api/admin/users/{admin_user.id}/reset-password",
        json={"new_password": "NewAdminPass123!"},
        headers=admin_headers
    )
    assert res_self.status_code == 400

    # 5. Invalid user ID handled safely
    res_notfound = client.post(
        "/api/admin/users/999999/reset-password",
        json={"new_password": "ValidTempPass123!"},
        headers=admin_headers
    )
    assert res_notfound.status_code == 404

    # 6. Admin resets Student password with force_change=True
    temp_pass = "TempStudentPass2026!"
    res_reset = client.post(
        f"/api/admin/users/{student_user.id}/reset-password",
        json={"new_password": temp_pass, "require_change_on_next_login": True},
        headers=admin_headers
    )
    assert res_reset.status_code == 200
    reset_data = res_reset.json()
    assert reset_data["must_change_password"] is True
    assert "password" not in reset_data or reset_data.get("password") is None, "Password leaked in response"

    # Verify database state
    db.refresh(student_user)
    assert verify_password(temp_pass, student_user.password_hash) is True
    assert student_user.must_change_password is True
    assert student_user.password_reset_at is not None

    # 7. Verify Audit Log was created
    audit = db.query(AuditLog).filter(
        AuditLog.action == "ADMIN_PASSWORD_RESET",
        AuditLog.user_id == admin_user.id
    ).order_by(AuditLog.timestamp.desc()).first()
    assert audit is not None
    assert str(student_user.id) in audit.details
    assert temp_pass not in audit.details, "Plaintext password leaked in audit log"

    # 8. Student logs in with temporary password -> receives must_change_password: True
    res_login = client.post(
        "/api/auth/login",
        json={"email": student_user.email, "password": temp_pass}
    )
    assert res_login.status_code == 200
    login_data = res_login.json()
    assert login_data["must_change_password"] is True
    stu_new_token = login_data["access_token"]
    stu_new_headers = {"Authorization": f"Bearer {stu_new_token}"}

    # 9. Student performs mandatory force password change
    final_pass = "PermanentStudentPass2026!"
    res_force = client.post(
        "/api/auth/force-change-password",
        json={"new_password": final_pass},
        headers=stu_new_headers
    )
    assert res_force.status_code == 200
    force_data = res_force.json()
    assert force_data["must_change_password"] is False

    # Verify database state after student completion
    db.refresh(student_user)
    assert student_user.must_change_password is False
    assert student_user.password_changed_at is not None
    assert verify_password(final_pass, student_user.password_hash) is True
    assert verify_password(temp_pass, student_user.password_hash) is False, "Old temp password still valid"

    # 10. Student logs in with new permanent password -> must_change_password: False
    res_login_final = client.post(
        "/api/auth/login",
        json={"email": student_user.email, "password": final_pass}
    )
    assert res_login_final.status_code == 200
    assert res_login_final.json()["must_change_password"] is False
    final_token = res_login_final.json()["access_token"]
    final_headers = {"Authorization": f"Bearer {final_token}"}

    # 11. Normal self password change still requires current password
    normal_pass = "AnotherStudentPass2026!"
    res_normal_bad = client.post(
        "/api/auth/change-password",
        json={"current_password": "WrongCurrentPassword", "new_password": normal_pass},
        headers=final_headers
    )
    assert res_normal_bad.status_code == 400
    assert "does not match" in res_normal_bad.json()["detail"]

    # 12. Reset Student password back to standard test password for test suite consistency
    student_user.password_hash = get_password_hash("student123")
    student_user.must_change_password = False
    db.commit()
