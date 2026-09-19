import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.core.database import SessionLocal
from app.models.user import User
from app.models.subject import Subject
from app.models.attendance import Attendance
from app.models.student import Student
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

def get_faculty_token(db: Session) -> str:
    faculty = db.query(User).filter(User.role == "faculty").first()
    return create_access_token(data={"sub": faculty.email, "role": faculty.role, "id": faculty.id})

def test_admin_add_subject_success_and_duplicate_validation(db: Session):
    token = get_admin_token(db)
    headers = {"Authorization": f"Bearer {token}"}

    # Clean up test subject if exists
    test_code = "TEST-CS901"
    existing = db.query(Subject).filter(Subject.code == test_code).first()
    if existing:
        db.delete(existing)
        db.commit()

    # 1. Add subject
    payload = {
        "code": test_code,
        "name": "Distributed Cloud Systems",
        "department": "Computer Science",
        "semester": 6,
        "total_classes_scheduled": 45,
        "credits": 4
    }
    resp = client.post("/api/admin/subjects", headers=headers, json=payload)
    assert resp.status_code == 201
    created = resp.json()
    assert created["code"] == test_code
    assert created["name"] == "Distributed Cloud Systems"
    assert created["total_classes_scheduled"] == 45
    assert created["credits"] == 4
    assert created["is_active"] is True
    sub_id = created["id"]

    # 2. Duplicate validation
    dup_resp = client.post("/api/admin/subjects", headers=headers, json=payload)
    assert dup_resp.status_code == 400
    assert "already exists" in dup_resp.json()["detail"].lower()

    # 3. Clean up
    sub = db.query(Subject).filter(Subject.id == sub_id).first()
    if sub:
        db.delete(sub)
        db.commit()

def test_admin_subject_validation_boundaries(db: Session):
    token = get_admin_token(db)
    headers = {"Authorization": f"Bearer {token}"}

    # Missing code
    bad_payload1 = {
        "code": "",
        "name": "Invalid Subject",
        "department": "Computer Science",
        "semester": 5,
        "total_classes_scheduled": 40
    }
    resp1 = client.post("/api/admin/subjects", headers=headers, json=bad_payload1)
    assert resp1.status_code in [400, 422]

    # Invalid semester (< 1 or > 8)
    bad_payload2 = {
        "code": "TEST-SEM99",
        "name": "Invalid Sem",
        "department": "Computer Science",
        "semester": 10,
        "total_classes_scheduled": 40
    }
    resp2 = client.post("/api/admin/subjects", headers=headers, json=bad_payload2)
    assert resp2.status_code in [400, 422]

    # Invalid total classes (< 1)
    bad_payload3 = {
        "code": "TEST-ZERO",
        "name": "Zero Classes",
        "department": "Computer Science",
        "semester": 4,
        "total_classes_scheduled": 0
    }
    resp3 = client.post("/api/admin/subjects", headers=headers, json=bad_payload3)
    assert resp3.status_code in [400, 422]

def test_admin_edit_subject(db: Session):
    token = get_admin_token(db)
    headers = {"Authorization": f"Bearer {token}"}

    # Create temporary subject
    test_code = "TEST-EDIT101"
    existing = db.query(Subject).filter(Subject.code == test_code).first()
    if existing:
        db.delete(existing)
        db.commit()

    resp = client.post("/api/admin/subjects", headers=headers, json={
        "code": test_code,
        "name": "Original Name",
        "department": "Information Technology",
        "semester": 3,
        "total_classes_scheduled": 30,
        "credits": 3
    })
    assert resp.status_code == 201
    sub_id = resp.json()["id"]

    # Update subject
    update_resp = client.put(f"/api/admin/subjects/{sub_id}", headers=headers, json={
        "name": "Updated Advanced Name",
        "total_classes_scheduled": 40,
        "credits": 4
    })
    assert update_resp.status_code == 200
    updated = update_resp.json()
    assert updated["name"] == "Updated Advanced Name"
    assert updated["total_classes_scheduled"] == 40
    assert updated["credits"] == 4

    # Clean up
    sub = db.query(Subject).filter(Subject.id == sub_id).first()
    if sub:
        db.delete(sub)
        db.commit()

def test_historical_record_deletion_protection(db: Session):
    token = get_admin_token(db)
    headers = {"Authorization": f"Bearer {token}"}

    # Find a subject with attendance records
    att = db.query(Attendance).first()
    assert att is not None
    active_sub_id = att.subject_id

    # Attempt to delete a subject that has attendance records
    del_resp = client.delete(f"/api/admin/subjects/{active_sub_id}", headers=headers)
    assert del_resp.status_code == 200
    del_data = del_resp.json()
    assert del_data["archived"] is True
    assert del_data["deleted"] is False

    # Verify subject still exists in database, but is_active is False
    sub = db.query(Subject).filter(Subject.id == active_sub_id).first()
    assert sub is not None
    assert sub.is_active is False

    # Restore active status
    sub.is_active = True
    db.commit()

def test_unauthorized_subject_modification(db: Session):
    student_token = get_student_token(db)
    faculty_token = get_faculty_token(db)

    # Student cannot create subject
    st_resp = client.post(
        "/api/admin/subjects",
        headers={"Authorization": f"Bearer {student_token}"},
        json={"code": "HACK-101", "name": "Illegal Course", "department": "CS", "semester": 1, "total_classes_scheduled": 10}
    )
    assert st_resp.status_code == 403

    # Faculty cannot create subject via admin endpoint
    fac_resp = client.post(
        "/api/admin/subjects",
        headers={"Authorization": f"Bearer {faculty_token}"},
        json={"code": "FAC-101", "name": "Faculty Course", "department": "CS", "semester": 1, "total_classes_scheduled": 10}
    )
    assert fac_resp.status_code == 403

def test_pagination_and_table_metadata(db: Session):
    token = get_admin_token(db)
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Users pagination
    res_users = client.get("/api/admin/users?page=1&page_size=5", headers=headers)
    assert res_users.status_code == 200
    data_users = res_users.json()
    assert "items" in data_users
    assert "total" in data_users
    assert "page" in data_users
    assert "page_size" in data_users
    assert "total_pages" in data_users
    assert data_users["page"] == 1
    assert data_users["page_size"] == 5
    assert len(data_users["items"]) <= 5

    # 2. Notifications pagination
    res_notifs = client.get("/api/notifications/all?page=1&page_size=10", headers=headers)
    assert res_notifs.status_code == 200
    data_notifs = res_notifs.json()
    assert "items" in data_notifs
    assert "total" in data_notifs
    assert "page" in data_notifs
    assert data_notifs["page"] == 1

    # 3. Audit logs pagination
    res_audit = client.get("/api/admin/audit-logs?page=1&page_size=10", headers=headers)
    assert res_audit.status_code == 200
    data_audit = res_audit.json()
    assert "items" in data_audit
    assert "total" in data_audit
    assert "page" in data_audit
    assert data_audit["page"] == 1

    # 4. Agent runs pagination
    res_runs = client.get("/api/agent/runs?page=1&page_size=5", headers=headers)
    assert res_runs.status_code == 200
    data_runs = res_runs.json()
    assert "items" in data_runs
    assert "total" in data_runs
    assert "page" in data_runs
    assert data_runs["page"] == 1
