from datetime import datetime

from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from app.core.database import get_db
from app.models.role import Role
from app.models.user import User
from app.schemas.role import RoleCreate, RoleUpdate, RoleResponse
from app.dependencies.auth import require_admin

router = APIRouter()


# ---------- GET /api/roles ----------
@router.get("")
def get_roles(
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Get all roles. Requires: ADMIN."""
    try:
        roles = db.query(Role).all()
        return {
            "success": True,
            "message": "Success",
            "data": [RoleResponse.model_validate(r).model_dump() for r in roles]
        }
    except SQLAlchemyError:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"success": False, "message": "Database error occurred"}
        )


# ---------- GET /api/roles/{id} ----------
@router.get("/{role_id}")
def get_role(
    role_id: int,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Get a role by ID. Requires: ADMIN."""
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"success": False, "message": "Role not found"}
        )
    return {
        "success": True,
        "message": "Success",
        "data": RoleResponse.model_validate(role).model_dump()
    }


# ---------- POST /api/roles ----------
@router.post("", status_code=status.HTTP_201_CREATED)
def create_role(
    role_data: RoleCreate,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Create a new role. Requires: ADMIN."""
    # Check duplicate name
    existing = db.query(Role).filter(Role.name == role_data.name).first()
    if existing:
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"success": False, "message": f"Role with name '{role_data.name}' already exists"}
        )

    try:
        new_role = Role(
            name=role_data.name,
            description=role_data.description,
            created_at=datetime.now()
        )
        db.add(new_role)
        db.commit()
        db.refresh(new_role)

        return {
            "success": True,
            "message": "Role created successfully",
            "data": RoleResponse.model_validate(new_role).model_dump()
        }
    except IntegrityError:
        db.rollback()
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"success": False, "message": "Role with this name already exists"}
        )
    except SQLAlchemyError:
        db.rollback()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"success": False, "message": "Database error occurred"}
        )


# ---------- PUT /api/roles/{id} ----------
@router.put("/{role_id}")
def update_role(
    role_id: int,
    role_data: RoleUpdate,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Update a role. Requires: ADMIN."""
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"success": False, "message": "Role not found"}
        )

    # Check duplicate name if name is being updated
    if role_data.name is not None:
        existing = db.query(Role).filter(Role.name == role_data.name, Role.id != role_id).first()
        if existing:
            return JSONResponse(
                status_code=status.HTTP_409_CONFLICT,
                content={"success": False, "message": f"Role with name '{role_data.name}' already exists"}
            )

    try:
        if role_data.name is not None:
            role.name = role_data.name
        if role_data.description is not None:
            role.description = role_data.description

        db.commit()
        db.refresh(role)

        return {
            "success": True,
            "message": "Role updated successfully",
            "data": RoleResponse.model_validate(role).model_dump()
        }
    except IntegrityError:
        db.rollback()
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"success": False, "message": "Role with this name already exists"}
        )
    except SQLAlchemyError:
        db.rollback()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"success": False, "message": "Database error occurred"}
        )


# ---------- DELETE /api/roles/{id} ----------
@router.delete("/{role_id}")
def delete_role(
    role_id: int,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Delete a role. Requires: ADMIN."""
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"success": False, "message": "Role not found"}
        )

    # Check if role is being used by any users
    user_count = db.query(User).filter(User.role_id == role_id).count()
    if user_count > 0:
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={
                "success": False,
                "message": f"Cannot delete this role because it is being used by {user_count} user(s)"
            }
        )

    try:
        db.delete(role)
        db.commit()
        return {
            "success": True,
            "message": "Role deleted successfully"
        }
    except SQLAlchemyError:
        db.rollback()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"success": False, "message": "Database error occurred"}
        )
