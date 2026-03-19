from sqlalchemy import Column, String, Integer, Float, ForeignKey
from app.core.database import Base
import uuid

class Batch(Base):
# class LiquidRequest(Base):
    __tablename__ = "batches"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    liquid_id = Column(Integer)

    current_volume = Column(Float, default=0)
    target_volume = Column(Float, default=10000)

    volume_liters = Column(Integer)
    latitude = Column(Float)
    longitude = Column(Float)

    status = Column(String, default="forming")