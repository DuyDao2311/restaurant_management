from sqlalchemy import Column, Integer, String, Enum, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    full_name = Column(String(100), nullable=False)
    phone = Column(String(20), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=True)
    password = Column(String(255), nullable=False)
    avatar = Column(String(255), nullable=True)
    status = Column(
        Enum("ACTIVE", "INACTIVE", "BLOCKED"),
        nullable=False
    )
    created_at = Column(DateTime)
    updated_at = Column(DateTime)

    # Relationships
    role = relationship("Role", back_populates="users")
    reservations = relationship("Reservation", back_populates="user")
    orders = relationship("Order", back_populates="user")
    notifications = relationship("Notification", back_populates="user")
