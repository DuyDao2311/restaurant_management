from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, field_validator


class MenuItemCreate(BaseModel):
    category_id: int
    code: Optional[str] = None
    name: str
    description: Optional[str] = None
    price: Decimal
    image: Optional[str] = None
    status: str = "ACTIVE"
    is_available: bool = True

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Name must not be empty")
        return v.strip()

    @field_validator("price")
    @classmethod
    def price_non_negative(cls, v: Decimal) -> Decimal:
        if v < 0:
            raise ValueError("Price must be >= 0")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        allowed = ["ACTIVE", "INACTIVE"]
        if v not in allowed:
            raise ValueError(f"Status must be one of: {', '.join(allowed)}")
        return v


class MenuItemUpdate(BaseModel):
    category_id: Optional[int] = None
    code: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = None
    image: Optional[str] = None
    status: Optional[str] = None
    is_available: Optional[bool] = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not v.strip():
            raise ValueError("Name must not be empty")
        return v.strip() if v else v

    @field_validator("price")
    @classmethod
    def price_non_negative(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is not None and v < 0:
            raise ValueError("Price must be >= 0")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            allowed = ["ACTIVE", "INACTIVE"]
            if v not in allowed:
                raise ValueError(f"Status must be one of: {', '.join(allowed)}")
        return v


class MenuItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    category_id: int
    code: Optional[str] = None
    name: str
    description: Optional[str] = None
    price: Decimal
    image: Optional[str] = None
    status: str
    is_available: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
