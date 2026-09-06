from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, field_validator


class TableCreate(BaseModel):
    table_number: str
    capacity: int
    location: Optional[str] = None
    status: str = "AVAILABLE"

    @field_validator("table_number")
    @classmethod
    def table_number_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Table number must not be empty")
        return v.strip()

    @field_validator("capacity")
    @classmethod
    def capacity_positive(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("Capacity must be greater than 0")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        allowed = ["AVAILABLE", "RESERVED", "OCCUPIED", "MAINTENANCE"]
        if v not in allowed:
            raise ValueError(f"Status must be one of: {', '.join(allowed)}")
        return v


class TableUpdate(BaseModel):
    table_number: Optional[str] = None
    capacity: Optional[int] = None
    location: Optional[str] = None
    status: Optional[str] = None

    @field_validator("table_number")
    @classmethod
    def table_number_not_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not v.strip():
            raise ValueError("Table number must not be empty")
        return v.strip() if v else v

    @field_validator("capacity")
    @classmethod
    def capacity_positive(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v <= 0:
            raise ValueError("Capacity must be greater than 0")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            allowed = ["AVAILABLE", "RESERVED", "OCCUPIED", "MAINTENANCE"]
            if v not in allowed:
                raise ValueError(f"Status must be one of: {', '.join(allowed)}")
        return v


class TableResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    table_number: str
    capacity: int
    location: Optional[str] = None
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class TableQRResponse(BaseModel):
    """QR info for a table — used by Admin/Staff to get QR management data."""
    table_id: int
    table_number: str
    qr_token: str
    qr_url: str
    status: str


class TablePublicQRResponse(BaseModel):
    """Public info returned when a customer scans a QR code. No sensitive data."""
    table_id: int
    table_number: str
    capacity: int
    location: Optional[str] = None
    status: str
