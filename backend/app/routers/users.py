from datetime import datetime

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from app.core.database import get_db
from app.core.security import hash_password
from app.models.user import User
from app.models.role import Role
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.dependencies.auth import require_admin

router = APIRouter()


# ---------- GET /api/users ----------
@router.get("")
def get_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Get all users with simple pagination. Requires: ADMIN."""
    try:
        offset = (page - 1) * limit
        users = db.query(User).offset(offset).limit(limit).all()
        total = db.query(User).count()

        return {
            "success": True,
            "message": "Success",
            "data": [UserResponse.model_validate(u).model_dump() for u in users],
            "page": page,
            "limit": limit,
            "total": total
        }
    except SQLAlchemyError:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"success": False, "message": "Database error occurred"}
        )


# ---------- GET /api/users/{id} ----------
@router.get("/{user_id}")
def get_user(
    user_id: int,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Get a user by ID. Requires: ADMIN."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"success": False, "message": "User not found"}
        )
    return {
        "success": True,
        "message": "Success",
        "data": UserResponse.model_validate(user).model_dump()
    }


# ---------- POST /api/users ----------
@router.post("", status_code=status.HTTP_201_CREATED)
def create_user(
    user_data: UserCreate,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Create a new user (admin management). Requires: ADMIN."""
    # Check if role exists
    role = db.query(Role).filter(Role.id == user_data.role_id).first()
    if not role:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"success": False, "message": f"Role with id {user_data.role_id} not found"}
        )

    # Check duplicate phone
    existing_phone = db.query(User).filter(User.phone == user_data.phone).first()
    if existing_phone:
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"success": False, "message": f"Phone '{user_data.phone}' is already in use"}
        )

    # Check duplicate email (only if email is provided)
    if user_data.email:
        existing_email = db.query(User).filter(User.email == user_data.email).first()
        if existing_email:
            return JSONResponse(
                status_code=status.HTTP_409_CONFLICT,
                content={"success": False, "message": f"Email '{user_data.email}' is already in use"}
            )

    try:
        now = datetime.now()
        new_user = User(
            role_id=user_data.role_id,
            full_name=user_data.full_name,
            phone=user_data.phone,
            email=user_data.email,
            password=hash_password(user_data.password),  # Password hashing with bcrypt
            avatar=user_data.avatar,
            status=user_data.status,
            created_at=now,
            updated_at=now
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return {
            "success": True,
            "message": "User created successfully",
            "data": UserResponse.model_validate(new_user).model_dump()
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


# ---------- PUT /api/users/{id} ----------
@router.put("/{user_id}")
def update_user(
    user_id: int,
    user_data: UserUpdate,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Update a user. Requires: ADMIN."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"success": False, "message": "User not found"}
        )

    # Check role exists if being updated
    if user_data.role_id is not None:
        role = db.query(Role).filter(Role.id == user_data.role_id).first()
        if not role:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"success": False, "message": f"Role with id {user_data.role_id} not found"}
            )

    # Check duplicate phone if being updated
    if user_data.phone is not None:
        existing_phone = db.query(User).filter(
            User.phone == user_data.phone, User.id != user_id
        ).first()
        if existing_phone:
            return JSONResponse(
                status_code=status.HTTP_409_CONFLICT,
                content={"success": False, "message": f"Phone '{user_data.phone}' is already in use"}
            )

    # Check duplicate email if being updated
    if user_data.email is not None:
        existing_email = db.query(User).filter(
            User.email == user_data.email, User.id != user_id
        ).first()
        if existing_email:
            return JSONResponse(
                status_code=status.HTTP_409_CONFLICT,
                content={"success": False, "message": f"Email '{user_data.email}' is already in use"}
            )

    try:
        if user_data.role_id is not None:
            user.role_id = user_data.role_id
        if user_data.full_name is not None:
            user.full_name = user_data.full_name
        if user_data.phone is not None:
            user.phone = user_data.phone
        if user_data.email is not None:
            user.email = user_data.email
        if user_data.password is not None:
            user.password = hash_password(user_data.password)  # Password hashing with bcrypt
        if user_data.avatar is not None:
            user.avatar = user_data.avatar
        if user_data.status is not None:
            user.status = user_data.status

        user.updated_at = datetime.now()
        db.commit()
        db.refresh(user)

        return {
            "success": True,
            "message": "User updated successfully",
            "data": UserResponse.model_validate(user).model_dump()
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


# ---------- DELETE /api/users/{id} ----------
@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Delete a user. Requires: ADMIN."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"success": False, "message": "User not found"}
        )

    try:
        db.delete(user)
        db.commit()
        return {
            "success": True,
            "message": "User deleted successfully"
        }
    except IntegrityError:
        db.rollback()
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"success": False, "message": "Cannot delete this user because it is being referenced by other records"}
        )
    except SQLAlchemyError:
        db.rollback()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"success": False, "message": "Database error occurred"}
        )
