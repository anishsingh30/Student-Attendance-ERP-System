"""
Regression tests for the Mark Unresolved / Alert Reopen lifecycle bug.

Root cause: The alerts table has a partial unique index on (student_id, subject_id)
WHERE is_resolved=0. When the agent creates a new alert for the same student+subject
after an old one was resolved, reopening the old one crashed with 500 IntegrityError.

The fix:
 - Backend returns 409 with a clear message when a newer unresolved alert blocks reopen
 - Idempotency guards prevent duplicate interventions
 - Frontend uses authoritative backend response (not optimistic toggle)
 - Frontend shows per-alert error banners and loading state

Tests:
  A. Resolve alert
  B. Reopen resolved alert (Mark Unresolved) - primary failing scenario
  C. Reopen alert with intervention history (history preserved)
  D. Reopen agent-generated alert (lifecycle_status check)
  E. Reopen alerts for different severity levels (RED, ORANGE, YELLOW)
  F. Reopen alerts for multiple different subjects
  G. Unauthorized user attempting reopen of another student's alert -> 403
  H. Invalid alert ID -> 404
  I. Already-unresolved alert -> idempotent, no duplicate interventions
  J. Repeated reopen request -> idempotent
  K. Database persistence: reopened state survives DB reload (page refresh)
  L. Audit/intervention record created on each state change
  M. Correct lifecycle_status returned in response
  N. CRITICAL: Newer unresolved alert blocks reopen -> 409 (not 500)
"""

import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.core.database import SessionLocal
from app.models.user import User
from app.models.student import Student
from app.models.subject import Subject
from app.models.alert import Alert, AlertIntervention
from app.core.security import create_access_token

client = TestClient(app)


# --- Helpers -----------------------------------------------------------------

def _get_db():
    return SessionLocal()

def _token(user):
    return create_access_token({"sub": user.email, "role": user.role, "id": user.id})

def _headers(user):
    return {"Authorization": f"Bearer {_token(user)}"}

def _make_alert(db, student, subject, *, risk_level="RED", percentage=60.0,
                is_resolved=False, lifecycle_status="NEW"):
    a = Alert(
        student_id=student.id,
        subject_id=subject.id,
        risk_level=risk_level,
        current_percentage=percentage,
        required_percentage=75.0,
        classes_attended=int(percentage * 30 / 100),
        classes_conducted=30,
        classes_required=max(0, int((75.0 * 30 - percentage * 30) / 25)),
        title=f"Test Alert - {risk_level} - {percentage}pct",
        explanation="Automated regression test alert.",
        recommended_action="Attend all sessions.",
        lifecycle_status=lifecycle_status,
        is_resolved=is_resolved,
    )
    db.add(a)
    db.commit()
    db.refresh(a)
    return a

def _clean(db, student_id, subject_id):
    subq = db.query(Alert.id).filter(
        Alert.student_id == student_id,
        Alert.subject_id == subject_id
    ).scalar_subquery()
    db.query(AlertIntervention).filter(AlertIntervention.alert_id.in_(subq)).delete(synchronize_session=False)
    db.query(Alert).filter(Alert.student_id == student_id, Alert.subject_id == subject_id).delete()
    db.commit()


# --- Tests -------------------------------------------------------------------

def test_A_resolve_alert():
    """A. Resolve an active alert - lifecycle_status becomes RESOLVED."""
    db = _get_db()
    try:
        student = db.query(Student).first()
        subject = db.query(Subject).filter(Subject.is_active == True).first()
        admin = db.query(User).filter(User.role == "admin").first()
        _clean(db, student.id, subject.id)
        alert = _make_alert(db, student, subject)

        resp = client.put(f"/api/alerts/{alert.id}/resolve",
                          json={"is_resolved": True, "notes": "Recovered."},
                          headers=_headers(admin))
        assert resp.status_code == 200
        data = resp.json()
        assert data["is_resolved"] is True
        assert data["lifecycle_status"] == "RESOLVED"
        assert data["resolved_at"] is not None
        assert data["resolved_by_user_id"] == admin.id
    finally:
        _clean(db, student.id, subject.id)
        db.close()


def test_B_reopen_resolved_alert():
    """B. Mark Unresolved - primary failing scenario. Reopen a resolved alert (no conflict)."""
    db = _get_db()
    try:
        student = db.query(Student).first()
        subject = db.query(Subject).filter(Subject.is_active == True).first()
        admin = db.query(User).filter(User.role == "admin").first()
        _clean(db, student.id, subject.id)
        alert = _make_alert(db, student, subject, risk_level="ORANGE", percentage=68.0,
                            is_resolved=True, lifecycle_status="RESOLVED")
        alert.resolved_at = datetime.now(timezone.utc)
        alert.resolved_by_user_id = admin.id
        db.commit()

        resp = client.put(f"/api/alerts/{alert.id}/resolve",
                          json={"is_resolved": False, "notes": "Reopening for monitoring."},
                          headers=_headers(admin))
        assert resp.status_code == 200, f"Got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert data["is_resolved"] is False
        assert data["lifecycle_status"] == "NEW"
        assert data["resolved_at"] is None
        assert data["resolved_by_user_id"] is None
        # Attendance data unchanged
        assert data["current_percentage"] == 68.0
        assert data["classes_conducted"] == 30
    finally:
        _clean(db, student.id, subject.id)
        db.close()


