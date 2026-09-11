from sqlalchemy import Column, Enum, DateTime, ForeignKey
from sqlalchemy.dialects.mysql import BIGINT
from sqlalchemy.orm import relationship

from app.core.database import Base


class TableSession(Base):
    __tablename__ = "table_sessions"

    id = Column(BIGINT(unsigned=True), primary_key=True, autoincrement=True)
    table_id = Column(BIGINT(unsigned=True), ForeignKey("restaurant_tables.id"), nullable=False)
    reservation_id = Column(BIGINT(unsigned=True), ForeignKey("reservations.id"), nullable=False, unique=True)
    started_at = Column(DateTime, nullable=False)
    ended_at = Column(DateTime, nullable=True)
    status = Column(
        Enum("ACTIVE", "COMPLETED", "CANCELLED"),
        nullable=False,
        default="ACTIVE"
    )
    created_at = Column(DateTime)
    updated_at = Column(DateTime)

    # Relationships
    table = relationship("RestaurantTable", back_populates="table_sessions")
    reservation = relationship("Reservation", back_populates="table_session")
    orders = relationship("Order", back_populates="table_session", cascade="all, delete-orphan")
