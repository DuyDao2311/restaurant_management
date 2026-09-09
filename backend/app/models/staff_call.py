from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.mysql import BIGINT
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base

class StaffCall(Base):
    __tablename__ = "staff_calls"

    id = Column(Integer, primary_key=True, index=True)
    table_id = Column(BIGINT(unsigned=True), ForeignKey("restaurant_tables.id"), nullable=False)
    reason = Column(String(50), nullable=False, default="CALL_STAFF")
    status = Column(String(20), nullable=False, default="PENDING")
    note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    table = relationship("RestaurantTable")
