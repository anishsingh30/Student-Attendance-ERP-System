import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.core.security import create_access_token
from app.models.user import User
from app.models.student import Student

client = TestClient(app)

def get_token_by_role(role: str) -> str:
    db = SessionLocal()
    try:
        u = db.query(User).filter(User.role == role).first()
        assert u is not None, f"No user with role {role}"
        return create_access_token({"sub": u.email, "role": u.role, "id": u.id})
    finally:
        db.close()

def test_reports_at_risk_json_and_csv():
    """Verify statutory at-risk report JSON endpoint and streaming CSV export."""
    faculty_token = get_token_by_role("faculty")

    # JSON report
    res = client.get("/api/reports/at-risk", headers={"Authorization": f"Bearer {faculty_token}"})
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)

    # CSV export
    res_csv = client.get("/api/reports/at-risk/csv", headers={"Authorization": f"Bearer {faculty_token}"})
    assert res_csv.status_code == 200
    assert "text/csv" in res_csv.headers["content-type"]
    assert "Roll Number,Student Name" in res_csv.text

def test_student_individual_csv_export():
    """Verify student individual attendance CSV download."""
    db = SessionLocal()
    try:
        student = db.query(Student).first()
        assert student is not None
        user = db.query(User).filter(User.id == student.user_id).first()
        token = create_access_token({"sub": user.email, "role": user.role, "id": user.id})

        res_csv = client.get(f"/api/reports/student/{student.id}/csv", headers={"Authorization": f"Bearer {token}"})
        assert res_csv.status_code == 200
        assert "text/csv" in res_csv.headers["content-type"]
        assert "Date,Course Code,Course Name,Status,Notes" in res_csv.text
    finally:
        db.close()

def test_admin_reports_access():
    """Verify admin subject and department summary reports."""
    admin_token = get_token_by_role("admin")

    res_subs = client.get("/api/reports/subjects", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_subs.status_code == 200
    assert isinstance(res_subs.json(), list)

    res_dept = client.get("/api/reports/departments", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_dept.status_code == 200
    assert isinstance(res_dept.json(), list)
