from datetime import datetime

from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from app.core.database import get_db
from app.models.category import Category
from app.models.menu_item import MenuItem
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse
from app.dependencies.auth import get_current_user, require_admin_or_staff

router = APIRouter()


# ---------- GET /api/categories ----------
@router.get("")
def get_categories(
    db: Session = Depends(get_db),
):
    """Get all categories. Public endpoint."""
    try:
        categories = db.query(Category).all()
        return {
            "success": True,
            "message": "Success",
            "data": [CategoryResponse.model_validate(c).model_dump() for c in categories]
        }
    except SQLAlchemyError:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"success": False, "message": "Database error occurred"}
        )


# ---------- GET /api/categories/{id} ----------
@router.get("/{category_id}")
def get_category(
    category_id: int,
    db: Session = Depends(get_db),
):
    """Get a category by ID. Public endpoint."""
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"success": False, "message": "Category not found"}
        )
    return {
        "success": True,
        "message": "Success",
        "data": CategoryResponse.model_validate(category).model_dump()
    }


# ---------- POST /api/categories ----------
@router.post("", status_code=status.HTTP_201_CREATED)
def create_category(
    category_data: CategoryCreate,
    current_user=Depends(require_admin_or_staff),
    db: Session = Depends(get_db),
):
    """Create a new category. Requires: ADMIN or STAFF."""
    # Check duplicate name
    existing = db.query(Category).filter(Category.name == category_data.name).first()
    if existing:
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"success": False, "message": f"Category with name '{category_data.name}' already exists"}
        )

    try:
        now = datetime.now()
        new_category = Category(
            name=category_data.name,
            description=category_data.description,
            image=category_data.image,
            status=category_data.status,
            created_at=now,
            updated_at=now
        )
        db.add(new_category)
        db.commit()
        db.refresh(new_category)

        return {
            "success": True,
            "message": "Category created successfully",
            "data": CategoryResponse.model_validate(new_category).model_dump()
        }
    except IntegrityError:
        db.rollback()
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"success": False, "message": "Category with this name already exists"}
        )
    except SQLAlchemyError:
        db.rollback()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"success": False, "message": "Database error occurred"}
        )


# ---------- PUT /api/categories/{id} ----------
@router.put("/{category_id}")
def update_category(
    category_id: int,
    category_data: CategoryUpdate,
    current_user=Depends(require_admin_or_staff),
    db: Session = Depends(get_db),
):
    """Update a category. Requires: ADMIN or STAFF."""
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"success": False, "message": "Category not found"}
        )

    # Check duplicate name if being updated
    if category_data.name is not None:
        existing = db.query(Category).filter(
            Category.name == category_data.name, Category.id != category_id
        ).first()
        if existing:
            return JSONResponse(
                status_code=status.HTTP_409_CONFLICT,
                content={"success": False, "message": f"Category with name '{category_data.name}' already exists"}
            )

    try:
        if category_data.name is not None:
            category.name = category_data.name
        if category_data.description is not None:
            category.description = category_data.description
        if category_data.image is not None:
            category.image = category_data.image
        if category_data.status is not None:
            category.status = category_data.status

        category.updated_at = datetime.now()
        db.commit()
        db.refresh(category)

        return {
            "success": True,
            "message": "Category updated successfully",
            "data": CategoryResponse.model_validate(category).model_dump()
        }
    except IntegrityError:
        db.rollback()
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"success": False, "message": "Category with this name already exists"}
        )
    except SQLAlchemyError:
        db.rollback()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"success": False, "message": "Database error occurred"}
        )


# ---------- DELETE /api/categories/{id} ----------
@router.delete("/{category_id}")
def delete_category(
    category_id: int,
    current_user=Depends(require_admin_or_staff),
    db: Session = Depends(get_db),
):
    """Delete a category. Requires: ADMIN or STAFF."""
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"success": False, "message": "Category not found"}
        )

    # Check if category has menu items
    menu_item_count = db.query(MenuItem).filter(MenuItem.category_id == category_id).count()
    if menu_item_count > 0:
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={
                "success": False,
                "message": f"Cannot delete this category because it has {menu_item_count} menu item(s)"
            }
        )

    try:
        db.delete(category)
        db.commit()
        return {
            "success": True,
            "message": "Category deleted successfully"
        }
    except SQLAlchemyError:
        db.rollback()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"success": False, "message": "Database error occurred"}
        )
