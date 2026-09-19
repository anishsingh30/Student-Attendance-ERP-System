import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.user import User
from app.models.notification import Notification
from app.services.email_service import email_service
from app.core.security import create_access_token
from app.core.config import settings

client = TestClient(app)

def test_notification_creation_and_disabled_smtp_handling():
    """Verify in-app notification creation and honest status recording when SMTP is disabled."""
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.role == "student").first()
        admin = db.query(User).filter(User.role == "admin").first()
        assert user is not None
        assert admin is not None

        # Create notification record
        notif = Notification(
            user_id=user.id,
            title="Attendance Warning",
            message="Your attendance is below 75%",
            notification_type="WARNING",
            channel="IN_APP",
            status="SENT",
            is_read=False
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)

        # Dispatch via email_service when EMAIL_ENABLED is False
        settings.EMAIL_ENABLED = False
        dispatched = email_service.dispatch_notification_email(db, notif.id)
        assert dispatched is False
        db.refresh(notif)
        assert notif.status == "SENT"  # In-app was sent, email was skipped honestly
        assert "disabled or credentials unconfigured" in (notif.error_message or "")

        # Test retry endpoint with admin auth
        admin_token = create_access_token({"sub": admin.email, "role": admin.role, "user_id": admin.id})
        headers = {"Authorization": f"Bearer {admin_token}"}
        res = client.post(f"/api/notifications/{notif.id}/retry", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert data["notification_id"] == notif.id

        # Mark notification as read
        user_token = create_access_token({"sub": user.email, "role": user.role, "user_id": user.id})
        user_headers = {"Authorization": f"Bearer {user_token}"}
        res_read = client.put(f"/api/notifications/{notif.id}/read", json={"is_read": True}, headers=user_headers)
        assert res_read.status_code == 200
        assert res_read.json()["is_read"] is True

    finally:
        if 'notif' in locals() and notif.id:
            db.query(Notification).filter(Notification.id == notif.id).delete()
            db.commit()
        db.close()
