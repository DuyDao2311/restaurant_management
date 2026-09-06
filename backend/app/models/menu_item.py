from sqlalchemy import Column, Integer, String, Text, Enum, DateTime, Boolean, Numeric, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class MenuItem(Base):
    __tablename__ = "menu_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Numeric(12, 2), nullable=False)
    image = Column(String(255), nullable=True)
    status = Column(
        Enum("ACTIVE", "INACTIVE"),
        nullable=False
    )
    is_available = Column(Boolean, nullable=False)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)

    # Relationships
    category = relationship("Category", back_populates="menu_items")
    order_items = relationship("OrderItem", back_populates="menu_item")
