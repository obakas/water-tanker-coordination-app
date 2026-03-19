from sqlalchemy import Column, Float, String, Integer, Boolean
from app.core.database import Base
import uuid

class Tanker(Base):
    __tablename__ = "tankers"

    id = Column(Integer, primary_key=True, index=True)
    driver_name = Column(String)
    phone = Column(String)
    capacity_liters = Column(Integer)
    liquid_id = Column(Integer)  # what it carries
    is_available = Column(Boolean, default=True)
    rating = Column(Integer, default=5)
    latitude = Column(Float)
    longitude = Column(Float)
    status = Column(String, default="available")  # available | busy