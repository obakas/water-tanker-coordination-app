from sqlalchemy import Column, String, Integer, Float, ForeignKey
from app.core.database import Base
import uuid

class LiquidRequest(Base):
    __tablename__ = "requests"
    # __table_args__ = {"extend_existing": True}
    # __tablename__ = "liquid_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    # liquid_id = Column(String, ForeignKey("liquids.id"))
    liquid_id = Column(Integer) 

    volume_liters = Column(Integer)
    latitude = Column(Float)
    longitude = Column(Float)

    status = Column(String, default="pending")