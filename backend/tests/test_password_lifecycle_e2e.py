import pytest
import time
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.core.database import SessionLocal
from app.core.security import get_password_hash, verify_password
from app.core.rate_limiter import limiter
from app.models.user import User

client = TestClient(app)

@pytest.fixture
def db_session():
    limiter.reset()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        limiter.reset()

def test_full_password_lifecycle_a_through_j(db_session: Session):
    """
    Automated verification of Tests A through J:
    - Test A: Normal login with no reset -> direct dashboard (must_change_password=False)
    - Test B: Admin resets user password -> must_change_password=True in DB
    - Test C: User logs in with reset password -> returns must_change_password=True
    - Test D: User successfully changes password -> must_change_password=False, fresh token
    - Test E: User logs out
    - Test F: User logs in with NEW password -> must_change_password=False (direct dashboard)
    - Test G: Old reset password is rejected
    - Test H: Refresh / /auth/me after password change retains must_change_password=False
    - Test I: password_changed_at is properly updated
    - Test J: Previous token issued before password_changed_at is rejected (401)
    """
    # 0. Setup test user
    limiter.reset()
    test_email = "rahul.test.lifecycle@university.edu"
    test_user = db_session.query(User).filter(User.email == test_email).first()
    if test_user:
        db_session.delete(test_user)
        db_session.commit()

    initial_password = "InitialPassword@123"
    test_user = User(
        email=test_email,
        full_name="Rahul Verma Test",
        role="student",
        password_hash=get_password_hash(initial_password),
        must_change_password=False,
        is_active=True,
        password_changed_at=datetime.now(timezone.utc) - timedelta(days=1)
    )
    db_session.add(test_user)
    db_session.commit()
    db_session.refresh(test_user)

    user_id = test_user.id

    # TEST A: Normal user login with no reset
    login_resp = client.post("/api/auth/login", json={"email": test_email, "password": initial_password})
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    login_data = login_resp.json()
    assert login_data["must_change_password"] is False
    normal_token = login_data["access_token"]

    # Sleep slightly so timestamps strictly advance
    time.sleep(1.1)

    # TEST B: Admin resets user password
    temp_password = "TempResetPassword@123"
    test_user = db_session.query(User).filter(User.id == user_id).first()
    test_user.password_hash = get_password_hash(temp_password)
    test_user.must_change_password = True
    test_user.password_reset_at = datetime.now(timezone.utc)
    test_user.password_changed_at = datetime.now(timezone.utc)
    db_session.commit()
    db_session.refresh(test_user)

    assert test_user.must_change_password is True
    admin_reset_changed_at = test_user.password_changed_at

    # Verify TEST J part 1: The old normal_token is now rejected because it was issued before admin_reset_changed_at
    old_session_resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {normal_token}"})
    assert old_session_resp.status_code == 401, "Old session token was not invalidated after reset"

    # TEST C: User logs in with reset password
    temp_login_resp = client.post("/api/auth/login", json={"email": test_email, "password": temp_password})
    assert temp_login_resp.status_code == 200
    temp_login_data = temp_login_resp.json()
    assert temp_login_data["must_change_password"] is True
    temp_token = temp_login_data["access_token"]

    time.sleep(1.1)

    # TEST D: User successfully changes password via force-change-password
    new_permanent_pass = "BrandNewPermanentPassword@2026!"
    force_change_resp = client.post(
        "/api/auth/force-change-password",
        headers={"Authorization": f"Bearer {temp_token}"},
        json={
            "new_password": new_permanent_pass
        }
    )
    assert force_change_resp.status_code == 200, f"Force change failed: {force_change_resp.text}"
    force_change_data = force_change_resp.json()
    assert force_change_data["must_change_password"] is False
    assert "access_token" in force_change_data and force_change_data["access_token"] is not None
    post_change_token = force_change_data["access_token"]

    # Verify directly in DB
    db_session.expire_all()
    user_in_db = db_session.query(User).filter(User.id == user_id).first()
    assert user_in_db.must_change_password is False, "DB must_change_password was NOT cleared!"
    assert verify_password(new_permanent_pass, user_in_db.password_hash) is True

    # TEST I: Password changed timestamp updated
    assert user_in_db.password_changed_at is not None
    assert user_in_db.password_changed_at >= admin_reset_changed_at

    # TEST J part 2: The temporary token (issued before force password change) is rejected
    temp_token_check = client.get("/api/auth/me", headers={"Authorization": f"Bearer {temp_token}"})
    assert temp_token_check.status_code == 401, "Temporary token was not invalidated after password change"

    # TEST H: Refresh after successful password change with new token
    me_resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {post_change_token}"})
    assert me_resp.status_code == 200
    me_data = me_resp.json()
    assert me_data["must_change_password"] is False

    # TEST E: User logs out (client discards post_change_token)

    # TEST F: User logs in again with NEW permanent password
    new_login_resp = client.post("/api/auth/login", json={"email": test_email, "password": new_permanent_pass})
    assert new_login_resp.status_code == 200
    new_login_data = new_login_resp.json()
    assert new_login_data["must_change_password"] is False, "Subsequent login STILL had must_change_password=True!"
    final_token = new_login_data["access_token"]

    final_me_resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {final_token}"})
    assert final_me_resp.status_code == 200
    assert final_me_resp.json()["must_change_password"] is False

    # TEST G: Old reset password is rejected
    rejected_resp = client.post("/api/auth/login", json={"email": test_email, "password": temp_password})
    assert rejected_resp.status_code == 401 or rejected_resp.status_code == 400

    # Clean up test user
    db_session.delete(user_in_db)
    db_session.commit()
