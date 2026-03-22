from sqlalchemy import Column, Float, ForeignKey, String, Integer, Boolean
from app.core.database import Base


class Tanker(Base):
    __tablename__ = "tankers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    driver_name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    office_address = Column(String, nullable=True)

    tank_plate_number = Column(String, nullable=False, unique=True)
    brand = Column(String, nullable=True)
    model = Column(String, nullable=True)

    capacity_liters = Column(Integer, nullable=False)
    liquid_id = Column(Integer, nullable=False)

    is_available = Column(Boolean, default=True)
    rating = Column(Integer, default=5)

    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    status = Column(String, default="available")  # available | busy