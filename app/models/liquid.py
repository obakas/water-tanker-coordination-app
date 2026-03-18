from sqlalchemy import Column, String, Boolean
from app.core.database import Base
import uuid

class Liquid(Base):
    __tablename__ = "liquids"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String)  # water, diesel
    is_hazardous = Column(Boolean, default=False)