from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from decimal import Decimal

class PaymentBase(BaseModel):
    payment_method: str

class PaymentConfirmRequest(BaseModel):
    payment_method: str
    transaction_code: Optional[str] = None

class PaymentResponse(BaseModel):
    id: int
    order_id: int
    order_code: Optional[str] = None
    payment_code: str
    payment_method: str
    amount: Decimal
    status: str
    transaction_code: Optional[str] = None
    paid_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class PaymentListResponse(BaseModel):
    items: List[PaymentResponse]
    total: int
    page: int
    size: int
