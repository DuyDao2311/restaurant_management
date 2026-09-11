from sqlalchemy.orm import Session
from datetime import datetime
from fastapi import HTTPException, status

from app.models.table_session import TableSession
from app.models.table import RestaurantTable
from app.models.reservation import Reservation

def get_session_by_reservation(db: Session, reservation_id: int) -> TableSession:
    session = db.query(TableSession).filter(TableSession.reservation_id == reservation_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy Table Session cho Reservation này"
        )
    return session

def get_active_session_by_table(db: Session, table_id: int) -> TableSession:
    session = db.query(TableSession).filter(
        TableSession.table_id == table_id,
        TableSession.status == "ACTIVE"
    ).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy Session ACTIVE cho bàn này"
        )
    return session

def close_table_session(db: Session, session_id: int) -> TableSession:
    from app.models.order import Order
    
    # 1. Lock Session
    session = db.query(TableSession).with_for_update().filter(TableSession.id == session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy Table Session"
        )

    if session.status in ["COMPLETED", "CANCELLED"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Không thể đóng Session đang ở trạng thái {session.status}"
        )

    # 2. Lock Table
    table = db.query(RestaurantTable).with_for_update().filter(RestaurantTable.id == session.table_id).first()
    if not table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy Bàn liên kết với Session này"
        )

    # 3. Check for uncompleted orders
    uncompleted_orders = db.query(Order).filter(
        Order.table_session_id == session_id,
        Order.status.in_(["PENDING", "CONFIRMED", "PREPARING", "READY", "SERVED"])
    ).all()
    
    if uncompleted_orders:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Không thể đóng phiên vì vẫn còn Order chưa hoàn thành."
        )

    # 4. Update States
    now = datetime.now()
    
    session.status = "COMPLETED"
    session.ended_at = now
    session.updated_at = now

    if table.status == "OCCUPIED":
        table.status = "AVAILABLE"
        table.updated_at = now

    db.commit()
    db.refresh(session)

    return session
