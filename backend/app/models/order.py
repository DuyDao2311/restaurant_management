from sqlalchemy import Column, Integer, String, Text, Enum, DateTime, Numeric, ForeignKey
from sqlalchemy.dialects.mysql import BIGINT
from sqlalchemy.orm import relationship

from app.core.database import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(BIGINT(unsigned=True), primary_key=True, autoincrement=True)
    table_session_id = Column(BIGINT(unsigned=True), ForeignKey("table_sessions.id"), nullable=False)
    order_code = Column(String(50), unique=True, nullable=False)
    user_id = Column(BIGINT(unsigned=True), ForeignKey("users.id"), nullable=True)
    table_id = Column(BIGINT(unsigned=True), ForeignKey("restaurant_tables.id"), nullable=False)
    order_type = Column(
        Enum("QR", "STAFF"),
        nullable=False
    )
    status = Column(
        Enum("PENDING", "CONFIRMED", "PREPARING", "READY", "SERVED", "COMPLETED", "CANCELLED"),
        nullable=False
    )
    subtotal = Column(Numeric(12, 2))
    discount_amount = Column(Numeric(12, 2))
    tax = Column(Numeric(12, 2))
    total_amount = Column(Numeric(12, 2))
    note = Column(Text, nullable=True)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)

    # Relationships
    user = relationship("User", back_populates="orders")
    table = relationship("RestaurantTable", back_populates="orders")
    table_session = relationship("TableSession", back_populates="orders")
    order_items = relationship("OrderItem", back_populates="order")
    payments = relationship("Payment", back_populates="order")
