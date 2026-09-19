import pytest
import io
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.core.database import SessionLocal
from app.models.user import User
from app.models.student import Student
from app.models.faculty import Faculty
from app.core.security import create_access_token, get_password_hash

client = TestClient(app)

@pytest.fixture
def db():
    from app.core.rate_limiter import limiter
    limiter.requests.clear()
    session = SessionLocal()
    yield session
    session.close()

def test_login_with_roll_number(db: Session):
    st = db.query(Student).filter(Student.roll_number == "CS2022-001").first()
    if st and st.user:
        from app.core.security import get_password_hash
        st.user.password_hash = get_password_hash("student123")
        db.commit()
    # Test logging in with roll number CS2022-001 instead of email
    resp = client.post(
        "/api/auth/login",
        json={"email": "CS2022-001", "password": "student123"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["role"] == "student"
    assert data["email"] == "rahul.verma@college.edu"

def test_login_with_employee_id(db: Session):
    from app.models.faculty import Faculty
    from app.core.security import get_password_hash
    fac = db.query(Faculty).filter(Faculty.employee_id == "EMP-101").first()
    if fac and fac.user:
        fac.user.password_hash = get_password_hash("faculty123")
        db.commit()
    # Test logging in with employee ID EMP-101 instead of email
    resp = client.post(
        "/api/auth/login",
        json={"email": "EMP-101", "password": "faculty123"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["role"] == "faculty"
    assert data["email"] == "faculty.rajesh@college.edu"

def test_profile_photo_upload_and_removal(db: Session):
    user = db.query(User).filter(User.role == "student").first()
    token = create_access_token(data={"sub": user.email, "role": user.role, "id": user.id})

    # Create dummy image bytes
    image_content = b"\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xFF\xDB\x00C\x00"
    file = io.BytesIO(image_content)

    resp = client.post(
        "/api/auth/profile/photo",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("test_avatar.jpg", file, "image/jpeg")}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["profile_photo_url"] is not None
    assert "uploads/avatars" in data["profile_photo_url"]

    # Test removal
    resp_del = client.delete(
        "/api/auth/profile/photo",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp_del.status_code == 200
    assert resp_del.json()["profile_photo_url"] is None
