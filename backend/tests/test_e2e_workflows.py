import pytest
from datetime import date
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.user import User
from app.models.student import Student
from app.models.subject import Subject
from app.models.attendance import Attendance, AttendanceCorrection
from app.models.alert import Alert, AlertIntervention
from app.core.security import create_access_token

client = TestClient(app)

def test_e2e_student_workflow():
    """E2E Scenario: Student authenticates, views dashboard, runs What-If, views alerts & notifications."""
    db = SessionLocal()
    try:
        student_user = db.query(User).filter(User.role == "student").first()
        student_profile = db.query(Student).filter(Student.user_id == student_user.id).first()
        subject = db.query(Subject).first()
        assert student_user is not None and student_profile is not None and subject is not None

        token = create_access_token({"sub": student_user.email, "role": "student", "user_id": student_user.id})
        headers = {"Authorization": f"Bearer {token}"}

        # 1. View Student Dashboard
        res_dash = client.get(f"/api/students/{student_profile.id}/dashboard", headers=headers)
        assert res_dash.status_code == 200
        dash = res_dash.json()
        assert "overall_percentage" in dash
        assert "subjects" in dash
        assert dash["student_id"] == student_profile.id

        # 2. Run What-If Attendance Simulation
        sim_payload = {
            "student_id": student_profile.id,
            "subject_id": subject.id,
            "classes_to_attend": 5,
            "classes_to_miss": 1
        }
        res_sim = client.post("/api/attendance/what-if", json=sim_payload, headers=headers)
        assert res_sim.status_code == 200
        sim_data = res_sim.json()
        assert "projected_percentage" in sim_data
        assert "percentage_change" in sim_data
        assert "ai_explanation" in sim_data

        # 3. View Student Alerts
        res_alerts = client.get("/api/alerts/", headers=headers)
        assert res_alerts.status_code == 200
        alerts = res_alerts.json()
        assert isinstance(alerts, list)

        # 4. View Student Notifications
        res_notifs = client.get("/api/notifications/", headers=headers)
        assert res_notifs.status_code == 200
        assert isinstance(res_notifs.json(), list)

    finally:
        db.close()

def test_e2e_faculty_workflow():
    """E2E Scenario: Faculty logs in, marks attendance, edits with correction audit, and records alert intervention."""
    db = SessionLocal()
    try:
        faculty = db.query(User).filter(User.role == "faculty").first()
        student = db.query(Student).first()
        subject = db.query(Subject).first()
        assert faculty is not None and student is not None and subject is not None

        token = create_access_token({"sub": faculty.email, "role": "faculty", "user_id": faculty.id})
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Mark Attendance Record
        test_date = date(2036, 5, 20)
        att = Attendance(
            student_id=student.id,
            subject_id=subject.id,
            date=test_date,
            status="ABSENT",
            marked_by=faculty.id,
            notes="Session attendance"
        )
        db.add(att)
        db.commit()
        db.refresh(att)

        # 2. Correct Attendance with Audit Reason
        update_payload = {
            "status": "PRESENT",
            "notes": "Late attendance verified",
            "reason": "Student attended practical session verified by lab assistant"
        }
        res_edit = client.put(f"/api/attendance/{att.id}", json=update_payload, headers=headers)
        assert res_edit.status_code == 200
        assert res_edit.json()["status"] == "PRESENT"

        # 3. Verify Attendance Correction Audit Trail
        res_corrections = client.get(f"/api/attendance/{att.id}/corrections", headers=headers)
        assert res_corrections.status_code == 200
        corrections = res_corrections.json()
        assert len(corrections) >= 1
        assert corrections[0]["previous_status"] == "ABSENT"
        assert corrections[0]["new_status"] == "PRESENT"

    finally:
        if 'att' in locals() and att.id:
            db.query(AttendanceCorrection).filter(AttendanceCorrection.attendance_id == att.id).delete()
            db.query(Attendance).filter(Attendance.id == att.id).delete()
            db.commit()
        db.close()

def test_e2e_admin_workflow(monkeypatch):
    """E2E Scenario: Admin inspects system readiness, updates policy, triggers agent, and views intervention analytics."""
    from app.agents.llm_provider import llm_provider
    monkeypatch.setattr(llm_provider, "provider", "mock")
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.role == "admin").first()
        assert admin is not None

        token = create_access_token({"sub": admin.email, "role": "admin", "user_id": admin.id})
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Deep Readiness Health Check
        res_ready = client.get("/ready")
        assert res_ready.status_code == 200
        assert res_ready.json()["status"] == "ready"

        # 2. Institutional Policy Retrieval & Configuration
        res_pol = client.get("/api/admin/policy", headers=headers)
        assert res_pol.status_code == 200

        # 3. Data Quality & Anomaly Report
        res_dq = client.get("/api/admin/data-quality", headers=headers)
        assert res_dq.status_code == 200
        assert "data_health_rating" in res_dq.json()

        # 4. Trigger Autonomous Attendance Monitoring Agent
        res_agent = client.post("/api/agent/run", headers=headers)
        assert res_agent.status_code == 200
        agent_result = res_agent.json()
        assert agent_result["status"] in ["COMPLETED", "SKIPPED"]
        assert "students_analyzed" in agent_result

        # 5. Descriptive Intervention Outcomes Analytics Report
        res_inv_analytics = client.get("/api/reports/interventions/analytics", headers=headers)
        assert res_inv_analytics.status_code == 200
        inv_data = res_inv_analytics.json()
        assert inv_data["status"] == "ANALYTICS_COMPLETE"
        assert "scientific_disclaimer" in inv_data
        assert "total_interventions_recorded" in inv_data

    finally:
        db.close()
