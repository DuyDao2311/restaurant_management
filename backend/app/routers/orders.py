from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
import random
import string
from datetime import datetime
from decimal import Decimal

from app.core.database import get_db
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.menu_item import MenuItem
from app.models.table import RestaurantTable
from app.models.table_session import TableSession
from app.models.user import User
from app.schemas.order import OrderCreate, OrderResponse, OrderListResponse, OrderStatusUpdate
from app.dependencies.auth import get_current_user, require_admin_or_staff

router = APIRouter()

def generate_order_code() -> str:
    now_str = datetime.now().strftime("%Y%m%d")
    random_str = ''.join(random.choices(string.digits, k=4))
    return f"ORD-{now_str}-{random_str}"

@router.post("/staff/orders", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    order_data: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_staff)
):
    if not order_data.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order must contain at least one item"
        )
    
    # 1-3. Check TableSession with lock
    table_session = db.query(TableSession).with_for_update().filter(TableSession.id == order_data.table_session_id).first()
    if not table_session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="TableSession không tồn tại")
        
    if table_session.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"TableSession đang ở trạng thái {table_session.status}, không thể tạo Order"
        )
        
    # 4-5. Check Table
    table = db.query(RestaurantTable).filter(RestaurantTable.id == table_session.table_id).first()
    if not table or table.status != "OCCUPIED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bàn không ở trạng thái OCCUPIED"
        )
        
    subtotal = Decimal('0.0')
    order_items_to_create = []
    
    # Process items (Merge same menu_item_id if desired, but we will just validate each as per request)
    item_dict = {}
    for item in order_data.items:
        if item.quantity < 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Quantity phải lớn hơn 0"
            )
            
        if item.menu_item_id in item_dict:
            item_dict[item.menu_item_id]['quantity'] += item.quantity
            if item.note:
                item_dict[item.menu_item_id]['note'] = (item_dict[item.menu_item_id]['note'] or '') + " | " + item.note
        else:
            item_dict[item.menu_item_id] = {
                'quantity': item.quantity,
                'note': item.note
            }
            
    for menu_item_id, item_data in item_dict.items():
        menu_item = db.query(MenuItem).filter(MenuItem.id == menu_item_id).first()
        if not menu_item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Menu item {menu_item_id} không tồn tại"
            )
        if not menu_item.is_available:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Menu item {menu_item.name} đã ngừng bán"
            )
            
        item_subtotal = Decimal(str(menu_item.price)) * item_data['quantity']
        subtotal += item_subtotal
        
        order_items_to_create.append({
            "menu_item_id": menu_item.id,
            "quantity": item_data['quantity'],
            "unit_price": menu_item.price,
            "subtotal": item_subtotal,
            "note": item_data['note'],
            "status": "PENDING",
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        })
        
    # Generate unique order code
    order_code = generate_order_code()
    while db.query(Order).filter(Order.order_code == order_code).first():
        order_code = generate_order_code()
        
    discount_amount = Decimal('0.0')
    total_amount = subtotal - discount_amount
    
    # Create Order
    new_order = Order(
        order_code=order_code,
        user_id=current_user.id,
        table_session_id=table_session.id,
        table_id=table.id,
        order_type="STAFF",
        status="PENDING",
        subtotal=subtotal,
        discount_amount=discount_amount,
        tax=0,
        total_amount=total_amount,
        note=order_data.note,
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    
    db.add(new_order)
    db.flush() # Get ID
    
    # Create Order Items
    for item_data in order_items_to_create:
        order_item = OrderItem(
            order_id=new_order.id,
            **item_data
        )
        db.add(order_item)
        
    db.commit()
    db.refresh(new_order)
    
    return new_order

@router.get("/staff/orders", response_model=OrderListResponse)
def get_orders(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    status_filter: Optional[str] = Query(None, alias="status"),
    order_code: Optional[str] = None,
    table_session_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_staff)
):
    query = db.query(Order)
    
    if status_filter:
        query = query.filter(Order.status == status_filter)
    if order_code:
        query = query.filter(Order.order_code.ilike(f"%{order_code}%"))
    if table_session_id:
        query = query.filter(Order.table_session_id == table_session_id)
        
    total = query.count()
    orders = query.order_by(desc(Order.created_at)).offset((page - 1) * size).limit(size).all()
    
    return {
        "items": orders,
        "total": total,
        "page": page,
        "size": size
    }

@router.get("/staff/orders/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_staff)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order không tồn tại")
    return order

@router.patch("/staff/orders/{order_id}/status", response_model=OrderResponse)
def update_order_status(
    order_id: int,
    status_update: OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_staff)
):
    order = db.query(Order).with_for_update().filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order không tồn tại")
        
    valid_transitions = {
        "PENDING": ["CONFIRMED", "CANCELLED"],
        "CONFIRMED": ["PREPARING", "CANCELLED"],
        "PREPARING": ["READY", "CANCELLED"],
        "READY": ["SERVED"],
        "SERVED": ["COMPLETED"],
        "COMPLETED": [],
        "CANCELLED": []
    }
    
    current_status = order.status
    new_status = status_update.status
    
    if new_status not in valid_transitions.get(current_status, []):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Không thể chuyển status từ {current_status} sang {new_status}"
        )
        
    order.status = new_status
    order.updated_at = datetime.now()
    
    # Optional: Update all order_items status
    if new_status in ["CANCELLED", "SERVED"]:
        for item in order.order_items:
            item.status = new_status
            item.updated_at = datetime.now()

    db.commit()
    db.refresh(order)
    
    return order

@router.post("/staff/orders/{order_id}/cancel", response_model=OrderResponse)
def cancel_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_staff)
):
    order = db.query(Order).with_for_update().filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order không tồn tại")
        
    if order.status not in ["PENDING", "CONFIRMED", "PREPARING"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Không thể Cancel Order ở trạng thái {order.status}"
        )
        
    order.status = "CANCELLED"
    order.updated_at = datetime.now()
    
    for item in order.order_items:
        item.status = "CANCELLED"
        item.updated_at = datetime.now()
        
    db.commit()
    db.refresh(order)
    
    return order
