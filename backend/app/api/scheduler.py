from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
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
