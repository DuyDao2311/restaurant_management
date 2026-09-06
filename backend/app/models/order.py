from sqlalchemy import Column, Integer, String, Text, Enum, DateTime, Numeric, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, autoincrement=True)
    order_code = Column(String(50), unique=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    table_id = Column(Integer, ForeignKey("restaurant_tables.id"), nullable=False)
    reservation_id = Column(Integer, ForeignKey("reservations.id"), nullable=True)
    order_type = Column(
        Enum("QR", "STAFF"),
        nullable=False
    )
    status = Column(
        Enum("PENDING", "CONFIRMED", "PREPARING", "READY", "SERVED", "COMPLETED", "CANCELLED"),
        nullable=False
    )
    subtotal = Column(Numeric(12, 2))
    discount = Column(Numeric(12, 2))
    tax = Column(Numeric(12, 2))
    total_amount = Column(Numeric(12, 2))
    note = Column(Text, nullable=True)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)

    # Relationships
    user = relationship("User", back_populates="orders")
    table = relationship("RestaurantTable", back_populates="orders")
    reservation = relationship("Reservation", back_populates="orders")
    order_items = relationship("OrderItem", back_populates="order")
    payments = relationship("Payment", back_populates="order")
