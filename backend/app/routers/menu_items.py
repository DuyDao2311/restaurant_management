from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.core.database import get_db
from app.schemas.menu_item import MenuItemCreate, MenuItemUpdate, MenuItemResponse, MenuItemStatusUpdate
from app.dependencies.auth import require_admin
from app.services import menu_item_service

router = APIRouter()


# ---------- GET /api/menu-items ----------
@router.get("")
def get_menu_items(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (ACTIVE, INACTIVE)"),
    search: Optional[str] = Query(None, description="Search by item name"),
    db: Session = Depends(get_db),
):
    """
    Get all menu items with pagination and filters.
    Public endpoint.
    """
    try:
        items, total, total_pages = menu_item_service.get_menu_items(
            db=db, 
            category_id=category_id, 
            status_filter=status_filter, 
            search=search, 
            page=page, 
            limit=limit
        )
        return {
            "success": True,
            "message": "Success",
            "data": {
                "items": [MenuItemResponse.model_validate(i).model_dump() for i in items],
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


# ---------- GET /api/menu-items/{item_id} ----------
@router.get("/{item_id}")
def get_menu_item(
    item_id: int,
    db: Session = Depends(get_db),
):
    """Get a menu item by ID. Public endpoint."""
    try:
        item = menu_item_service.get_menu_item_by_id(db, item_id)
        return {
            "success": True,
            "message": "Success",
            "data": MenuItemResponse.model_validate(item).model_dump()
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


# ---------- POST /api/menu-items ----------
@router.post("", status_code=status.HTTP_201_CREATED)
def create_menu_item(
    item_data: MenuItemCreate,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Create a new menu item. Requires: ADMIN."""
    try:
        new_item = menu_item_service.create_menu_item(db, item_data)
        return {
            "success": True,
            "message": "Menu item created successfully",
            "data": MenuItemResponse.model_validate(new_item).model_dump()
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


# ---------- PUT /api/menu-items/{item_id} ----------
@router.put("/{item_id}")
def update_menu_item(
    item_id: int,
    item_data: MenuItemUpdate,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Update a menu item. Requires: ADMIN."""
    try:
        updated_item = menu_item_service.update_menu_item(db, item_id, item_data)
        return {
            "success": True,
            "message": "Menu item updated successfully",
            "data": MenuItemResponse.model_validate(updated_item).model_dump()
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


# ---------- PATCH /api/menu-items/{item_id}/status ----------
@router.patch("/{item_id}/status")
def update_menu_item_status(
    item_id: int,
    status_data: MenuItemStatusUpdate,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Update status of a menu item. Requires: ADMIN."""
    try:
        updated_item = menu_item_service.update_menu_item_status(db, item_id, status_data)
        msg = "Mở khóa MenuItem thành công" if status_data.status == "ACTIVE" else "Khóa MenuItem thành công"
        return {
            "success": True,
            "message": msg,
            "data": MenuItemResponse.model_validate(updated_item).model_dump()
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


# ---------- DELETE /api/menu-items/{item_id} ----------
@router.delete("/{item_id}")
def delete_menu_item(
    item_id: int,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Delete a menu item. Requires: ADMIN.
    If the item is referenced by order_items, it will be soft-deleted.
    """
    try:
        result = menu_item_service.delete_menu_item(db, item_id)
        return {
            "success": True,
            "message": result["message"]
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
