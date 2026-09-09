from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from decimal import Decimal

# Base OrderItem
class OrderItemBase(BaseModel):
    menu_item_id: int
    quantity: int
    note: Optional[str] = None

class OrderItemCreate(OrderItemBase):
    pass

class OrderItemResponse(OrderItemBase):
    id: int
    order_id: int
    unit_price: Decimal
    subtotal: Decimal
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# Base Order
class OrderBase(BaseModel):
    table_id: int
    order_type: str = "STAFF"
    note: Optional[str] = None

class OrderCreate(OrderBase):
    items: List[OrderItemCreate]

class OrderResponse(OrderBase):
    id: int
    order_code: str
    user_id: Optional[int] = None
    status: str
    subtotal: Decimal
    discount: Optional[Decimal] = None
    tax: Optional[Decimal] = None
    total_amount: Decimal
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    order_items: List[OrderItemResponse] = []

    model_config = ConfigDict(from_attributes=True)

class OrderListResponse(BaseModel):
    items: List[OrderResponse]
    total: int
    page: int
    size: int

class OrderStatusUpdate(BaseModel):
    status: str
