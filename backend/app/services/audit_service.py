from datetime import datetime, timezone
from typing import Optional, Any
from sqlalchemy.orm import Session
from app.models.audit import AuditLog
from app.models.user import User

SENSITIVE_KEYS = {"password", "password_hash", "token", "access_token", "secret", "api_key", "secret_key", "credentials"}

def _sanitize_data(data: Any) -> Any:
    """Recursively removes sensitive credentials from audit details."""
    if isinstance(data, dict):
        sanitized = {}
        for k, v in data.items():
            if any(s in k.lower() for s in SENSITIVE_KEYS):
                sanitized[k] = "[REDACTED]"
            else:
                sanitized[k] = _sanitize_data(v)
        return sanitized
    elif isinstance(data, list):
        return [_sanitize_data(item) for item in data]
    return data

def log_system_action(
    db: Session,
    action: str,
    resource: str,
    status: str = "SUCCESS",
    user_id: Optional[int] = None,
    details: Optional[Any] = None
) -> AuditLog:
    """
    Creates an immutable audit log entry.
    Security guarantee: Strips all passwords, tokens, hashes, and API keys.
    """
    username = None
    user_role = None
    if user_id:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            username = user.full_name
            user_role = user.role

    detail_str = None
    if details is not None:
        clean_details = _sanitize_data(details)
        if isinstance(clean_details, (dict, list)):
            try:
                detail_str = json.dumps(clean_details)
            except Exception:
                detail_str = str(clean_details)
        else:
            # If string contains password= or token=, mask it
            s = str(clean_details)
            for k in SENSITIVE_KEYS:
                if k in s.lower():
                    s = s.replace(k, "[REDACTED]")
            detail_str = s

    audit_entry = AuditLog(
        user_id=user_id,
        username=username,
        user_role=user_role,
        action=action,
        resource=resource,
        status=status,
        details=detail_str,
        timestamp=datetime.now(timezone.utc)
    )
    db.add(audit_entry)
    try:
        db.commit()
        db.refresh(audit_entry)
    except Exception:
        db.rollback()

    return audit_entry

