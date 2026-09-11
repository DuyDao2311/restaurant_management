from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from datetime import date, datetime, time, timedelta
from app.models.reservation import Reservation
from app.models.table import RestaurantTable
from app.schemas.reservation import ReservationCreate
from fastapi import HTTPException, status
from typing import List, Tuple, Optional
import logging

logger = logging.getLogger(__name__)

def validate_reservation_business_rules(reservation_data: ReservationCreate):
    """
    Validates business rules for creating a new reservation.
    Raises HTTPException 400 if validation fails.
    """
    now = datetime.now()
    today = now.date()
    current_time = now.time()

    # 1. Validation ngày đặt bàn
    if reservation_data.reservation_date < today:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ngày đặt bàn không được ở quá khứ"
        )
    
    if reservation_data.reservation_date == today:
        if reservation_data.start_time < current_time:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Thời gian bắt đầu không hợp lệ"
            )

    # 2. Validation khoảng thời gian
    if reservation_data.start_time >= reservation_data.end_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Thời gian kết thúc phải sau thời gian bắt đầu"
        )

    # 3. Validation số khách
    if reservation_data.number_of_guests <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Số lượng khách phải lớn hơn 0"
        )

    # 4. Validation thông tin khách
    if not reservation_data.customer_name or not reservation_data.customer_name.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tên khách hàng không được để trống"
        )
        
    if not reservation_data.customer_phone or not reservation_data.customer_phone.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Số điện thoại không được để trống"
        )

def generate_reservation_code(db: Session, reservation_date: date) -> str:
    """
    Generates a unique reservation code in the format: RSV-YYYYMMDD-XXX
    Example: RSV-20260910-001
    """
    date_str = reservation_date.strftime("%Y%m%d")
    prefix = f"RSV-{date_str}-"

    # Find the latest reservation code for this specific date
    last_reservation = (
        db.query(Reservation)
        .filter(Reservation.reservation_code.like(f"{prefix}%"))
        .order_by(Reservation.reservation_code.desc())
        .first()
    )

    if last_reservation:
        # Extract the sequence number from the code (e.g. RSV-20260910-001 -> 001)
        last_code = last_reservation.reservation_code
        try:
            last_seq = int(last_code.split('-')[-1])
            new_seq = last_seq + 1
        except ValueError:
            # Fallback if parsing fails for some reason
            new_seq = 1
    else:
        new_seq = 1

    return f"{prefix}{new_seq:03d}"

def create_reservation(db: Session, reservation_data: ReservationCreate) -> Reservation:
    """
    Creates a new reservation with PENDING status.
    Handles uniqueness of reservation_code with retry loop.
    """
    # 1. Validate business rules
    validate_reservation_business_rules(reservation_data)

    max_retries = 3
    for attempt in range(max_retries):
        try:
            # 2. Check Availability inside the retry loop in case we need to re-fetch
            suitable_tables = find_suitable_tables(
                db,
                number_of_guests=reservation_data.number_of_guests,
                reservation_date=reservation_data.reservation_date,
                start_time=reservation_data.start_time,
                end_time=reservation_data.end_time
            )

            if not suitable_tables:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Đã hết bàn trong khung giờ này"
                )

            selected_table_id = None
            for table in suitable_tables:
                # Lock this table to prevent others from booking it simultaneously
                locked_table = db.query(RestaurantTable).with_for_update().filter(RestaurantTable.id == table.id).first()
                
                # Re-check overlap while locked
                if locked_table and not has_reservation_overlap(
                    db,
                    table.id,
                    reservation_data.reservation_date,
                    reservation_data.start_time,
                    reservation_data.end_time,
                    use_lock=True
                ):
                    selected_table_id = table.id
                    # Set table status to RESERVED if it's currently AVAILABLE
                    if locked_table.status == "AVAILABLE":
                        locked_table.status = "RESERVED"
                    break
            
            if not selected_table_id:
                # If all suitable tables just got booked
                db.rollback()
                if attempt == max_retries - 1:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="Các bàn phù hợp vừa được đặt, vui lòng thử lại."
                    )
                continue

            # 3. Generate unique code
            reservation_code = generate_reservation_code(db, reservation_data.reservation_date)

            # 4. Create reservation object
            new_reservation = Reservation(
                user_id=reservation_data.user_id,
                table_id=selected_table_id,
                reservation_code=reservation_code,
                reservation_date=reservation_data.reservation_date,
                start_time=reservation_data.start_time,
                end_time=reservation_data.end_time,
                number_of_guests=reservation_data.number_of_guests,
                customer_name=reservation_data.customer_name.strip(),
                customer_phone=reservation_data.customer_phone.strip(),
                note=reservation_data.note,
                status="PENDING",
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )

            db.add(new_reservation)
            db.commit()
            db.refresh(new_reservation)
            
            return new_reservation
            
        except IntegrityError as e:
            db.rollback()
            logger.warning(f"IntegrityError generating reservation code: {e}")
            if attempt == max_retries - 1:
                # If we exhausted retries, raise server error
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Không thể tạo mã đặt bàn sau nhiều lần thử. Vui lòng thử lại sau."
                )
            # Else loop will retry

