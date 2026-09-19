import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.core.database import SessionLocal
from app.models.user import User
from app.models.student import Student
from app.models.faculty import Faculty
from app.models.audit import AuditLog
from app.core.security import get_password_hash

client = TestClient(app)

@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()

def test_empty_identifier_validation():
    """Empty or whitespace identifier returns 400 with specific client guidance."""
    response = client.post("/api/auth/login", json={"email": "", "password": "Password123!"})
    assert response.status_code == 400
    assert response.json()["detail"] == "Please enter your Student ID, Roll Number, or Email."

    response_ws = client.post("/api/auth/login", json={"email": "   ", "password": "Password123!"})
    assert response_ws.status_code == 400
    assert response_ws.json()["detail"] == "Please enter your Student ID, Roll Number, or Email."

def test_empty_password_validation():
    """Empty or whitespace password returns 400 with specific client guidance."""
    response = client.post("/api/auth/login", json={"email": "test@college.edu", "password": ""})
    assert response.status_code == 400
    assert response.json()["detail"] == "Please enter your password."

    response_ws = client.post("/api/auth/login", json={"email": "test@college.edu", "password": "   "})
    assert response_ws.status_code == 400
    assert response_ws.json()["detail"] == "Please enter your password."

def test_invalid_credentials_nonexistent_user():
    """Nonexistent user returns standard safe failure message without enumeration."""
    response = client.post("/api/auth/login", json={
        "email": "completely_nonexistent_99999@college.edu",
        "password": "WrongPassword123!"
    })
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect ID/email or password. Please check your credentials and try again."

def test_invalid_credentials_wrong_password(db: Session):
    """Existing user with wrong password returns identical safe failure message (anti-enumeration)."""
    student = db.query(User).filter(User.role == "student").first()
    assert student is not None

    response = client.post("/api/auth/login", json={
        "email": student.email,
        "password": "WrongPassword99999!"
    })
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect ID/email or password. Please check your credentials and try again."

def test_inactive_account_rejection(db: Session):
    """Inactive account with correct credentials returns 403 with inactive guidance."""
    user = db.query(User).filter(User.email == "inactive_test_user@college.edu").first()
    if not user:
        user = User(
            email="inactive_test_user@college.edu",
            password_hash=get_password_hash("TestPassword123!"),
            full_name="Inactive User",
            role="student",
            is_active=False
        )
        db.add(user)
        db.commit()
    else:
        user.is_active = False
        user.password_hash = get_password_hash("TestPassword123!")
        db.commit()

    try:
        response = client.post("/api/auth/login", json={
            "email": "inactive_test_user@college.edu",
            "password": "TestPassword123!"
        })
        assert response.status_code == 403
        assert "inactive" in response.json()["detail"].lower()
    finally:
        # Cleanup
        db.delete(user)
        db.commit()

def test_portal_role_mismatch(db: Session):
    """Student trying to log into Administrator or Faculty portal gets 403 role mismatch."""
    student_user = db.query(User).filter(User.role == "student").first()
    assert student_user is not None

    # Reset password to known test password
    student_user.password_hash = get_password_hash("ValidPass123!")
    student_user.is_active = True
    db.commit()

    # Attempt login with Administrator portal
    res_mismatch = client.post("/api/auth/login", json={
        "email": student_user.email,
        "password": "ValidPass123!",
        "portal_role": "admin"
    })
    assert res_mismatch.status_code == 403
    assert res_mismatch.json()["detail"] == "The selected portal role does not match this account. Please select the correct portal role."

    # Attempt login with Faculty portal
    res_mismatch_fac = client.post("/api/auth/login", json={
        "email": student_user.email,
        "password": "ValidPass123!",
        "portal_role": "faculty"
    })
    assert res_mismatch_fac.status_code == 403
    assert res_mismatch_fac.json()["detail"] == "The selected portal role does not match this account. Please select the correct portal role."

def test_portal_role_match_success(db: Session):
    """Correct credentials with matching portal role succeeds."""
    student_user = db.query(User).filter(User.role == "student").first()
    assert student_user is not None
    student_user.password_hash = get_password_hash("ValidPass123!")
    student_user.is_active = True
    db.commit()

    res = client.post("/api/auth/login", json={
        "email": student_user.email,
        "password": "ValidPass123!",
        "portal_role": "student"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["role"] == "student"

def test_roll_number_login(db: Session):
    """Student can log in using roll_number."""
    student_record = db.query(Student).first()
    if student_record and student_record.user:
        student_record.user.password_hash = get_password_hash("ValidPass123!")
        student_record.user.is_active = True
        db.commit()

        if student_record.roll_number:
            res_roll = client.post("/api/auth/login", json={
                "email": student_record.roll_number,
                "password": "ValidPass123!",
                "portal_role": "student"
            })
            assert res_roll.status_code == 200
            assert res_roll.json()["role"] == "student"

def test_no_sensitive_info_in_responses():
    """Verify that error responses do not leak password hashes, SQL, or internal stack traces."""
    res = client.post("/api/auth/login", json={
        "email": "bad' OR '1'='1",
        "password": "some_password"
    })
    assert res.status_code in [400, 401]
    body = res.text.lower()
    assert "hash" not in body
    assert "traceback" not in body
    assert "select" not in body
    assert "sqlite" not in body
    assert "syntax error" not in body
