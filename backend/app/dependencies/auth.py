from fastapi import Depends, status
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User
from app.models.role import Role

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/swagger-login")


# ---------- Get Current User ----------

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Decode JWT token and return the current user."""
    payload = decode_access_token(token)
    if payload is None:
        raise _unauthorized("Invalid or expired token")

    user_id = payload.get("user_id")
    if user_id is None:
        raise _unauthorized("Invalid token payload")

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise _unauthorized("User not found")

    if user.status != "ACTIVE":
        raise _forbidden("Your account is inactive or blocked")

    return user


# ---------- Role Dependencies ----------

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Only ADMIN can access."""
    role_name = _get_role_name(current_user)
    if role_name != "ADMIN":
        raise _forbidden("Admin access required")
    return current_user


def require_staff(current_user: User = Depends(get_current_user)) -> User:
    """Only STAFF can access."""
    role_name = _get_role_name(current_user)
    if role_name != "STAFF":
        raise _forbidden("Staff access required")
    return current_user


def require_admin_or_staff(current_user: User = Depends(get_current_user)) -> User:
    """ADMIN or STAFF can access."""
    role_name = _get_role_name(current_user)
    if role_name not in ("ADMIN", "STAFF"):
        raise _forbidden("Admin or Staff access required")
    return current_user


# ---------- Helpers ----------

def _get_role_name(user: User) -> str:
    """Get the role name from a user's relationship."""
    if user.role and hasattr(user.role, "name"):
        return user.role.name
    return ""


def _unauthorized(message: str):
    """Create an HTTPException for 401."""
    from fastapi import HTTPException
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail={"success": False, "message": message},
        headers={"WWW-Authenticate": "Bearer"},
    )


def _forbidden(message: str):
    """Create an HTTPException for 403."""
    from fastapi import HTTPException
    return HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail={"success": False, "message": message},
    )
