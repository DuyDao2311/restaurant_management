from fastapi import APIRouter, Depends, Query, Path
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.notification import NotificationListResponse, NotificationResponse
from app.services import notification_service

router = APIRouter()


@router.get("", response_model=NotificationListResponse)
def get_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    is_read: Optional[bool] = Query(None, description="Filter by read status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get notifications for the current authenticated user.
    """
    items, total_count, unread_count = notification_service.get_my_notifications(
        db=db,
        user_id=current_user.id,
        skip=skip,
        limit=limit,
        is_read=is_read
    )
    
    return NotificationListResponse(
        items=items,
        total_count=total_count,
        unread_count=unread_count
    )


@router.get("/unread-count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get only the unread count for the current authenticated user.
    """
    unread_count = notification_service.get_unread_count(db=db, user_id=current_user.id)
    return {"unread_count": unread_count}


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_as_read(
    notification_id: int = Path(..., description="ID of the notification to mark as read"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mark a specific notification as read.
    """
    return notification_service.mark_as_read(
        db=db,
        notification_id=notification_id,
        user_id=current_user.id
    )


@router.patch("/read-all")
def mark_all_notifications_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Mark all unread notifications of the current user as read.
    """
    updated_count = notification_service.mark_all_as_read(db=db, user_id=current_user.id)
    return {
        "success": True,
        "message": f"Marked {updated_count} notifications as read",
        "updated_count": updated_count
    }
