from sqlalchemy import Column, BigInteger, String, Enum, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class TableQRCode(Base):
    __tablename__ = "table_qr_codes"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    table_id = Column(BigInteger, ForeignKey("restaurant_tables.id", onupdate="CASCADE", ondelete="CASCADE"), nullable=False)
    qr_token = Column(String(255), unique=True, nullable=False)
    qr_url = Column(String(500), nullable=True)
    status = Column(
        Enum("ACTIVE", "INACTIVE"),
        nullable=True,
        server_default="ACTIVE"
    )
    created_at = Column(DateTime)

    # Relationships
    table = relationship("RestaurantTable", back_populates="qr_codes")
