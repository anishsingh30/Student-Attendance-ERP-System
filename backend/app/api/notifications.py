from typing import List, Optional, Dict, Any, Union
import math
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.notification import Notification
from app.schemas.notification import NotificationResponse, NotificationReadRequest

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("/unread-count")
def get_unread_notification_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns the authoritative count of unread notifications for the authenticated user directly from the database.
    """
    count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()
    return {"unread_count": count}

@router.get("/", response_model=List[NotificationResponse])
def get_user_notifications(
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    safe_limit = max(1, min(limit, 200))
    safe_offset = max(0, offset)
    notifs = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).offset(safe_offset).limit(safe_limit).all()
    return notifs

@router.put("/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_read(
    notification_id: int,
    req: NotificationReadRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    notif.is_read = req.is_read
    db.commit()
    db.refresh(notif)
    return notif

@router.put("/read-all")
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read"}

@router.get("/all", response_model=Union[List[NotificationResponse], Dict[str, Any]])
def get_all_notifications_admin(
    channel: str = None,
    delivery_status: str = None,
    page: Optional[int] = Query(None, ge=1),
    page_size: Optional[int] = Query(None, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Admin endpoint to inspect delivery logs and channel status."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Forbidden: Admin access required.")

    q = db.query(Notification)
    if channel:
        q = q.filter(Notification.channel == channel.upper())
    if delivery_status:
        q = q.filter(Notification.status == delivery_status.upper())

    if page is not None:
        total = q.count()
        p = page
        ps = page_size or 25
        items = q.order_by(Notification.created_at.desc()).offset((p - 1) * ps).limit(ps).all()
        total_pages = max(1, math.ceil(total / ps))
        return {
            "items": [NotificationResponse.model_validate(i).model_dump() for i in items],
            "total": total,
            "page": p,
            "page_size": ps,
            "total_pages": total_pages
        }

    return q.order_by(Notification.created_at.desc()).limit(100).all()

@router.post("/{notification_id}/retry")
def retry_failed_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Admin endpoint to re-dispatch a failed notification."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Forbidden: Admin access required.")

    from app.services.email_service import email_service
    success = email_service.dispatch_notification_email(db, notification_id)
    return {"status": "SUCCESS" if success else "FAILED", "notification_id": notification_id}
