from sqlalchemy import Column, String, Integer, Boolean
from app.core.database import Base
import uuid

class Tanker(Base):
    __tablename__ = "tankers"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    driver_name = Column(String)
    phone = Column(String)

    capacity_liters = Column(Integer)
    liquid_id = Column(String)  # what it carries

    is_available = Column(Boolean, default=True)
    rating = Column(Integer, default=5)