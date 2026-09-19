from fastapi import APIRouter, Depends, HTTPException, Header, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.api.deps import require_roles, get_current_user
from app.models.user import User
from app.services.scheduler_service import attendance_scheduler

router = APIRouter(prefix="/scheduler", tags=["Scheduler"])

class SchedulerConfigUpdate(BaseModel):
    enabled: bool
    interval_hours: int = Field(default=24, ge=1, le=168)

@router.get("/status")
def get_scheduler_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    """Retrieve current background attendance monitoring schedule status."""
    return attendance_scheduler.get_status(db)

@router.post("/config")
def update_scheduler_config(
    payload: SchedulerConfigUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    """Enable/disable scheduler or update periodic scan interval in hours."""
    return attendance_scheduler.update_config(db, payload.enabled, payload.interval_hours)

@router.post("/trigger")
def trigger_manual_scheduled_scan(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    """Manually initiate an automated attendance scan cycle immediately."""
    result = attendance_scheduler.trigger_immediate_run(db, triggered_by_user_id=current_user.id)
    return result

@router.get("/cron-trigger")
def trigger_cron_scheduled_scan(
    authorization: str = Header(default=None),
    db: Session = Depends(get_db)
):
    """
    Automated Cron entrypoint designed for serverless environments (e.g., Vercel Cron Jobs).
    Secured via CRON_SECRET Bearer header or Admin JWT.
    """
    is_authorized = False

    # 1. Check CRON_SECRET if configured (standard Vercel Cron behavior)
    if settings.CRON_SECRET and authorization:
        expected = f"Bearer {settings.CRON_SECRET}"
        if authorization.strip() == expected:
            is_authorized = True

    # 2. Check Admin JWT Bearer if provided
    if not is_authorized and authorization and authorization.startswith("Bearer "):
        token = authorization.split("Bearer ", 1)[1].strip()
        try:
            from app.core.security import decode_access_token
            payload = decode_access_token(token)
            if payload and payload.get("sub"):
                user = db.query(User).filter(User.email == payload["sub"]).first()
                if user and user.role == "admin":
                    is_authorized = True
        except Exception:
            pass

    # 3. Development testing convenience
    if not is_authorized and not settings.CRON_SECRET and settings.ENVIRONMENT == "development":
        is_authorized = True

    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: Valid CRON_SECRET Bearer token or Admin credentials required for cron execution."
        )

    result = attendance_scheduler.trigger_immediate_run(db, triggered_by_user_id=None)
    return {
        "status": "success",
        "triggered_by": "cron",
        "result": result
    }