def find_tables_with_sufficient_capacity(db: Session, number_of_guests: int) -> List[RestaurantTable]:
    """
    Finds all tables that have a capacity greater than or equal to the number of guests.
    Excludes tables that are under MAINTENANCE.
    Returns tables sorted by capacity in ascending order.
    """
    tables = (
        db.query(RestaurantTable)
        .filter(
            RestaurantTable.capacity >= number_of_guests,
            RestaurantTable.status != "MAINTENANCE"
        )
        .order_by(RestaurantTable.capacity.asc())
        .all()
    )
    return tables

def get_reservation_datetime_range(reservation_date: date, start_time: time, end_time: time) -> Tuple[datetime, datetime]:
    """
    Combines date and time to create start_datetime and end_datetime.
    Validates that start_time < end_time (same day).
    Raises ValueError if invalid.
    """
    if start_time >= end_time:
        raise ValueError("Thời gian kết thúc phải sau thời gian bắt đầu")
    
    start_datetime = datetime.combine(reservation_date, start_time)
    end_datetime = datetime.combine(reservation_date, end_time)
    
    return start_datetime, end_datetime

def is_time_range_overlap(new_start: datetime, new_end: datetime, existing_start: datetime, existing_end: datetime) -> bool:
    """
    Checks if two time ranges overlap.
    Formula: new_start < existing_end AND new_end > existing_start
    """
    return (new_start < existing_end) and (new_end > existing_start)

def has_reservation_overlap(
    db: Session,
    table_id: int,
    reservation_date: date,
    start_time: time,
    end_time: time,
    exclude_reservation_id: Optional[int] = None,
    use_lock: bool = False
) -> bool:
    """
    Checks if a table has overlapping reservations on a specific date and time range.
    Only considers reservations that are PENDING, CONFIRMED, or CHECKED_IN.
    """
    # 1. Prepare new datetime range
    new_start_dt, new_end_dt = get_reservation_datetime_range(reservation_date, start_time, end_time)

    # 2. Query potentially overlapping reservations for the table on the same date
    active_statuses = ["PENDING", "CONFIRMED", "CHECKED_IN"]
    
    query = db.query(Reservation).filter(
        Reservation.table_id == table_id,
        Reservation.reservation_date == reservation_date,
        Reservation.status.in_(active_statuses)
    )

    if exclude_reservation_id is not None:
        query = query.filter(Reservation.id != exclude_reservation_id)

    if use_lock:
        query = query.with_for_update()

    existing_reservations = query.all()

    # 3. Check time overlap for each reservation
    for existing_res in existing_reservations:
        existing_start_dt, existing_end_dt = get_reservation_datetime_range(
            existing_res.reservation_date, 
            existing_res.start_time, 
            existing_res.end_time
        )
        if is_time_range_overlap(new_start_dt, new_end_dt, existing_start_dt, existing_end_dt):
            return True

    return False

def find_suitable_tables(
    db: Session,
    number_of_guests: int,
    reservation_date: date,
    start_time: time,
    end_time: time,
    exclude_reservation_id: Optional[int] = None,
    use_lock: bool = False
) -> List[RestaurantTable]:
    """
    Finds a list of tables suitable for a reservation based on capacity, status, and time availability.
    Returns tables sorted by capacity ASC.
    """
    suitable_tables = []

    # 1. Lọc theo capacity (hàm này đã loại MAINTENANCE và sắp xếp capacity ASC)
    candidate_tables = find_tables_with_sufficient_capacity(db, number_of_guests)

    now = datetime.now()

    for table in candidate_tables:
        # 2. Kiểm tra overlap Reservation
        has_overlap = has_reservation_overlap(
            db, 
            table.id, 
            reservation_date, 
            start_time, 
            end_time, 
            exclude_reservation_id,
            use_lock=use_lock
        )

        if has_overlap:
            continue

        # 3. Xử lý trường hợp bàn đang OCCUPIED
        # Nếu bàn đang có khách (OCCUPIED) và khách muốn đặt bàn cho hôm nay,
        # trong khoảng thời gian rất gần (vd: <= hiện tại + 2 giờ),
        # thì bàn đó không thể phục vụ ngay (vì không biết khi nào khách cũ đi).
        if table.status == "OCCUPIED" and reservation_date == now.date():
            requested_start = datetime.combine(reservation_date, start_time)
            # Dùng ngưỡng 2 tiếng làm estimated dining time
            if requested_start < now + timedelta(hours=2):
                continue

        suitable_tables.append(table)

    return suitable_tables

