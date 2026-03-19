from sqlalchemy import Column, String, Integer, ForeignKey
from app.core.database import Base
import uuid

class BatchMember(Base):
    __tablename__ = "batch_members"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("batches.id"))
    request_id = Column(Integer, ForeignKey("requests.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    volume_liters = Column(Integer)