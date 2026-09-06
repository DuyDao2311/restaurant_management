from sqlalchemy import Column, Integer, String, Text, Enum, DateTime
from sqlalchemy.orm import relationship

from app.core.database import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    image = Column(String(255), nullable=True)
    status = Column(
        Enum("ACTIVE", "INACTIVE"),
        nullable=False
    )
    created_at = Column(DateTime)
    updated_at = Column(DateTime)

    # Relationships
    menu_items = relationship("MenuItem", back_populates="category")
