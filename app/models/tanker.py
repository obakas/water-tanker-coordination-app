from sqlalchemy import Column, Integer, String, Boolean
from app.core.database import Base


class Tanker(Base):
    __tablename__ = "tankers"

    id = Column(Integer, primary_key=True, index=True)
    driver_name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    status = Column(String, default="available")
    is_available = Column(Boolean, default=True)
    current_request_id = Column(Integer, nullable=True)