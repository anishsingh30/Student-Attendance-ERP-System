import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.core.database import SessionLocal
from app.models.user import User
from app.models.student import Student
from app.models.faculty import Faculty
from app.core.security import create_access_token

client = TestClient(app)

@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()

def get_admin_token(db: Session) -> str:
    admin = db.query(User).filter(User.role == "admin").first()
    return create_access_token(data={"sub": admin.email, "role": admin.role, "id": admin.id})

def get_student_token(db: Session) -> str:
    student = db.query(User).filter(User.role == "student").first()
    return create_access_token(data={"sub": student.email, "role": student.role, "id": student.id})

def test_admin_add_student(db: Session):
    token = get_admin_token(db)
    payload = {
        "email": "new.student@college.edu",
        "password": "StrongPassword123!",
        "full_name": "New Enrolled Student",
        "roll_number": "CS2022-999",
        "department": "Computer Science",
        "semester": 5,
        "section": "A"
    }
    
    # Delete if exists
    existing = db.query(User).filter(User.email == payload["email"]).first()
    if existing:
        db.delete(existing)
        db.commit()

    resp = client.post(
        "/api/admin/students",
        headers={"Authorization": f"Bearer {token}"},
        json=payload
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["roll_number"] == "CS2022-999"
    assert data["email"] == "new.student@college.edu"

    # Verify student profile in database
    st = db.query(Student).filter(Student.roll_number == "CS2022-999").first()
    assert st is not None
    assert st.user.full_name == "New Enrolled Student"

def test_admin_add_faculty(db: Session):
    token = get_admin_token(db)
    payload = {
        "email": "new.faculty@college.edu",
        "password": "StrongPassword123!",
        "full_name": "Dr. New Faculty",
        "employee_id": "EMP-999",
        "department": "Computer Science",
        "designation": "Associate Professor"
    }

    # Delete if exists
    existing = db.query(User).filter(User.email == payload["email"]).first()
    if existing:
        db.delete(existing)
        db.commit()

    resp = client.post(
        "/api/admin/faculty",
        headers={"Authorization": f"Bearer {token}"},
        json=payload
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["employee_id"] == "EMP-999"

    fac = db.query(Faculty).filter(Faculty.employee_id == "EMP-999").first()
    assert fac is not None
    assert fac.user.full_name == "Dr. New Faculty"

def test_admin_user_status_toggle_and_password_reset(db: Session):
    token = get_admin_token(db)
    
    # Get a student to update
    st_user = db.query(User).filter(User.role == "student").first()
    assert st_user is not None

    # Toggle status to inactive
    resp = client.put(
        f"/api/admin/users/{st_user.id}/status",
        headers={"Authorization": f"Bearer {token}"},
        json={"is_active": False}
    )
    assert resp.status_code == 200
    assert resp.json()["is_active"] is False

    # Restore active
    resp2 = client.put(
        f"/api/admin/users/{st_user.id}/status",
        headers={"Authorization": f"Bearer {token}"},
        json={"is_active": True}
    )
    assert resp2.status_code == 200
    assert resp2.json()["is_active"] is True

    # Reset password
    resp3 = client.post(
        f"/api/admin/users/{st_user.id}/reset-password",
        headers={"Authorization": f"Bearer {token}"},
        json={"new_password": "NewResetPassword123!"}
    )
    assert resp3.status_code == 200

def test_student_cannot_access_admin_endpoints(db: Session):
    st_token = get_student_token(db)
    resp = client.get("/api/admin/users", headers={"Authorization": f"Bearer {st_token}"})
    assert resp.status_code == 403
