from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.core.database import get_db
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse, CategoryStatusUpdate
from app.dependencies.auth import require_admin
from app.services import category_service

router = APIRouter()


# ---------- GET /api/categories ----------
@router.get("")
def get_categories(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Get all categories with optional pagination, search, and status filter. Public endpoint."""
    try:
        items, total, total_pages = category_service.get_categories(
            db=db, search=search, status=status, page=page, limit=limit
        )
        result_items = []
        for c in items:
            c_dict = CategoryResponse.model_validate(c).model_dump()
            c_dict["items_count"] = len(c.menu_items) if hasattr(c, "menu_items") else 0
            result_items.append(c_dict)
            
        return {
            "success": True,
            "message": "Success",
            "data": {
                "items": result_items,
                "pagination": {
                    "page": page,
                    "limit": limit,
                    "total": total,
                    "total_pages": total_pages
                }
            }
        }
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"success": False, "message": f"Database error occurred: {str(e)}"}
        )


# ---------- GET /api/categories/{id} ----------
@router.get("/{category_id}")
def get_category(
    category_id: int,
    db: Session = Depends(get_db),
):
    """Get a category by ID. Public endpoint."""
    try:
        category = category_service.get_category_by_id(db, category_id)
        return {
            "success": True,
            "message": "Success",
            "data": CategoryResponse.model_validate(category).model_dump()
        }
    except HTTPException as e:
        return JSONResponse(
            status_code=e.status_code,
            content={"success": False, "message": e.detail}
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"success": False, "message": f"Database error occurred: {str(e)}"}
        )


# ---------- POST /api/categories ----------
@router.post("", status_code=status.HTTP_201_CREATED)
def create_category(
    category_data: CategoryCreate,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Create a new category. Requires: ADMIN."""
    try:
        new_category = category_service.create_category(db, category_data)
        return {
            "success": True,
            "message": "Category created successfully",
            "data": CategoryResponse.model_validate(new_category).model_dump()
        }
    except HTTPException as e:
        return JSONResponse(
            status_code=e.status_code,
            content={"success": False, "message": e.detail}
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"success": False, "message": f"Database error occurred: {str(e)}"}
        )


# ---------- PUT /api/categories/{id} ----------
@router.put("/{category_id}")
def update_category(
    category_id: int,
    category_data: CategoryUpdate,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Update a category. Requires: ADMIN."""
    try:
        updated_category = category_service.update_category(db, category_id, category_data)
        return {
            "success": True,
            "message": "Category updated successfully",
            "data": CategoryResponse.model_validate(updated_category).model_dump()
        }
    except HTTPException as e:
        return JSONResponse(
            status_code=e.status_code,
            content={"success": False, "message": e.detail}
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"success": False, "message": f"Database error occurred: {str(e)}"}
        )


# ---------- PATCH /api/categories/{id}/status ----------
@router.patch("/{category_id}/status")
def update_category_status(
    category_id: int,
    status_data: CategoryStatusUpdate,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Update status of a category. Requires: ADMIN."""
    try:
        updated_category = category_service.update_category_status(db, category_id, status_data)
        msg = "Mở khóa Category thành công" if status_data.status == "ACTIVE" else "Khóa Category thành công"
        return {
            "success": True,
            "message": msg,
            "data": CategoryResponse.model_validate(updated_category).model_dump()
        }
    except HTTPException as e:
        return JSONResponse(
            status_code=e.status_code,
            content={"success": False, "message": e.detail}
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"success": False, "message": f"Database error occurred: {str(e)}"}
        )


# ---------- DELETE /api/categories/{id} ----------
@router.delete("/{category_id}")
def delete_category(
    category_id: int,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Delete a category. Requires: ADMIN."""
    try:
        category_service.delete_category(db, category_id)
        return {
            "success": True,
            "message": "Category deleted successfully"
        }
    except HTTPException as e:
        return JSONResponse(
            status_code=e.status_code,
            content={"success": False, "message": e.detail}
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"success": False, "message": f"Database error occurred: {str(e)}"}
        )