def test_C_reopen_alert_with_intervention_history():
    """C. Reopen alert that already has interventions - history preserved, REOPENED added."""
    db = _get_db()
    try:
        student = db.query(Student).first()
        subject = db.query(Subject).filter(Subject.is_active == True).first()
        faculty = db.query(User).filter(User.role == "faculty").first()
        admin = db.query(User).filter(User.role == "admin").first()
        _clean(db, student.id, subject.id)
        alert = _make_alert(db, student, subject, risk_level="RED", percentage=55.0)

        client.post(f"/api/alerts/{alert.id}/acknowledge",
                    json={"notes": "Reviewed"},
                    headers=_headers(faculty))
        client.put(f"/api/alerts/{alert.id}/resolve",
                   json={"is_resolved": True},
                   headers=_headers(admin))

        resp = client.put(f"/api/alerts/{alert.id}/resolve",
                          json={"is_resolved": False},
                          headers=_headers(admin))
        assert resp.status_code == 200
        assert resp.json()["is_resolved"] is False

        inv_resp = client.get(f"/api/alerts/{alert.id}/interventions", headers=_headers(admin))
        actions = [i["action_type"] for i in inv_resp.json()]
        assert "ACKNOWLEDGED" in actions
        assert "RESOLVED" in actions
        assert "REOPENED" in actions
    finally:
        _clean(db, student.id, subject.id)
        db.close()


def test_D_reopen_agent_generated_alert():
    """D. Reopen an alert with lifecycle_status=NEW (agent-created) after resolving."""
    db = _get_db()
    try:
        student = db.query(Student).first()
        subject = db.query(Subject).filter(Subject.is_active == True).first()
        admin = db.query(User).filter(User.role == "admin").first()
        _clean(db, student.id, subject.id)
        alert = _make_alert(db, student, subject, risk_level="RED", percentage=59.0)
        client.put(f"/api/alerts/{alert.id}/resolve", json={"is_resolved": True}, headers=_headers(admin))

        resp = client.put(f"/api/alerts/{alert.id}/resolve", json={"is_resolved": False}, headers=_headers(admin))
        assert resp.status_code == 200
        assert resp.json()["lifecycle_status"] == "NEW"
    finally:
        _clean(db, student.id, subject.id)
        db.close()


def test_E_reopen_different_severity_levels():
    """E. Reopen alerts for RED, ORANGE, YELLOW - all must work identically."""
    db = _get_db()
    try:
        student = db.query(Student).first()
        subject = db.query(Subject).filter(Subject.is_active == True).first()
        admin = db.query(User).filter(User.role == "admin").first()

        for risk, pct in [("RED", 58.0), ("ORANGE", 68.0), ("YELLOW", 72.0)]:
            _clean(db, student.id, subject.id)
            alert = _make_alert(db, student, subject, risk_level=risk, percentage=pct,
                                is_resolved=True, lifecycle_status="RESOLVED")
            alert.resolved_at = datetime.now(timezone.utc)
            db.commit()

            resp = client.put(f"/api/alerts/{alert.id}/resolve",
                              json={"is_resolved": False},
                              headers=_headers(admin))
            assert resp.status_code == 200, f"Severity {risk}: {resp.text}"
            assert resp.json()["lifecycle_status"] == "NEW", f"Severity {risk}"
            assert resp.json()["is_resolved"] is False
    finally:
        _clean(db, student.id, subject.id)
        db.close()


def test_F_reopen_multiple_subjects():
    """F. Reopen alerts across multiple different subjects."""
    db = _get_db()
    student = db.query(Student).first()
    subjects = db.query(Subject).filter(Subject.is_active == True).limit(3).all()
    admin = db.query(User).filter(User.role == "admin").first()
    created = []
    try:
        for subj in subjects:
            _clean(db, student.id, subj.id)
            a = _make_alert(db, student, subj, is_resolved=True, lifecycle_status="RESOLVED")
            a.resolved_at = datetime.now(timezone.utc)
            db.commit()
            created.append((a.id, student.id, subj.id))

        for alert_id, sid, sbjid in created:
            resp = client.put(f"/api/alerts/{alert_id}/resolve",
                              json={"is_resolved": False},
                              headers=_headers(admin))
            assert resp.status_code == 200, f"Alert {alert_id}: {resp.text}"
    finally:
        for _, sid, sbjid in created:
            _clean(db, sid, sbjid)
        db.close()


