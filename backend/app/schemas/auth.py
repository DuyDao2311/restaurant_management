from typing import Optional
from pydantic import BaseModel, ConfigDict, field_validator


class RegisterRequest(BaseModel):
    """Customer registration request. Role is always CUSTOMER (set by server)."""
    full_name: str
    phone: str
    email: Optional[str] = None
    password: str

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

    @field_validator("password")
    @classmethod
    def password_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Password must not be empty")
        return v


class LoginRequest(BaseModel):
    """Login by phone + password."""
    phone: str
    password: str

    @field_validator("phone")
    @classmethod
    def phone_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Phone must not be empty")
        return v.strip()


class TokenResponse(BaseModel):
    """JWT token response after login."""
    access_token: str
    token_type: str = "bearer"
    user: Optional[dict] = None


class MeResponse(BaseModel):
    """Current user info from GET /api/auth/me."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    phone: str
    email: Optional[str] = None
    role: str
    status: str
