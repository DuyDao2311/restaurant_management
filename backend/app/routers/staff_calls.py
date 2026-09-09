from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.models.staff_call import StaffCall
from app.models.table import RestaurantTable
from app.models.user import User
from app.schemas.staff_call import StaffCallCreate, StaffCallResponse, StaffCallListResponse, StaffCallUpdate
from app.dependencies.auth import get_current_user

router = APIRouter()

@router.post("/", response_model=StaffCallResponse, status_code=status.HTTP_201_CREATED)
def create_staff_call(
    call_data: StaffCallCreate,
    db: Session = Depends(get_db)
):
    # This is a public endpoint (for customers scanning QR)
    # Validate table
    table = db.query(RestaurantTable).filter(RestaurantTable.id == call_data.table_id).first()
    if not table:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Table not found")
        
    # Check for anti-spam: is there already a PENDING call for this table?
    existing_call = db.query(StaffCall).filter(
        StaffCall.table_id == call_data.table_id,
        StaffCall.status == "PENDING"
    ).first()
    
    if existing_call:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="There is already a pending request for this table. Please wait."
        )
        
    new_call = StaffCall(
        table_id=call_data.table_id,
        reason=call_data.reason,
        note=call_data.note,
        status="PENDING",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    db.add(new_call)
    db.commit()
    db.refresh(new_call)
    
    return new_call

@router.get("/", response_model=StaffCallListResponse)
def get_staff_calls(
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role.name not in ["ADMIN", "STAFF"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view staff calls"
        )
        
    query = db.query(StaffCall)
    
    if status:
        query = query.filter(StaffCall.status == status)
        
    total = query.count()
    calls = query.order_by(desc(StaffCall.created_at)).offset((page - 1) * size).limit(size).all()
    
    return {
        "items": calls,
        "total": total,
        "page": page,
        "size": size
    }

@router.patch("/{call_id}/status", response_model=StaffCallResponse)
def update_staff_call_status(
    call_id: int,
    status_update: StaffCallUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role.name not in ["ADMIN", "STAFF"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update staff calls"
        )
        
    call = db.query(StaffCall).filter(StaffCall.id == call_id).first()
    if not call:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Staff call not found")
        
    valid_statuses = ["PENDING", "COMPLETED"]
    if status_update.status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )
        
    call.status = status_update.status
    call.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(call)
    
    return call
