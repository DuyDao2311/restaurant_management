from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class StaffCallBase(BaseModel):
    table_id: int
    reason: Optional[str] = "CALL_STAFF"
    note: Optional[str] = None

class StaffCallCreate(StaffCallBase):
    pass

class StaffCallUpdate(BaseModel):
    status: str

class StaffCallResponse(StaffCallBase):
    id: int
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class StaffCallListResponse(BaseModel):
    items: list[StaffCallResponse]
    total: int
    page: int
    size: int
