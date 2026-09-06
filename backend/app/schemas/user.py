from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, field_validator


class UserCreate(BaseModel):
    role_id: int
    full_name: str
    phone: str
    email: Optional[str] = None
    password: str  # TODO: Password hashing will be implemented in Authentication Phase.
    avatar: Optional[str] = None
    status: str = "ACTIVE"

    @field_validator("full_name")
    @classmethod
    def full_name_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Full name must not be empty")
        return v.strip()

    @field_validator("phone")
    @classmethod
    def phone_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Phone must not be empty")
        return v.strip()

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        allowed = ["ACTIVE", "INACTIVE", "BLOCKED"]
        if v not in allowed:
            raise ValueError(f"Status must be one of: {', '.join(allowed)}")
        return v


class UserUpdate(BaseModel):
    role_id: Optional[int] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None  # TODO: Password hashing will be implemented in Authentication Phase.
    avatar: Optional[str] = None
    status: Optional[str] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            allowed = ["ACTIVE", "INACTIVE", "BLOCKED"]
            if v not in allowed:
                raise ValueError(f"Status must be one of: {', '.join(allowed)}")
        return v


class UserResponse(BaseModel):
    """User response schema - password is NOT included."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    role_id: int
    full_name: str
    phone: str
    email: Optional[str] = None
    avatar: Optional[str] = None
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
