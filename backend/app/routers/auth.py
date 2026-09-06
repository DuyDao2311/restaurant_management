from datetime import datetime

from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User
from app.models.role import Role
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, MeResponse
from app.schemas.user import UserResponse
from app.dependencies.auth import get_current_user

router = APIRouter()


# ---------- POST /api/auth/register ----------
@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new CUSTOMER account."""

    # Check duplicate phone
    existing_phone = db.query(User).filter(User.phone == data.phone).first()
    if existing_phone:
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"success": False, "message": "Phone number already exists"}
        )

    # Check duplicate email (only if email is provided)
    if data.email:
        existing_email = db.query(User).filter(User.email == data.email).first()
        if existing_email:
            return JSONResponse(
                status_code=status.HTTP_409_CONFLICT,
                content={"success": False, "message": "Email already exists"}
            )

    # Find CUSTOMER role (must exist in database)
    customer_role = db.query(Role).filter(Role.name == "CUSTOMER").first()
    if not customer_role:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"success": False, "message": "System error: CUSTOMER role not found in database"}
        )

    try:
        now = datetime.now()
        new_user = User(
            role_id=customer_role.id,
            full_name=data.full_name,
            phone=data.phone,
            email=data.email,
            password=hash_password(data.password),
            status="ACTIVE",
            created_at=now,
            updated_at=now
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return {
            "success": True,
            "message": "Registration successful",
            "data": UserResponse.model_validate(new_user).model_dump()
        }
    except IntegrityError:
        db.rollback()
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"success": False, "message": "Phone or email already exists"}
        )
    except SQLAlchemyError:
        db.rollback()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"success": False, "message": "Database error occurred"}
        )


# ---------- POST /api/auth/login ----------
@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    """Login with phone + password (JSON). Returns JWT access token."""

    # Find user by phone
    user = db.query(User).filter(User.phone == data.phone).first()

    # Check user exists and password is correct
    if not user or not verify_password(data.password, user.password):
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"success": False, "message": "Incorrect phone or password"}
        )

    # Check user status
    if user.status != "ACTIVE":
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={"success": False, "message": "Your account is inactive or blocked"}
        )

    # Get role name for JWT payload
    role_name = user.role.name if user.role else "CUSTOMER"

    # Create JWT token
    access_token = create_access_token(data={
        "user_id": user.id,
        "role": role_name
    })

    return {
        "success": True,
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "phone": user.phone,
            "role": role_name
        }
    }


# ---------- POST /api/auth/swagger-login ----------
@router.post("/swagger-login", include_in_schema=False)
def swagger_login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Dedicated login endpoint for Swagger UI OAuth2 form."""
    user = db.query(User).filter(User.phone == form_data.username).first()

    if not user or not verify_password(form_data.password, user.password):
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"success": False, "message": "Incorrect phone or password"}
        )

    if user.status != "ACTIVE":
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={"success": False, "message": "Your account is inactive or blocked"}
        )

    role_name = user.role.name if user.role else "CUSTOMER"
    access_token = create_access_token(data={"user_id": user.id, "role": role_name})

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


# ---------- GET /api/auth/me ----------
@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    """Get current authenticated user info."""
    role_name = current_user.role.name if current_user.role else ""

    return {
        "success": True,
        "message": "Success",
        "data": {
            "id": current_user.id,
            "full_name": current_user.full_name,
            "phone": current_user.phone,
            "email": current_user.email,
            "role": role_name,
            "status": current_user.status
        }
    }
