from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    alert_id: Optional[int] = None
    title: str
    message: str
    notification_type: str
    channel: str = "IN_APP"
    status: str = "SENT"
    retry_count: int = 0
    sent_at: Optional[datetime] = None
    error_message: Optional[str] = None
    is_read: bool
    created_at: datetime

class NotificationReadRequest(BaseModel):
    is_read: bool = True

