from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from app.core.database import get_db
from app.models.menu_item import MenuItem
from app.models.category import Category
from app.models.order_item import OrderItem
from app.schemas.menu_item import MenuItemCreate, MenuItemUpdate, MenuItemResponse
from app.dependencies.auth import get_current_user, require_admin_or_staff

router = APIRouter()


# ---------- GET /api/menu-items ----------
@router.get("")
def get_menu_items(
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (ACTIVE, INACTIVE)"),
    search: Optional[str] = Query(None, description="Search by item name"),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get all menu items with optional filters.
    Requires: any authenticated user (ADMIN, STAFF, CUSTOMER).

    Filters:
    - category_id: filter by category
    - status: filter by ACTIVE or INACTIVE
    - search: search by item name (partial match)
    """
    try:
        query = db.query(MenuItem)

        # Apply filters
        if category_id is not None:
            query = query.filter(MenuItem.category_id == category_id)

        if status_filter is not None:
            query = query.filter(MenuItem.status == status_filter)

        if search is not None and search.strip():
            query = query.filter(MenuItem.name.ilike(f"%{search.strip()}%"))

        items = query.all()
        return {
            "success": True,
            "message": "Success",
            "data": [MenuItemResponse.model_validate(i).model_dump() for i in items]
        }
    except SQLAlchemyError:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"success": False, "message": "Database error occurred"}
        )


# ---------- GET /api/menu-items/{item_id} ----------
@router.get("/{item_id}")
def get_menu_item(
    item_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a menu item by ID. Requires: any authenticated user."""
    item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not item:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"success": False, "message": "Menu item not found"}
        )
    return {
        "success": True,
        "message": "Success",
        "data": MenuItemResponse.model_validate(item).model_dump()
    }


# ---------- POST /api/menu-items ----------
@router.post("", status_code=status.HTTP_201_CREATED)
def create_menu_item(
    item_data: MenuItemCreate,
    current_user=Depends(require_admin_or_staff),
    db: Session = Depends(get_db),
):
    """Create a new menu item. Requires: ADMIN or STAFF."""
    # Check if category exists
    category = db.query(Category).filter(Category.id == item_data.category_id).first()
    if not category:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"success": False, "message": f"Category with id {item_data.category_id} not found"}
        )

    try:
        now = datetime.now()
        new_item = MenuItem(
            category_id=item_data.category_id,
            code=item_data.code,
            name=item_data.name,
            description=item_data.description,
            price=item_data.price,
            image=item_data.image,
            status=item_data.status,
            is_available=item_data.is_available,
            created_at=now,
            updated_at=now
        )
        db.add(new_item)
        db.commit()
        db.refresh(new_item)

        return {
            "success": True,
            "message": "Menu item created successfully",
            "data": MenuItemResponse.model_validate(new_item).model_dump()
        }
    except IntegrityError:
        db.rollback()
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"success": False, "message": "Menu item could not be created due to a conflict"}
        )
    except SQLAlchemyError:
        db.rollback()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"success": False, "message": "Database error occurred"}
        )


# ---------- PUT /api/menu-items/{item_id} ----------
@router.put("/{item_id}")
def update_menu_item(
    item_id: int,
    item_data: MenuItemUpdate,
    current_user=Depends(require_admin_or_staff),
    db: Session = Depends(get_db),
):
    """Update a menu item. Requires: ADMIN or STAFF."""
    item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not item:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"success": False, "message": "Menu item not found"}
        )

    # Check if category exists if being updated
    if item_data.category_id is not None:
        category = db.query(Category).filter(Category.id == item_data.category_id).first()
        if not category:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"success": False, "message": f"Category with id {item_data.category_id} not found"}
            )

    try:
        if item_data.category_id is not None:
            item.category_id = item_data.category_id
        if item_data.code is not None:
            item.code = item_data.code
        if item_data.name is not None:
            item.name = item_data.name
        if item_data.description is not None:
            item.description = item_data.description
        if item_data.price is not None:
            item.price = item_data.price
        if item_data.image is not None:
            item.image = item_data.image
        if item_data.status is not None:
            item.status = item_data.status
        if item_data.is_available is not None:
            item.is_available = item_data.is_available

        item.updated_at = datetime.now()
        db.commit()
        db.refresh(item)

        return {
            "success": True,
            "message": "Menu item updated successfully",
            "data": MenuItemResponse.model_validate(item).model_dump()
        }
    except IntegrityError:
        db.rollback()
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"success": False, "message": "Menu item could not be updated due to a conflict"}
        )
    except SQLAlchemyError:
        db.rollback()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"success": False, "message": "Database error occurred"}
        )


# ---------- DELETE /api/menu-items/{item_id} ----------
@router.delete("/{item_id}")
def delete_menu_item(
    item_id: int,
    current_user=Depends(require_admin_or_staff),
    db: Session = Depends(get_db),
):
    """
    Delete a menu item. Requires: ADMIN or STAFF.

    If the item is referenced by order_items, it will be soft-deleted
    (status set to INACTIVE, is_available set to False) instead of
    physically deleted to preserve order history.
    """
    item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not item:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"success": False, "message": "Menu item not found"}
        )

    # Check if menu item is being used in order_items
    order_item_count = db.query(OrderItem).filter(OrderItem.menu_item_id == item_id).count()

    try:
        if order_item_count > 0:
            # Soft delete: set status to INACTIVE and is_available to False
            item.status = "INACTIVE"
            item.is_available = False
            item.updated_at = datetime.now()
            db.commit()
            return {
                "success": True,
                "message": f"Menu item has been deactivated (soft delete) because it is used in {order_item_count} order(s)"
            }
        else:
            # Hard delete: no references exist
            db.delete(item)
            db.commit()
            return {
                "success": True,
                "message": "Menu item deleted successfully"
            }
    except SQLAlchemyError:
        db.rollback()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"success": False, "message": "Database error occurred"}
        )