def test_G_unauthorized_cross_student_access():
    """G. Student cannot reopen another student's alert - must get 403."""
    db = _get_db()
    try:
        student = db.query(Student).first()
        subject = db.query(Subject).filter(Subject.is_active == True).first()
        admin = db.query(User).filter(User.role == "admin").first()
        other_student_user = db.query(User).filter(User.role == "student", User.id != student.user_id).first()
        if not other_student_user:
            pytest.skip("Only one student in DB - cannot test cross-student access")

        _clean(db, student.id, subject.id)
        alert = _make_alert(db, student, subject, is_resolved=True, lifecycle_status="RESOLVED")
        alert.resolved_at = datetime.now(timezone.utc)
        db.commit()

        resp = client.put(f"/api/alerts/{alert.id}/resolve",
                          json={"is_resolved": False},
                          headers=_headers(other_student_user))
        assert resp.status_code == 403
    finally:
        _clean(db, student.id, subject.id)
        db.close()


def test_H_invalid_alert_id_returns_404():
    """H. Resolving a non-existent alert returns 404."""
    db = _get_db()
    try:
        admin = db.query(User).filter(User.role == "admin").first()
        resp = client.put("/api/alerts/999999999/resolve",
                          json={"is_resolved": False},
                          headers=_headers(admin))
        assert resp.status_code == 404
    finally:
        db.close()


def test_I_already_unresolved_is_idempotent():
    """I. Calling is_resolved=False on an already-unresolved alert: idempotent, no new interventions."""
    db = _get_db()
    try:
        student = db.query(Student).first()
        subject = db.query(Subject).filter(Subject.is_active == True).first()
        admin = db.query(User).filter(User.role == "admin").first()
        _clean(db, student.id, subject.id)
        alert = _make_alert(db, student, subject, is_resolved=False)

        inv_before = db.query(AlertIntervention).filter(AlertIntervention.alert_id == alert.id).count()

        resp = client.put(f"/api/alerts/{alert.id}/resolve",
                          json={"is_resolved": False},
                          headers=_headers(admin))
        assert resp.status_code == 200
        assert resp.json()["is_resolved"] is False

        db.expire_all()
        inv_after = db.query(AlertIntervention).filter(AlertIntervention.alert_id == alert.id).count()
        assert inv_after == inv_before, "No-op reopen created a duplicate intervention"
    finally:
        _clean(db, student.id, subject.id)
        db.close()


def test_J_repeated_reopen_is_idempotent():
    """J. Calling Mark Unresolved twice: second call idempotent, no duplicate intervention."""
    db = _get_db()
    try:
        student = db.query(Student).first()
        subject = db.query(Subject).filter(Subject.is_active == True).first()
        admin = db.query(User).filter(User.role == "admin").first()
        _clean(db, student.id, subject.id)
        alert = _make_alert(db, student, subject, is_resolved=True, lifecycle_status="RESOLVED")
        alert.resolved_at = datetime.now(timezone.utc)
        db.commit()

        # First reopen
        r1 = client.put(f"/api/alerts/{alert.id}/resolve", json={"is_resolved": False}, headers=_headers(admin))
        assert r1.status_code == 200
        inv_after_first = db.query(AlertIntervention).filter(AlertIntervention.alert_id == alert.id).count()

        # Second reopen (already NEW)
        r2 = client.put(f"/api/alerts/{alert.id}/resolve", json={"is_resolved": False}, headers=_headers(admin))
        assert r2.status_code == 200
        assert r2.json()["is_resolved"] is False
        inv_after_second = db.query(AlertIntervention).filter(AlertIntervention.alert_id == alert.id).count()
        assert inv_after_second == inv_after_first, "Duplicate intervention created on idempotent reopen"
    finally:
        _clean(db, student.id, subject.id)
        db.close()


def test_K_db_persistence_survives_reload():
    """K. Reopened state persists when loaded in a fresh DB session (simulates page refresh)."""
    db = _get_db()
    alert_id = None
    student_id = subject_id = None
    try:
        student = db.query(Student).first()
        subject = db.query(Subject).filter(Subject.is_active == True).first()
        admin = db.query(User).filter(User.role == "admin").first()
        student_id, subject_id = student.id, subject.id
        _clean(db, student.id, subject.id)
        alert = _make_alert(db, student, subject, is_resolved=True, lifecycle_status="RESOLVED")
        alert.resolved_at = datetime.now(timezone.utc)
        db.commit()
        alert_id = alert.id

        client.put(f"/api/alerts/{alert.id}/resolve", json={"is_resolved": False}, headers=_headers(admin))
    finally:
        db.close()

    # Reload from fresh session
    db2 = _get_db()
    try:
        persisted = db2.query(Alert).filter(Alert.id == alert_id).first()
        assert persisted is not None
        assert persisted.is_resolved is False, "is_resolved not persisted"
        assert persisted.lifecycle_status == "NEW", "lifecycle_status not persisted"
        assert persisted.resolved_at is None, "resolved_at should be None after reopen"
    finally:
        _clean(db2, student_id, subject_id)
        db2.close()


