from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.reservation import ReservationCreate, ReservationResponse, ReservationGuestResponse
from app.services.reservation_service import create_reservation, get_my_reservations, get_reservation_by_id_and_user, cancel_my_reservation, get_reservation_by_code
from app.dependencies.auth import get_current_user
from app.models.user import User
from typing import List, Optional
router = APIRouter()

@router.post("/", response_model=ReservationResponse, status_code=status.HTTP_201_CREATED)
def api_create_reservation(
    reservation_data: ReservationCreate,
    db: Session = Depends(get_db)
):
    """
    Tạo mới một yêu cầu đặt bàn (Guest/Customer).
    Guest không cần đăng nhập. user_id có thể là None.
    Backend sẽ tự generate reservation_code, set status = PENDING, table_id = null.
    """
    return create_reservation(db, reservation_data)

@router.get("/my", response_model=List[ReservationResponse])
def api_get_my_reservations(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Customer xem danh sách Reservation của mình.
    Sắp xếp Reservation mới nhất trước.
    Có thể filter theo status.
    """
    return get_my_reservations(db, current_user.id, status)

@router.get("/{reservation_id}", response_model=ReservationResponse)
def api_get_reservation_detail(
    reservation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Customer xem chi tiết Reservation của mình.
    Không được xem Reservation của Customer khác.
    """
    reservation = get_reservation_by_id_and_user(db, reservation_id, current_user.id)
    if not reservation:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy đặt bàn hoặc bạn không có quyền truy cập"
        )
    return reservation

@router.patch("/{reservation_id}/cancel", response_model=ReservationResponse)
def api_cancel_reservation(
    reservation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Customer hủy Reservation của chính mình.
    Chỉ cho phép hủy nếu trạng thái là PENDING hoặc CONFIRMED.
    """
    return cancel_my_reservation(db, reservation_id, current_user.id)

@router.get("/lookup/{reservation_code}", response_model=ReservationGuestResponse)
def api_lookup_reservation(
    reservation_code: str,
    db: Session = Depends(get_db)
):
    """
    Tra cứu thông tin đặt bàn cho Guest bằng mã reservation_code.
    Không yêu cầu đăng nhập.
    Trả về thông tin cơ bản không bao gồm dữ liệu nhạy cảm (user_id).
    """
    return get_reservation_by_code(db, reservation_code)

