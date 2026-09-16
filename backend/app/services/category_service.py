import math
from datetime import datetime
from typing import List, Tuple, Optional

from sqlalchemy import or_
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status

from app.models.category import Category
from app.models.menu_item import MenuItem
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryStatusUpdate


def get_categories(
    db: Session,
    search: Optional[str] = None,
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 10
) -> Tuple[List[Category], int, int]:
    """
    Get categories with pagination, search, and status filter.
    Returns (items, total_count, total_pages).
    """
    query = db.query(Category)

    if search:
        search_term = f"%{search}%"
        query = query.filter(Category.name.ilike(search_term))
        
    if status and status != 'ALL':
        query = query.filter(Category.status == status)

    total = query.count()
    total_pages = math.ceil(total / limit) if limit > 0 else 0

    if limit > 0:
        offset = (page - 1) * limit
        items = query.order_by(Category.created_at.desc()).offset(offset).limit(limit).all()
    else:
        items = query.order_by(Category.created_at.desc()).all()

    return items, total, total_pages


def get_category_by_id(db: Session, category_id: int) -> Category:
    """
    Get category by ID. Raises 404 if not found.
    """
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    return category


def create_category(db: Session, category_data: CategoryCreate) -> Category:
    """
    Create a new category. Checks for duplicate name.
    """
    # Check duplicate name (case insensitive ideally, but exact match for now as per schema)
    existing = db.query(Category).filter(Category.name == category_data.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Category with name '{category_data.name}' already exists"
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
        return new_category
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Category with this name already exists"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error occurred: {str(e)}"
        )


def update_category(db: Session, category_id: int, category_data: CategoryUpdate) -> Category:
    """
    Update an existing category. Checks for duplicate name.
    """
    category = get_category_by_id(db, category_id)

    # Check duplicate name if updating name
    if category_data.name is not None and category_data.name != category.name:
        existing = db.query(Category).filter(
            Category.name == category_data.name, Category.id != category_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Category with name '{category_data.name}' already exists"
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
        return category
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Category with this name already exists"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error occurred: {str(e)}"
        )


def update_category_status(db: Session, category_id: int, status_data: CategoryStatusUpdate) -> Category:
    """
    Update the status of a category.
    """
    category = get_category_by_id(db, category_id)

    try:
        category.status = status_data.status
        category.updated_at = datetime.now()
        db.commit()
        db.refresh(category)
        return category
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error occurred: {str(e)}"
        )


def delete_category(db: Session, category_id: int):
    """
    Delete a category. Ensures it is not used by any MenuItem.
    """
    category = get_category_by_id(db, category_id)

    # Check if category has menu items
    menu_item_count = db.query(MenuItem).filter(MenuItem.category_id == category_id).count()
    if menu_item_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Không thể xóa Category vì đang có {menu_item_count} MenuItem sử dụng Category này."
        )

    try:
        db.delete(category)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error occurred: {str(e)}"
        )