def get_my_reservations(
    db: Session,
    user_id: int,
    status: Optional[str] = None
) -> List[Reservation]:
    """
    Retrieves reservations for a specific user, ordered by newest first.
    Can be filtered by status.
    """
    query = db.query(Reservation).filter(Reservation.user_id == user_id)
    if status:
        query = query.filter(Reservation.status == status)
    
    # Sort newest first
    return query.order_by(Reservation.created_at.desc()).all()

def get_reservation_by_id_and_user(
    db: Session,
    reservation_id: int,
    user_id: int
) -> Optional[Reservation]:
    """
    Retrieves a specific reservation by ID for a specific user.
    """
    return db.query(Reservation).filter(
        Reservation.id == reservation_id,
        Reservation.user_id == user_id
    ).first()

def cancel_my_reservation(
    db: Session,
    reservation_id: int,
    user_id: int
) -> Reservation:
    """
    Cancels a reservation if it belongs to the user and is in a cancellable state.
    """
    reservation = get_reservation_by_id_and_user(db, reservation_id, user_id)
    if not reservation:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy đặt bàn hoặc bạn không có quyền truy cập"
        )
    
    if reservation.status == "CANCELLED":
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Đặt bàn này đã được hủy trước đó"
        )
        
    if reservation.status not in ["PENDING", "CONFIRMED"]:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Không thể hủy đặt bàn đang ở trạng thái {reservation.status}"
        )

    reservation.status = "CANCELLED"
    reservation.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(reservation)
    
    return reservation

def get_reservation_by_code(db: Session, reservation_code: str) -> Optional[Reservation]:
    """
    Lookup a reservation by its exact code.
    Validates code format first (RSV-YYYYMMDD-XXX).
    """
    import re
    if not re.match(r"^RSV-\d{8}-\d{3,}$", reservation_code):
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mã đặt bàn không đúng định dạng (VD: RSV-YYYYMMDD-XXX)"
        )
        
    reservation = db.query(Reservation).filter(Reservation.reservation_code == reservation_code).first()
    if not reservation:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy đặt bàn với mã cung cấp"
        )
    return reservation

def get_all_reservations(
    db: Session,
    status: Optional[str] = None,
    reservation_date: Optional[date] = None,
    table_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 20
):
    """
    Admin: Lấy danh sách tất cả reservation có phân trang và filter.
    Returns (list_of_reservations, total_count).
    """
    query = db.query(Reservation)
    if status:
        query = query.filter(Reservation.status == status)
    if reservation_date:
        query = query.filter(Reservation.reservation_date == reservation_date)
    if table_id:
        query = query.filter(Reservation.table_id == table_id)
        
    total = query.count()
    reservations = query.order_by(Reservation.created_at.desc()).offset(skip).limit(limit).all()
    return reservations, total

def get_reservation_by_id(db: Session, reservation_id: int) -> Optional[Reservation]:
    """
    Admin: Lấy chi tiết reservation bằng ID.
    """
    return db.query(Reservation).filter(Reservation.id == reservation_id).first()

def assign_table_to_reservation(db: Session, reservation_id: int, table_id: int) -> Reservation:
    """
    Admin: Gán bàn cho Reservation, áp dụng lock chống race condition và kiểm tra đầy đủ Availability.
    """
    from fastapi import HTTPException, status
    
    # 1. Lock reservation record
    reservation = db.query(Reservation).with_for_update().filter(Reservation.id == reservation_id).first()
    if not reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy đặt bàn"
        )
        
    # 2. Check reservation status
    if reservation.status not in ["PENDING"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Không thể gán bàn cho đặt bàn ở trạng thái {reservation.status}"
        )
        
    # 3. Lock table record
    table = db.query(RestaurantTable).with_for_update().filter(RestaurantTable.id == table_id).first()
    if not table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy bàn"
        )
        
    # 4. Check basic table constraints
    if table.status == "MAINTENANCE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bàn đang bảo trì"
        )
        
    if table.capacity < reservation.number_of_guests:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sức chứa của bàn không đủ"
        )
        
    # 5. Re-check availability
    suitable_tables = find_suitable_tables(
        db,
        number_of_guests=reservation.number_of_guests,
        reservation_date=reservation.reservation_date,
        start_time=reservation.start_time,
        end_time=reservation.end_time,
        exclude_reservation_id=reservation.id,
        use_lock=True
    )
    
    if not any(t.id == table_id for t in suitable_tables):
        # Determine exact reason
        has_overlap = has_reservation_overlap(
            db, 
            table_id, 
            reservation.reservation_date, 
            reservation.start_time, 
            reservation.end_time, 
            exclude_reservation_id=reservation.id,
            use_lock=True
        )
        if has_overlap:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Bàn đã bị đặt trùng thời gian (Overlap)"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Bàn không khả dụng tại thời điểm này (có thể đang có khách)"
            )
            
    # 6. Assign
    reservation.table_id = table_id
    reservation.status = "CONFIRMED"
    reservation.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(reservation)
    
    return reservation

