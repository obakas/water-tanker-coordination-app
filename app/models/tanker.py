from sqlalchemy import Column, Integer, String, Boolean
from app.core.database import Base


class Tanker(Base):
    __tablename__ = "tankers"

    id = Column(Integer, primary_key=True, index=True)

    driver_name = Column(String, nullable=False)
    phone = Column(String, nullable=True)

    tank_plate_number = Column(String, unique=True, nullable=False)

    status = Column(String, default="available", nullable=False)
    is_available = Column(Boolean, default=True, nullable=False)

    current_request_id = Column(Integer, nullable=True)