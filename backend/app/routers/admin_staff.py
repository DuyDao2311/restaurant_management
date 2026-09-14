import math
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import JSONResponse
from sqlalchemy import or_
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from app.core.database import get_db
from app.core.security import hash_password
from app.models.user import User
from app.models.role import Role
from app.schemas.staff import StaffCreate, StaffUpdate, StaffStatusUpdate, StaffResponse
from app.dependencies.auth import require_admin

router = APIRouter()

def get_staff_role_id(db: Session) -> Optional[int]:
    role = db.query(Role).filter(Role.name == "STAFF").first()
    return role.id if role else None

# ---------- GET /api/admin/staff ----------
@router.get("")
def get_staff(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Get all staff members with pagination, search, and status filter. Requires: ADMIN."""
    try:
        staff_role_id = get_staff_role_id(db)
        if not staff_role_id:
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"success": False, "message": "STAFF role not found in database."}
            )

        query = db.query(User).filter(User.role_id == staff_role_id)

        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    User.full_name.ilike(search_term),
                    User.email.ilike(search_term),
                    User.phone.ilike(search_term)
                )
            )

        if status_filter:
            # We map filter to uppercase string match to keep consistent with DB enum representation
            query = query.filter(User.status == status_filter.upper())

        total = query.count()
        offset = (page - 1) * limit
        staff_members = query.order_by(User.created_at.desc()).offset(offset).limit(limit).all()
        
        total_pages = math.ceil(total / limit) if limit else 0

        # We keep the generic response format standard that they asked for, which wraps data.items and data.pagination
        return {
            "success": True,
            "data": {
                "items": [StaffResponse.model_validate(s).model_dump() for s in staff_members],
                "pagination": {
                    "page": page,
                    "limit": limit,
                    "total": total,
                    "total_pages": total_pages
                }
            }
        }
    except SQLAlchemyError:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"success": False, "message": "Database error occurred"}
        )

# ---------- GET /api/admin/staff/{id} ----------
@router.get("/{staff_id}")
def get_staff_detail(
    staff_id: int,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Get a staff member by ID. Requires: ADMIN."""
    staff_role_id = get_staff_role_id(db)
    staff = db.query(User).filter(User.id == staff_id, User.role_id == staff_role_id).first()
    
    if not staff:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"success": False, "message": "Staff not found"}
        )
    return {
        "success": True,
        "data": StaffResponse.model_validate(staff).model_dump()
    }

