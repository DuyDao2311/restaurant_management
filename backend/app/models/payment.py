from sqlalchemy import Column, Integer, String, Enum, DateTime, Numeric, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    payment_code = Column(String(50), unique=True, nullable=False)
    payment_method = Column(
        Enum("CASH", "BANK_TRANSFER"),
        nullable=False
    )
    amount = Column(Numeric(12, 2), nullable=False)
    status = Column(
        Enum("PENDING", "PAID", "FAILED", "REFUNDED"),
        nullable=False
    )
    transaction_code = Column(String(100), nullable=True)
    paid_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)

    # Relationships
    order = relationship("Order", back_populates="payments")
