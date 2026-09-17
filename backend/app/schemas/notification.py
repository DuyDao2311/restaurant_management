from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    message: str
    type: Optional[str] = None
    reference_id: Optional[int] = None
    is_read: bool
    created_at: Optional[datetime] = None


class NotificationListResponse(BaseModel):
    items: List[NotificationResponse]
    total_count: int
    unread_count: int
