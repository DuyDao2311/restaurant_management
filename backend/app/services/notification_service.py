from typing import List, Tuple, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from fastapi import HTTPException, status
import logging

from app.models.notification import Notification
from app.models.user import User
from app.models.role import Role
from app.models.reservation import Reservation
from app.core.socket_manager import emit_socket_notification

logger = logging.getLogger(__name__)


def get_my_notifications(
    db: Session,
    user_id: int,
    skip: int = 0,
    limit: int = 20,
    is_read: Optional[bool] = None
) -> Tuple[List[Notification], int, int]:
    """
    Retrieves notifications for the current user.
    Returns (items, total_count, unread_count).
    """
    base_query = db.query(Notification).filter(Notification.user_id == user_id)
    
    if is_read is not None:
        base_query = base_query.filter(Notification.is_read == is_read)
    
    total_count = base_query.count()
    unread_count = base_query.filter(Notification.is_read == False).count()
    
    items = base_query.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()
    
    return items, total_count, unread_count


def get_unread_count(db: Session, user_id: int) -> int:
    """
    Retrieves the total unread count for the current user.
    """
    return db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.is_read == False
    ).count()


def mark_as_read(db: Session, notification_id: int, user_id: int) -> Notification:
    """
    Marks a specific notification as read. Ensure it belongs to the user.
    """
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Thông báo không tồn tại"
        )
        
    if notification.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền truy cập thông báo này"
        )
        
    if not notification.is_read:
        notification.is_read = True
        db.commit()
        db.refresh(notification)
        
    return notification


def mark_all_as_read(db: Session, user_id: int) -> int:
    """
    Marks all unread notifications for the user as read.
    Returns the number of notifications updated.
    """
    # Using bulk update for efficiency
    updated_count = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.is_read == False
    ).update({"is_read": True}, synchronize_session=False)
    
    if updated_count > 0:
        db.commit()
        
    return updated_count


def notify_reservation_created(db: Session, reservation: Reservation) -> None:
    """
    Business Logic: Creates a Notification for all ADMIN and STAFF users when a new reservation is successfully created.
    Called AFTER reservation is committed to db.
    If this fails, it won't affect the reservation creation (should be handled by try-except where called).
    """
    try:
        # Find all ADMIN and STAFF users
        target_roles = db.query(Role).filter(Role.name.in_(["ADMIN", "STAFF"])).all()
        target_role_ids = [role.id for role in target_roles]
        
        if not target_role_ids:
            logger.warning("No ADMIN or STAFF roles found to notify.")
            return
            
        target_users = db.query(User).filter(
            User.role_id.in_(target_role_ids),
            User.status == "ACTIVE"
        ).all()
        
        if not target_users:
            logger.warning("No active ADMIN or STAFF users found to notify.")
            return

        # Prepare notification content
        title = "Có khách mới đặt bàn"
        
        start_str = reservation.start_time.strftime("%H:%M") if reservation.start_time else "--:--"
        end_str = reservation.end_time.strftime("%H:%M") if reservation.end_time else "--:--"
        
        message = (
            f"{reservation.customer_name} vừa đặt bàn cho {reservation.number_of_guests} khách.\n"
            f"Mã đặt bàn: {reservation.reservation_code}.\n"
            f"Thời gian: {start_str} - {end_str}."
        )

        now = datetime.utcnow()
        notifications = []
        
        for user in target_users:
            notif = Notification(
                user_id=user.id,
                title=title,
                message=message,
                type="RESERVATION_CREATED",
                reference_id=reservation.id,
                is_read=False,
                created_at=now
            )
            notifications.append(notif)
            
        db.add_all(notifications)
        db.commit()
        
        # After successful commit, emit socket notifications
        for notif in notifications:
            db.refresh(notif)
            payload = {
                "id": notif.id,
                "title": notif.title,
                "message": notif.message,
                "type": notif.type,
                "reference_id": notif.reference_id,
                "is_read": notif.is_read,
                "created_at": notif.created_at.isoformat() if notif.created_at else None
            }
            emit_socket_notification(notif.user_id, payload)
        
        logger.info(f"Created and emitted {len(notifications)} RESERVATION_CREATED notifications for reservation {reservation.id}.")
        
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to create notification for reservation {reservation.id}: {str(e)}")
        # Do not raise the exception, as notification is a secondary process and shouldn't block reservation flow
