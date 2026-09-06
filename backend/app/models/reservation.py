from sqlalchemy import Column, Integer, String, Text, Enum, DateTime, Date, Time, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class Reservation(Base):
    __tablename__ = "reservations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    table_id = Column(Integer, ForeignKey("restaurant_tables.id"), nullable=False)
    reservation_code = Column(String(50), unique=True, nullable=False)
    reservation_date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    number_of_guests = Column(Integer, nullable=False)
    customer_name = Column(String(100), nullable=False)
    customer_phone = Column(String(20), nullable=False)
    note = Column(Text, nullable=True)
    status = Column(
        Enum("PENDING", "CONFIRMED", "CHECKED_IN", "CANCELLED", "COMPLETED", "NO_SHOW"),
        nullable=False
    )
    created_at = Column(DateTime)
    updated_at = Column(DateTime)

    # Relationships
    user = relationship("User", back_populates="reservations")
    table = relationship("RestaurantTable", back_populates="reservations")
    orders = relationship("Order", back_populates="reservation")
