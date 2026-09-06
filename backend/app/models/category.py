from sqlalchemy import Column, BigInteger, String, Text, Enum, DateTime
from sqlalchemy.orm import relationship

from app.core.database import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    image = Column(String(500), nullable=True)
    status = Column(
        Enum("ACTIVE", "INACTIVE"),
        nullable=True,
        server_default="ACTIVE"
    )
    created_at = Column(DateTime)
    updated_at = Column(DateTime)

    # Relationships
    menu_items = relationship("MenuItem", back_populates="category")
