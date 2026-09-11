import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from app.core.database import get_db
from app.core.config import settings
from app.models.table import RestaurantTable
from app.models.qr_code import TableQRCode
from app.models.reservation import Reservation
from app.models.order import Order
from app.schemas.table import (
    TableCreate, TableUpdate, TableResponse,
    TableQRResponse, TablePublicQRResponse
)
from app.dependencies.auth import get_current_user, require_admin_or_staff

router = APIRouter()


# ---------- GET /api/tables ----------
@router.get("")
def get_tables(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter: AVAILABLE, RESERVED, OCCUPIED, MAINTENANCE"),
    location: Optional[str] = Query(None, description="Filter by location"),
    search: Optional[str] = Query(None, description="Search by table_number"),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all tables with optional filters. Requires: any authenticated user."""
    try:
        query = db.query(RestaurantTable)

        if status_filter is not None:
            query = query.filter(RestaurantTable.status == status_filter)

        if location is not None and location.strip():
            query = query.filter(RestaurantTable.location.ilike(f"%{location.strip()}%"))

        if search is not None and search.strip():
            query = query.filter(RestaurantTable.table_number.ilike(f"%{search.strip()}%"))

        tables = query.all()
        return {
            "success": True,
            "message": "Success",
            "data": [TableResponse.model_validate(t).model_dump() for t in tables]
        }
    except SQLAlchemyError:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"success": False, "message": "Database error occurred"}
        )


# ---------- GET /api/tables/qr/{qr_token} (PUBLIC — no JWT required) ----------
# NOTE: This route MUST be defined BEFORE /{table_id} to avoid FastAPI
# matching "qr" as a table_id path parameter.
@router.get("/qr/{qr_token}")
def validate_qr_token(
    qr_token: str,
    db: Session = Depends(get_db),
):
    """
    Public QR validation endpoint. No JWT required.
    Customer scans QR → gets table info.
    """
    # Find QR code by token
    qr_code = db.query(TableQRCode).filter(
        TableQRCode.qr_token == qr_token,
        TableQRCode.status == "ACTIVE"
    ).first()

    if not qr_code:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"success": False, "message": "Invalid or expired QR code"}
        )

    table = qr_code.table
    if not table:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"success": False, "message": "Table not found"}
        )

    return {
        "success": True,
        "message": "Success",
        "data": {
            "table_id": table.id,
            "table_number": table.table_number,
            "capacity": table.capacity,
            "location": table.location,
            "status": table.status
        }
    }


# ---------- GET /api/tables/{table_id} ----------
@router.get("/{table_id}")
def get_table(
    table_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a table by ID. Requires: any authenticated user."""
    table = db.query(RestaurantTable).filter(RestaurantTable.id == table_id).first()
    if not table:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"success": False, "message": "Table not found"}
        )
    return {
        "success": True,
        "message": "Success",
        "data": TableResponse.model_validate(table).model_dump()
    }


# ---------- POST /api/tables ----------
@router.post("", status_code=status.HTTP_201_CREATED)
def create_table(
    table_data: TableCreate,
    current_user=Depends(require_admin_or_staff),
    db: Session = Depends(get_db),
):
    """
    Create a new table + auto-generate QR code. Requires: ADMIN or STAFF.
    QR token is generated server-side using UUID. Client cannot set it.
    """
    # Check duplicate table_number
    existing = db.query(RestaurantTable).filter(
        RestaurantTable.table_number == table_data.table_number
    ).first()
    if existing:
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"success": False, "message": f"Table number '{table_data.table_number}' already exists"}
        )

    try:
        now = datetime.now()

        # Create the table
        new_table = RestaurantTable(
            table_number=table_data.table_number,
            capacity=table_data.capacity,
            location=table_data.location,
            status=table_data.status,
            created_at=now,
            updated_at=now
        )
        db.add(new_table)
        db.flush()  # Get the new table ID without committing

        # Auto-generate QR code for this table
        qr_token = str(uuid.uuid4())
        qr_url = f"{settings.FRONTEND_URL}/table/{qr_token}"

        new_qr = TableQRCode(
            table_id=new_table.id,
            qr_token=qr_token,
            qr_url=qr_url,
            status="ACTIVE",
            created_at=now
        )
        db.add(new_qr)
        db.commit()
        db.refresh(new_table)

        return {
            "success": True,
            "message": "Table created successfully",
            "data": TableResponse.model_validate(new_table).model_dump()
        }
    except IntegrityError:
        db.rollback()
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"success": False, "message": "Table number already exists"}
        )
    except SQLAlchemyError:
        db.rollback()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"success": False, "message": "Database error occurred"}
        )


