from sqlalchemy import Column, Integer, String, Text, Enum, DateTime, Numeric, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    menu_item_id = Column(Integer, ForeignKey("menu_items.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(12, 2), nullable=False)
    subtotal = Column(Numeric(12, 2), nullable=False)
    note = Column(Text, nullable=True)
    status = Column(
        Enum("PENDING", "CONFIRMED", "PREPARING", "READY", "SERVED", "CANCELLED"),
        nullable=False
    )
    created_at = Column(DateTime)
    updated_at = Column(DateTime)

    # Relationships
    order = relationship("Order", back_populates="order_items")
    menu_item = relationship("MenuItem", back_populates="order_items")
