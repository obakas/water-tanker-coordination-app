from sqlalchemy import Column, String, Integer, Float, ForeignKey, DateTime
from app.core.database import Base


class LiquidRequest(Base):
    __tablename__ = "requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    liquid_id = Column(Integer, nullable=False)

    volume_liters = Column(Integer, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    delivery_type = Column(String, nullable=False)   # "batch" or "priority"
    scheduled_time = Column(String, nullable=True)   # keep as string for now
    status = Column(String, default="pending", nullable=False)