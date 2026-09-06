from sqlalchemy import Column, Integer, String, Enum, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class TableQRCode(Base):
    __tablename__ = "table_qr_codes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    table_id = Column(Integer, ForeignKey("restaurant_tables.id"), nullable=False)
    qr_token = Column(String(255), unique=True, nullable=False)
    qr_url = Column(String(500), nullable=True)
    status = Column(
        Enum("ACTIVE", "INACTIVE"),
        nullable=False
    )
    created_at = Column(DateTime)

    # Relationships
    table = relationship("RestaurantTable", back_populates="qr_codes")
