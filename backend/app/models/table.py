from sqlalchemy import Column, BigInteger, Integer, String, Enum, DateTime
from sqlalchemy.orm import relationship

from app.core.database import Base


class RestaurantTable(Base):
    __tablename__ = "restaurant_tables"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    table_number = Column(String(20), unique=True, nullable=False)
    capacity = Column(Integer, nullable=False)
    location = Column(String(100), nullable=True)
    status = Column(
        Enum("AVAILABLE", "RESERVED", "OCCUPIED", "MAINTENANCE"),
        nullable=True,
        server_default="AVAILABLE"
    )
    created_at = Column(DateTime)
    updated_at = Column(DateTime)

    # Relationships
    qr_codes = relationship("TableQRCode", back_populates="table", cascade="all, delete-orphan")
    reservations = relationship("Reservation", back_populates="table")
    orders = relationship("Order", back_populates="table")
