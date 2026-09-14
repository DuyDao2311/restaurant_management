import math
from datetime import datetime
from typing import List, Tuple, Optional

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status

from app.models.category import Category
from app.models.menu_item import MenuItem
from app.models.order_item import OrderItem
from app.schemas.menu_item import MenuItemCreate, MenuItemUpdate, MenuItemStatusUpdate


def get_menu_items(
    db: Session,
    category_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 10
) -> Tuple[List[MenuItem], int, int]:
    """
    Get menu items with pagination and optional filters.
    Returns (items, total_count, total_pages).
    """
    query = db.query(MenuItem)

    if category_id is not None:
        query = query.filter(MenuItem.category_id == category_id)

    if status_filter is not None:
        query = query.filter(MenuItem.status == status_filter)

    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(MenuItem.name.ilike(search_term))

    total = query.count()
    total_pages = math.ceil(total / limit) if limit > 0 else 0

    if limit > 0:
        offset = (page - 1) * limit
        items = query.order_by(MenuItem.created_at.desc()).offset(offset).limit(limit).all()
    else:
        items = query.order_by(MenuItem.created_at.desc()).all()

    return items, total, total_pages


def get_menu_item_by_id(db: Session, item_id: int) -> MenuItem:
    """
    Get menu item by ID. Raises 404 if not found.
    """
    item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu item not found"
        )
    return item


def create_menu_item(db: Session, item_data: MenuItemCreate) -> MenuItem:
    """
    Create a new menu item. Checks if category exists.
    """
    category = db.query(Category).filter(Category.id == item_data.category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category with id {item_data.category_id} not found"
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
        return new_item
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Menu item could not be created due to a conflict"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error occurred: {str(e)}"
        )


def update_menu_item(db: Session, item_id: int, item_data: MenuItemUpdate) -> MenuItem:
    """
    Update an existing menu item. Checks if category exists when updated.
    """
    item = get_menu_item_by_id(db, item_id)

    if item_data.category_id is not None:
        category = db.query(Category).filter(Category.id == item_data.category_id).first()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Category with id {item_data.category_id} not found"
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
        return item
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Menu item could not be updated due to a conflict"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error occurred: {str(e)}"
        )


def update_menu_item_status(db: Session, item_id: int, status_data: MenuItemStatusUpdate) -> MenuItem:
    """
    Update the status of a menu item.
    """
    item = get_menu_item_by_id(db, item_id)

    try:
        item.status = status_data.status
        item.updated_at = datetime.now()
        db.commit()
        db.refresh(item)
        return item
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error occurred: {str(e)}"
        )


def delete_menu_item(db: Session, item_id: int) -> dict:
    """
    Delete a menu item.
    If the item is referenced by order_items, it will be soft-deleted.
    Returns a dict with message.
    """
    item = get_menu_item_by_id(db, item_id)

    # Check if menu item is being used in order_items
    order_item_count = db.query(OrderItem).filter(OrderItem.menu_item_id == item_id).count()

    try:
        if order_item_count > 0:
            # Soft delete
            item.status = "INACTIVE"
            item.is_available = False
            item.updated_at = datetime.now()
            db.commit()
            return {
                "message": f"Menu item has been deactivated (soft delete) because it is used in {order_item_count} order(s)"
            }
        else:
            # Hard delete
            db.delete(item)
            db.commit()
            return {
                "message": "Menu item deleted successfully"
            }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error occurred: {str(e)}"
        )
