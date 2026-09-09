from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import List, Optional
import random
import string
from datetime import datetime

from app.core.database import get_db
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.menu_item import MenuItem
from app.models.table import RestaurantTable
from app.models.user import User
from app.schemas.order import OrderCreate, OrderResponse, OrderListResponse, OrderStatusUpdate
from app.dependencies.auth import get_current_user

router = APIRouter()

def generate_order_code() -> str:
    # ORD-XXXXXXX where X is uppercase letter
    random_str = ''.join(random.choices(string.ascii_uppercase, k=7))
    return f"ORD-{random_str}"

@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    order_data: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role.name not in ["ADMIN", "STAFF"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create order"
        )
    
    if not order_data.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order must contain at least one item"
        )
    
    # Check table
    table = db.query(RestaurantTable).filter(RestaurantTable.id == order_data.table_id).first()
    if not table:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Table not found")
        
    subtotal = 0
    order_items_to_create = []
    
    # Validate foods and calculate subtotal
    for item in order_data.items:
        menu_item = db.query(MenuItem).filter(MenuItem.id == item.menu_item_id).first()
        if not menu_item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Menu item {item.menu_item_id} not found"
            )
        if not menu_item.is_available:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Menu item {menu_item.name} is not available"
            )
        if item.quantity < 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Quantity must be at least 1"
            )
            
        item_subtotal = float(menu_item.price) * item.quantity
        subtotal += item_subtotal
        
        order_items_to_create.append({
            "menu_item_id": menu_item.id,
            "quantity": item.quantity,
            "unit_price": menu_item.price,
            "subtotal": item_subtotal,
            "note": item.note,
            "status": "PENDING",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })
        
    # Generate unique order code
    order_code = generate_order_code()
    while db.query(Order).filter(Order.order_code == order_code).first():
        order_code = generate_order_code()
        
    # Total calculation (assuming no discount/tax for now, can be added later)
    total_amount = subtotal
    
    # Create Order
    new_order = Order(
        order_code=order_code,
        user_id=current_user.id,
        table_id=table.id,
        order_type="STAFF",
        status="PENDING",
        subtotal=subtotal,
        discount=0,
        tax=0,
        total_amount=total_amount,
        note=order_data.note,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    
    # Create Order Items
    for item_data in order_items_to_create:
        order_item = OrderItem(
            order_id=new_order.id,
            **item_data
        )
        db.add(order_item)
        
    # Optional: Update table status to OCCUPIED if it was AVAILABLE
    if table.status == "AVAILABLE":
        table.status = "OCCUPIED"
        table.updated_at = datetime.utcnow()
        
    db.commit()
    db.refresh(new_order)
    
    return new_order

@router.get("/", response_model=OrderListResponse)
def get_orders(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    status: Optional[str] = None,
    order_code: Optional[str] = None,
    table_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role.name not in ["ADMIN", "STAFF"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view orders"
        )
        
    query = db.query(Order)
    
    if status:
        query = query.filter(Order.status == status)
    if order_code:
        query = query.filter(Order.order_code.ilike(f"%{order_code}%"))
    if table_id:
        query = query.filter(Order.table_id == table_id)
        
    # Staff might only see orders they created, or all orders depending on business rule.
    # For now, allow Staff to see all orders so they can manage tables.
        
    total = query.count()
    orders = query.order_by(desc(Order.created_at)).offset((page - 1) * size).limit(size).all()
    
    return {
        "items": orders,
        "total": total,
        "page": page,
        "size": size
    }

@router.get("/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role.name not in ["ADMIN", "STAFF"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view order"
        )
        
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        
    return order

@router.patch("/{order_id}/status", response_model=OrderResponse)
def update_order_status(
    order_id: int,
    status_update: OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role.name not in ["ADMIN", "STAFF"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update order status"
        )
        
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        
    # Validate status enum
    valid_statuses = ["PENDING", "CONFIRMED", "PREPARING", "READY", "SERVED", "COMPLETED", "CANCELLED"]
    if status_update.status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )
        
    order.status = status_update.status
    order.updated_at = datetime.utcnow()
    
    # Update table status if order is COMPLETED
    if status_update.status == "COMPLETED":
        table = db.query(RestaurantTable).filter(RestaurantTable.id == order.table_id).first()
        if table:
            table.status = "AVAILABLE"
            table.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(order)
    
    return order
