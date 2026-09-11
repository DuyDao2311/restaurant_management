from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.dependencies.auth import require_admin
from app.schemas.reservation import ReservationResponse, ReservationAssignTable, ReservationReject
from app.schemas.table_session import TableSessionResponse
from app.services.table_session_service import get_session_by_reservation
from app.services.reservation_service import get_all_reservations, get_reservation_by_id, assign_table_to_reservation, reject_reservation, checkin_reservation

router = APIRouter()

@router.get("")
def api_admin_get_reservations(
    status: Optional[str] = Query(None),
    reservation_date: Optional[date] = Query(None),
    table_id: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Admin xem danh sách Reservation.
    Hỗ trợ filter theo status, reservation_date, table_id.
    Có phân trang.
    """
    skip = (page - 1) * limit
    reservations, total = get_all_reservations(
        db, 
        status=status, 
        reservation_date=reservation_date, 
        table_id=table_id, 
        skip=skip, 
        limit=limit
    )

    return {
        "success": True,
        "message": "Success",
        "data": [ReservationResponse.model_validate(r).model_dump() for r in reservations],
        "page": page,
        "limit": limit,
        "total": total
    }

@router.get("/{reservation_id}")
def api_admin_get_reservation_detail(
    reservation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Admin xem chi tiết Reservation.
    """
    reservation = get_reservation_by_id(db, reservation_id)
    if not reservation:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy đặt bàn"
        )
    
    return {
        "success": True,
        "message": "Success",
        "data": ReservationResponse.model_validate(reservation).model_dump()
    }

@router.patch("/{reservation_id}/assign-table", response_model=None)
def api_admin_assign_table(
    reservation_id: int,
    assign_data: ReservationAssignTable,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Admin phân bàn cho Reservation.
    Kiểm tra đầy đủ các constraint (capacity, availability, status).
    """
    reservation = assign_table_to_reservation(db, reservation_id, assign_data.table_id)
    return {
        "success": True,
        "message": "Phân bàn thành công",
        "data": ReservationResponse.model_validate(reservation).model_dump()
    }

@router.patch("/{reservation_id}/reject", response_model=None)
def api_admin_reject_reservation(
    reservation_id: int,
    reject_data: ReservationReject,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Admin từ chối Reservation.
    Chỉ áp dụng cho đơn đặt bàn PENDING.
    """
    reservation = reject_reservation(db, reservation_id, reject_data.reason)
    return {
        "success": True,
        "message": "Đã từ chối đặt bàn",
        "data": ReservationResponse.model_validate(reservation).model_dump()
    }

@router.post("/{reservation_id}/check-in")
def api_admin_checkin_reservation(
    reservation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Admin Check-in cho Reservation.
    Cập nhật Reservation -> CHECKED_IN và Table -> OCCUPIED.
    """
    reservation = checkin_reservation(db, reservation_id)
    return {
        "success": True,
        "message": "Check-in thành công",
        "data": ReservationResponse.model_validate(reservation).model_dump()
    }

@router.get("/{reservation_id}/session")
def api_admin_get_reservation_session(
    reservation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Admin lấy Session của một Reservation.
    """
    session = get_session_by_reservation(db, reservation_id)
    return {
        "success": True,
        "message": "Success",
        "data": TableSessionResponse.model_validate(session).model_dump()
    }
