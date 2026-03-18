from sqlalchemy import Column, String, Integer, Float, ForeignKey
from app.core.database import Base
import uuid

class Batch(Base):
# class LiquidRequest(Base):
    __tablename__ = "batches"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"))
    liquid_id = Column(String, ForeignKey("liquids.id"))

    volume_liters = Column(Integer)
    latitude = Column(Float)
    longitude = Column(Float)

    status = Column(String, default="pending")