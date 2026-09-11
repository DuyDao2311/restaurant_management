from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.dependencies.auth import require_admin_or_staff
from app.schemas.table_session import TableSessionResponse
from app.services.table_session_service import close_table_session

router = APIRouter()

@router.post("/staff/table-sessions/{session_id}/close", response_model=None)
def api_staff_close_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_staff)
):
    """
    Staff đóng Table Session.
    """
    session = close_table_session(db, session_id)
    return {
        "success": True,
        "message": "Đã đóng Session thành công",
        "data": TableSessionResponse.model_validate(session).model_dump()
    }

@router.post("/admin/table-sessions/{session_id}/close", response_model=None)
def api_admin_close_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_staff)
):
    """
    Admin đóng Table Session.
    """
    session = close_table_session(db, session_id)
    return {
        "success": True,
        "message": "Đã đóng Session thành công",
        "data": TableSessionResponse.model_validate(session).model_dump()
    }

@router.get("/staff/table-sessions/{session_id}/orders")
def get_orders_by_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_staff)
):
    from app.models.order import Order
    from app.schemas.order import OrderListResponse
    
    orders = db.query(Order).filter(Order.table_session_id == session_id).order_by(Order.created_at.desc()).all()
    
    return {
        "items": orders,
        "total": len(orders),
        "page": 1,
        "size": len(orders) if len(orders) > 0 else 10
    }