# ---------- PUT /api/tables/{table_id} ----------
@router.put("/{table_id}")
def update_table(
    table_id: int,
    table_data: TableUpdate,
    current_user=Depends(require_admin_or_staff),
    db: Session = Depends(get_db),
):
    """Update a table. Requires: ADMIN or STAFF. Cannot change qr_token."""
    table = db.query(RestaurantTable).filter(RestaurantTable.id == table_id).first()
    if not table:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"success": False, "message": "Table not found"}
        )

    # Check duplicate table_number if being updated
    if table_data.table_number is not None:
        existing = db.query(RestaurantTable).filter(
            RestaurantTable.table_number == table_data.table_number,
            RestaurantTable.id != table_id
        ).first()
        if existing:
            return JSONResponse(
                status_code=status.HTTP_409_CONFLICT,
                content={"success": False, "message": f"Table number '{table_data.table_number}' already exists"}
            )

    try:
        if table_data.table_number is not None:
            table.table_number = table_data.table_number
        if table_data.capacity is not None:
            table.capacity = table_data.capacity
        if table_data.location is not None:
            table.location = table_data.location
        if table_data.status is not None:
            table.status = table_data.status

        table.updated_at = datetime.now()
        db.commit()
        db.refresh(table)

        return {
            "success": True,
            "message": "Table updated successfully",
            "data": TableResponse.model_validate(table).model_dump()
        }
    except IntegrityError:
        db.rollback()
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"success": False, "message": "Table number already exists"}
        )
    except SQLAlchemyError:
        db.rollback()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"success": False, "message": "Database error occurred"}
        )


# ---------- DELETE /api/tables/{table_id} ----------
@router.delete("/{table_id}")
def delete_table(
    table_id: int,
    current_user=Depends(require_admin_or_staff),
    db: Session = Depends(get_db),
):
    """
    Delete a table. Requires: ADMIN or STAFF.
    If table has reservations or orders, returns 409 (cannot delete history).
    QR codes are deleted via CASCADE.
    """
    table = db.query(RestaurantTable).filter(RestaurantTable.id == table_id).first()
    if not table:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"success": False, "message": "Table not found"}
        )

    # Check if table is being used by reservations
    reservation_count = db.query(Reservation).filter(Reservation.table_id == table_id).count()
    if reservation_count > 0:
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={
                "success": False,
                "message": f"Cannot delete this table because it has {reservation_count} reservation(s)"
            }
        )

    # Check if table is being used by orders
    order_count = db.query(Order).filter(Order.table_id == table_id).count()
    if order_count > 0:
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={
                "success": False,
                "message": f"Cannot delete this table because it has {order_count} order(s)"
            }
        )

    try:
        # QR codes will be deleted via ON DELETE CASCADE in the database
        db.delete(table)
        db.commit()
        return {
            "success": True,
            "message": "Table deleted successfully"
        }
    except SQLAlchemyError:
        db.rollback()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"success": False, "message": "Database error occurred"}
        )


# ---------- GET /api/tables/{table_id}/qr ----------
@router.get("/{table_id}/qr")
def get_table_qr(
    table_id: int,
    current_user=Depends(require_admin_or_staff),
    db: Session = Depends(get_db),
):
    """
    Get QR management data for a table. Requires: ADMIN or STAFF.
    If no QR exists, auto-generates one.
    """
    table = db.query(RestaurantTable).filter(RestaurantTable.id == table_id).first()
    if not table:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"success": False, "message": "Table not found"}
        )

    # Find ACTIVE QR code for this table
    qr_code = db.query(TableQRCode).filter(
        TableQRCode.table_id == table_id,
        TableQRCode.status == "ACTIVE"
    ).first()

    # If no QR exists, auto-generate one
    if not qr_code:
        try:
            qr_token = str(uuid.uuid4())
            qr_url = f"{settings.FRONTEND_URL}/table/{qr_token}"
            qr_code = TableQRCode(
                table_id=table_id,
                qr_token=qr_token,
                qr_url=qr_url,
                status="ACTIVE",
                created_at=datetime.now()
            )
            db.add(qr_code)
            db.commit()
            db.refresh(qr_code)
        except SQLAlchemyError:
            db.rollback()
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"success": False, "message": "Failed to generate QR code"}
            )

    return {
        "success": True,
        "message": "Success",
        "data": {
            "table_id": table.id,
            "table_number": table.table_number,
            "qr_token": qr_code.qr_token,
            "qr_url": qr_code.qr_url or f"{settings.FRONTEND_URL}/table/{qr_code.qr_token}",
            "status": qr_code.status
        }
    }

# ---------- GET /api/tables/{table_id}/session ----------
@router.get("/{table_id}/session")
def api_get_table_session(
    table_id: int,
    current_user=Depends(require_admin_or_staff),
    db: Session = Depends(get_db),
):
    """
    Get ACTIVE session for a table. Requires: ADMIN or STAFF.
    """
    from app.services.table_session_service import get_active_session_by_table
    from app.schemas.table_session import TableSessionResponse

    session = get_active_session_by_table(db, table_id)
    return {
        "success": True,
        "message": "Success",
        "data": TableSessionResponse.model_validate(session).model_dump()
    }

