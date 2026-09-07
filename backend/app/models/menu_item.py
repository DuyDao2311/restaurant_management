from sqlalchemy import Column, BigInteger, String, Text, Enum, DateTime, Boolean, Numeric, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class MenuItem(Base):
    __tablename__ = "menu_items"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    category_id = Column(BigInteger, ForeignKey("categories.id"), nullable=False)
    code = Column(String(50), nullable=True, unique=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Numeric(12, 2), nullable=False)
    image = Column(String(500), nullable=True)
    status = Column(
        Enum("ACTIVE", "INACTIVE"),
        nullable=True,
        server_default="ACTIVE"
    )
    is_available = Column(Boolean, nullable=False)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)

    # Relationships
    category = relationship("Category", back_populates="menu_items")
    order_items = relationship("OrderItem", back_populates="menu_item")