def reject_reservation(db: Session, reservation_id: int, reason: str) -> Reservation:
    """
    Admin: Từ chối Reservation (chỉ áp dụng cho PENDING).
    """
    from fastapi import HTTPException, status
    
    reservation = db.query(Reservation).with_for_update().filter(Reservation.id == reservation_id).first()
    if not reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy đặt bàn"
        )
        
    if reservation.status != "PENDING":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Không thể từ chối đặt bàn đang ở trạng thái {reservation.status}"
        )
        
    reservation.status = "REJECTED"
    reservation.rejection_reason = reason.strip()
    reservation.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(reservation)
    
    return reservation

def checkin_reservation(db: Session, reservation_id: int) -> Reservation:
    """
    Staff/Admin: Check-in một Reservation.
    Chuyển Reservation -> CHECKED_IN và Table -> OCCUPIED.
    Sử dụng transaction để đảm bảo tính nhất quán.
    """
    from fastapi import HTTPException, status
    from datetime import timedelta

    # 1. Lock Reservation
    reservation = db.query(Reservation).with_for_update().filter(Reservation.id == reservation_id).first()
    if not reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy đặt bàn"
        )

    # 2. Condition 2: Has table
    if not reservation.table_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Đặt bàn chưa được xếp bàn, không thể Check-in"
        )

    # 3. Condition 3: Not already checked in
    if reservation.status == "CHECKED_IN":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Đặt bàn này đã được Check-in trước đó"
        )

    # 4. Condition 4: Not ended
    if reservation.status in ["CANCELLED", "COMPLETED", "REJECTED", "NO_SHOW"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Không thể Check-in đặt bàn ở trạng thái {reservation.status}"
        )

    # 5. Lock Table
    table = db.query(RestaurantTable).with_for_update().filter(RestaurantTable.id == reservation.table_id).first()
    if not table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy bàn của đặt bàn này"
        )

    # 6. Condition 6: Table status
    if table.status in ["MAINTENANCE", "OCCUPIED", "UNAVAILABLE"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Bàn đang ở trạng thái {table.status}, không thể Check-in"
        )

    # 7. Time conditions
    now = datetime.now()
    today = now.date()

    if reservation.reservation_date != today:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chỉ có thể Check-in vào đúng ngày đặt bàn"
        )

    # Create datetime objects for strict comparison
    start_dt = datetime.combine(today, reservation.start_time)
    end_dt = datetime.combine(today, reservation.end_time)
    
    # Cho phép check-in sớm 30 phút (grace period) để thân thiện với thực tế
    grace_period_start = start_dt - timedelta(minutes=30)

    if now < grace_period_start:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chưa đến giờ Check-in của đặt bàn này"
        )

    if now > end_dt:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Đã quá thời gian Check-in của đặt bàn này"
        )

    # 8. Update states
    reservation.status = "CHECKED_IN"
    reservation.updated_at = now

    table.status = "OCCUPIED"
    table.updated_at = now

    # 9. Create TableSession
    from app.models.table_session import TableSession
    
    # Check if a session already exists for this reservation
    existing_session = db.query(TableSession).filter(
        TableSession.reservation_id == reservation.id
    ).first()
    if existing_session:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Đặt bàn này đã có Table Session"
        )
        
    # Check if table already has an ACTIVE session
    active_table_session = db.query(TableSession).filter(
        TableSession.table_id == table.id,
        TableSession.status == "ACTIVE"
    ).first()
    if active_table_session:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bàn này đang có Session ACTIVE khác"
        )
        
    new_session = TableSession(
        table_id=table.id,
        reservation_id=reservation.id,
        started_at=now,
        status="ACTIVE",
        created_at=now,
        updated_at=now
    )
    db.add(new_session)

    db.commit()
    db.refresh(reservation)

    return reservation
