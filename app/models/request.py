from sqlalchemy import Column, Integer, Float, ForeignKey, String, DateTime, Boolean
from app.core.database import Base


class LiquidRequest(Base):
    __tablename__ = "requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    liquid_id = Column(Integer, nullable=False)

    volume_liters = Column(Integer, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    delivery_type = Column(String, nullable=False)   # batch or priority
    is_asap = Column(Boolean, default=False)         # meaningful only for priority
    scheduled_for = Column(DateTime, nullable=True)  # meaningful only for priority

    status = Column(String, default="pending")

    loading_deadline = Column(DateTime, nullable=True)
    accepted_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)