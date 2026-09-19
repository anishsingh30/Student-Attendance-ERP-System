import smtplib
import logging
from datetime import datetime, timezone
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.notification import Notification
from app.models.user import User

logger = logging.getLogger("attendance.email")

EMAIL_TEMPLATES = {
    "ATTENDANCE_WARNING": {
        "subject": "⚠️ Academic Attendance Warning — Action Required",
        "html": """
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #E5E7EB; border-radius: 8px; padding: 24px; background: #FFFFFF;">
            <div style="border-bottom: 2px solid #F59E0B; padding-bottom: 12px; margin-bottom: 16px;">
                <h2 style="color: #111827; margin: 0; font-size: 20px;">Apex Institute of Technology</h2>
                <p style="color: #6B7280; font-size: 12px; margin: 4px 0 0 0;">Automated Attendance Early Warning System</p>
            </div>
            <h3 style="color: #D97706; font-size: 16px;">{title}</h3>
            <p style="color: #374151; font-size: 14px; line-height: 1.6;">{message}</p>
            <div style="background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 6px; padding: 12px; margin: 16px 0; font-size: 13px; color: #92400E;">
                <strong>Required Action:</strong> Please consult with your course instructor immediately to discuss consecutive attendance recovery.
            </div>
            <p style="color: #9CA3AF; font-size: 11px; margin-top: 24px;">This is an automated notification. Please do not reply directly to this email.</p>
        </div>
        """
    },
    "CRITICAL_ALERT": {
        "subject": "🚨 CRITICAL: Examination Debarment Risk Notice",
        "html": """
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #E5E7EB; border-radius: 8px; padding: 24px; background: #FFFFFF;">
            <div style="border-bottom: 2px solid #EF4444; padding-bottom: 12px; margin-bottom: 16px;">
                <h2 style="color: #111827; margin: 0; font-size: 20px;">Apex Institute of Technology</h2>
                <p style="color: #6B7280; font-size: 12px; margin: 4px 0 0 0;">Dean of Academic Affairs • Urgent Attendance Notice</p>
            </div>
            <h3 style="color: #DC2626; font-size: 16px;">{title}</h3>
            <p style="color: #374151; font-size: 14px; line-height: 1.6;">{message}</p>
            <div style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: 6px; padding: 12px; margin: 16px 0; font-size: 13px; color: #991B1B;">
                <strong>Statutory Warning:</strong> Your course attendance is currently below 65%. Failure to achieve the required consecutive recovery threshold will result in examination debarment pursuant to Academic Regulation Sec 4.2.
            </div>
            <p style="color: #9CA3AF; font-size: 11px; margin-top: 24px;">Apex Institute of Technology • Automated Academic Governance</p>
        </div>
        """
    },
    "RECOVERY_REMINDER": {
        "subject": "📅 Attendance Recovery Progress Reminder",
        "html": """
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #E5E7EB; border-radius: 8px; padding: 24px; background: #FFFFFF;">
            <h2 style="color: #111827; margin: 0 0 12px 0;">Attendance Recovery Tracking</h2>
            <p style="color: #374151; font-size: 14px; line-height: 1.6;">{message}</p>
        </div>
        """
    },
    "ATTENDANCE_IMPROVED": {
        "subject": "✅ Attendance Status Updated: Compliant",
        "html": """
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #E5E7EB; border-radius: 8px; padding: 24px; background: #FFFFFF;">
            <h3 style="color: #059669; margin: 0 0 12px 0;">Attendance Standing Restored</h3>
            <p style="color: #374151; font-size: 14px; line-height: 1.6;">{message}</p>
        </div>
        """
    },
    "AGENT_RUN_SUMMARY": {
        "subject": "📊 Autonomous Attendance Monitoring Run Completed",
        "html": """
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #E5E7EB; border-radius: 8px; padding: 24px; background: #FFFFFF;">
            <h3 style="color: #2563EB; margin: 0 0 12px 0;">University Attendance Monitoring Cycle Summary</h3>
            <p style="color: #374151; font-size: 14px; line-height: 1.6;">{message}</p>
        </div>
        """
    }
}

class EmailService:
    """
    Configurable SMTP email dispatcher for university attendance notifications.
    Supports real SMTP delivery or transparently reports unconfigured/disabled status without faking.
    """

    def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> Dict[str, Any]:
        """Dispatches an email via SMTP or records disabled status."""
        if not settings.EMAIL_ENABLED or not settings.SMTP_USER:
            logger.info(f"SMTP disabled/unconfigured. Skipping external email dispatch to: {to_email}")
            return {
                "status": "UNCONFIGURED",
                "mode": "DISABLED",
                "recipient": to_email,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "reason": "SMTP email delivery is disabled in settings or SMTP_USER is not configured."
            }

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.SMTP_FROM_EMAIL
        msg["To"] = to_email

        if text_content:
            msg.attach(MIMEText(text_content, "plain"))
        msg.attach(MIMEText(html_content, "html"))

        try:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.SMTP_FROM_EMAIL, [to_email], msg.as_string())
            return {
                "status": "SENT",
                "mode": "SMTP_LIVE",
                "recipient": to_email,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        except Exception as e:
            logger.error(f"Failed to deliver SMTP email to {to_email}: {e}")
            raise e

    def dispatch_notification_email(self, db: Session, notification_id: int) -> bool:
        """Dispatches an email for a given Notification record and updates delivery status."""
        notif = db.query(Notification).filter(Notification.id == notification_id).first()
        if not notif or not notif.user or not notif.user.email:
            return False

        if not settings.EMAIL_ENABLED or not settings.SMTP_USER:
            # Do not pretend email was dispatched when SMTP is offline
            notif.status = "SENT" if notif.channel == "IN_APP" else "UNCONFIGURED"
            notif.error_message = "SMTP email dispatch disabled or credentials unconfigured."
            db.commit()
            return False

        template_key = "CRITICAL_ALERT" if notif.notification_type == "CRITICAL" else "ATTENDANCE_WARNING"
        tpl = EMAIL_TEMPLATES.get(template_key, EMAIL_TEMPLATES["ATTENDANCE_WARNING"])

        subject = f"{tpl['subject']}: {notif.title}"
        html = tpl["html"].format(title=notif.title, message=notif.message)

        try:
            res = self.send_email(to_email=notif.user.email, subject=subject, html_content=html, text_content=notif.message)
            if res.get("status") == "SENT":
                notif.channel = "EMAIL"
                notif.status = "SENT"
                notif.sent_at = datetime.now(timezone.utc)
                notif.error_message = None
                db.commit()
                return True
            else:
                notif.error_message = res.get("reason", "SMTP not active")
                db.commit()
                return False
        except Exception as e:
            notif.status = "FAILED"
            notif.retry_count = (notif.retry_count or 0) + 1
            notif.error_message = str(e)
            db.commit()
            return False

email_service = EmailService()