def test_L_audit_intervention_record_on_reopen():
    """L. Successful reopen creates exactly one REOPENED intervention with correct metadata."""
    db = _get_db()
    try:
        student = db.query(Student).first()
        subject = db.query(Subject).filter(Subject.is_active == True).first()
        admin = db.query(User).filter(User.role == "admin").first()
        _clean(db, student.id, subject.id)
        alert = _make_alert(db, student, subject, is_resolved=True, lifecycle_status="RESOLVED")
        alert.resolved_at = datetime.now(timezone.utc)
        db.commit()

        client.put(f"/api/alerts/{alert.id}/resolve", json={"is_resolved": False}, headers=_headers(admin))

        db.expire_all()
        interventions = db.query(AlertIntervention).filter(AlertIntervention.alert_id == alert.id).all()
        reopened = [i for i in interventions if i.action_type == "REOPENED"]
        assert len(reopened) == 1, f"Expected 1 REOPENED record, got {len(reopened)}"
        rec = reopened[0]
        assert rec.previous_status == "RESOLVED"
        assert rec.new_status == "NEW"
        assert rec.performed_by_user_id == admin.id
        assert rec.outcome_status == "PENDING"
    finally:
        _clean(db, student.id, subject.id)
        db.close()


def test_M_correct_lifecycle_status_in_response():
    """M. Response always contains authoritative lifecycle_status through resolve/reopen cycle."""
    db = _get_db()
    try:
        student = db.query(Student).first()
        subject = db.query(Subject).filter(Subject.is_active == True).first()
        admin = db.query(User).filter(User.role == "admin").first()
        _clean(db, student.id, subject.id)
        alert = _make_alert(db, student, subject)

        r1 = client.put(f"/api/alerts/{alert.id}/resolve", json={"is_resolved": True}, headers=_headers(admin))
        assert r1.json()["lifecycle_status"] == "RESOLVED"
        assert r1.json()["is_resolved"] is True

        r2 = client.put(f"/api/alerts/{alert.id}/resolve", json={"is_resolved": False}, headers=_headers(admin))
        assert r2.json()["lifecycle_status"] == "NEW"
        assert r2.json()["is_resolved"] is False
    finally:
        _clean(db, student.id, subject.id)
        db.close()


def test_N_newer_active_alert_blocks_reopen_with_409():
    """N. CRITICAL BUG SCENARIO: When agent creates new alert after old one was resolved,
    reopening old alert returns 409 (not 500 IntegrityError) with clear message."""
    db = _get_db()
    try:
        student = db.query(Student).first()
        subject = db.query(Subject).filter(Subject.is_active == True).first()
        admin = db.query(User).filter(User.role == "admin").first()
        _clean(db, student.id, subject.id)

        # Old alert, already resolved
        old_alert = _make_alert(db, student, subject, risk_level="RED", percentage=58.0,
                                is_resolved=True, lifecycle_status="RESOLVED")
        old_alert.resolved_at = datetime.now(timezone.utc)
        db.commit()

        # Agent creates a new active alert for the same student+subject
        new_alert = Alert(
            student_id=student.id, subject_id=subject.id,
            risk_level="ORANGE", current_percentage=64.0,
            required_percentage=75.0, classes_attended=19,
            classes_conducted=30, classes_required=4,
            title="Agent Re-issued Alert", explanation="Updated cycle",
            recommended_action="Attend lectures", lifecycle_status="NEW",
            is_resolved=False,
        )
        db.add(new_alert)
        db.commit()
        db.refresh(new_alert)

        # Attempt to reopen the OLD resolved alert -> must 409
        resp = client.put(
            f"/api/alerts/{old_alert.id}/resolve",
            json={"is_resolved": False},
            headers=_headers(admin),
        )
        assert resp.status_code == 409, f"Expected 409, got {resp.status_code}: {resp.text}"
        detail = resp.json().get("detail", "")
        assert "newer" in detail.lower() or "already exists" in detail.lower(), \
            f"409 message should mention newer alert, got: {detail}"

        # Old alert still resolved
        db.expire_all()
        assert db.query(Alert).filter(Alert.id == old_alert.id).first().is_resolved is True
        # New alert still active
        assert db.query(Alert).filter(Alert.id == new_alert.id).first().is_resolved is False
    finally:
        _clean(db, student.id, subject.id)
        db.close()