# ---------- POST /api/admin/staff ----------
@router.post("", status_code=status.HTTP_201_CREATED)
def create_staff(
    staff_data: StaffCreate,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Create a new staff member. Requires: ADMIN."""
    staff_role_id = get_staff_role_id(db)
    if not staff_role_id:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"success": False, "message": "STAFF role not found in database."}
        )

    # Check duplicate email
    if staff_data.email:
        existing_email = db.query(User).filter(User.email == staff_data.email).first()
        if existing_email:
            return JSONResponse(
                status_code=status.HTTP_409_CONFLICT,
                content={"success": False, "message": f"Email '{staff_data.email}' is already in use"}
            )
            
    # Check duplicate phone
    if staff_data.phone:
        existing_phone = db.query(User).filter(User.phone == staff_data.phone).first()
        if existing_phone:
            return JSONResponse(
                status_code=status.HTTP_409_CONFLICT,
                content={"success": False, "message": f"Phone '{staff_data.phone}' is already in use"}
            )

    try:
        now = datetime.now()
        new_staff = User(
            role_id=staff_role_id,
            full_name=staff_data.full_name,
            phone=staff_data.phone,
            email=staff_data.email,
            password=hash_password(staff_data.password),
            status="ACTIVE",
            created_at=now,
            updated_at=now
        )
        db.add(new_staff)
        db.commit()
        db.refresh(new_staff)

        return {
            "success": True,
            "message": "Tạo Staff thành công",
            "data": StaffResponse.model_validate(new_staff).model_dump()
        }
    except IntegrityError:
        db.rollback()
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"success": False, "message": "Phone or email is already in use"}
        )
    except SQLAlchemyError as e:
        db.rollback()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"success": False, "message": f"Database error occurred: {str(e)}"}
        )

# ---------- PUT /api/admin/staff/{id} ----------
@router.put("/{staff_id}")
def update_staff(
    staff_id: int,
    staff_data: StaffUpdate,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Update a staff member. Requires: ADMIN."""
    staff_role_id = get_staff_role_id(db)
    staff = db.query(User).filter(User.id == staff_id, User.role_id == staff_role_id).first()
    if not staff:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"success": False, "message": "Staff not found"}
        )

    # Check duplicate email if being updated
    if staff_data.email is not None and staff_data.email != staff.email:
        existing_email = db.query(User).filter(User.email == staff_data.email, User.id != staff_id).first()
        if existing_email:
            return JSONResponse(
                status_code=status.HTTP_409_CONFLICT,
                content={"success": False, "message": f"Email '{staff_data.email}' is already in use"}
            )
            
    # Check duplicate phone if being updated
    if staff_data.phone is not None and staff_data.phone != staff.phone:
        existing_phone = db.query(User).filter(User.phone == staff_data.phone, User.id != staff_id).first()
        if existing_phone:
            return JSONResponse(
                status_code=status.HTTP_409_CONFLICT,
                content={"success": False, "message": f"Phone '{staff_data.phone}' is already in use"}
            )

    try:
        if staff_data.full_name is not None:
            staff.full_name = staff_data.full_name
        if staff_data.phone is not None:
            staff.phone = staff_data.phone
        if staff_data.email is not None:
            staff.email = staff_data.email

        staff.updated_at = datetime.now()
        db.commit()
        db.refresh(staff)

        return {
            "success": True,
            "message": "Cập nhật Staff thành công",
            "data": StaffResponse.model_validate(staff).model_dump()
        }
    except IntegrityError:
        db.rollback()
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"success": False, "message": "Phone or email is already in use"}
        )
    except SQLAlchemyError:
        db.rollback()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"success": False, "message": "Database error occurred"}
        )


# ---------- PATCH /api/admin/staff/{id}/status ----------
@router.patch("/{staff_id}/status")
def update_staff_status(
    staff_id: int,
    status_data: StaffStatusUpdate,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Update status of a staff member. Requires: ADMIN."""
    staff_role_id = get_staff_role_id(db)
    staff = db.query(User).filter(User.id == staff_id, User.role_id == staff_role_id).first()
    if not staff:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"success": False, "message": "Staff not found"}
        )

    try:
        new_status = status_data.status.upper()
        staff.status = new_status
        staff.updated_at = datetime.now()
        db.commit()
        
        msg = "Mở khóa Staff thành công" if new_status == "ACTIVE" else "Khóa Staff thành công"
        
        return {
            "success": True,
            "message": msg
        }
    except SQLAlchemyError:
        db.rollback()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"success": False, "message": "Database error occurred"}
        )


# ---------- DELETE /api/admin/staff/{id} ----------
@router.delete("/{staff_id}")
def delete_staff(
    staff_id: int,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Delete a staff member. Requires: ADMIN."""
    staff_role_id = get_staff_role_id(db)
    staff = db.query(User).filter(User.id == staff_id, User.role_id == staff_role_id).first()
    if not staff:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"success": False, "message": "Staff not found"}
        )

    try:
        db.delete(staff)
        db.commit()
        return {
            "success": True,
            "message": "Xóa Staff thành công"
        }
    except IntegrityError:
        db.rollback()
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"success": False, "message": "Không thể xóa Staff này vì đã có dữ liệu liên quan."}
        )
    except SQLAlchemyError:
        db.rollback()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"success": False, "message": "Database error occurred"}
        )
