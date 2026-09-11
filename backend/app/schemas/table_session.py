from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, ConfigDict

# Minimal Reservation schema for nested response
class NestedReservation(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    customer_name: str
    guest_count: int
    customer_phone: Optional[str] = None

class TableSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    table_id: int
    reservation_id: int
    started_at: datetime
    ended_at: Optional[datetime] = None
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    reservation: Optional[NestedReservation] = None
