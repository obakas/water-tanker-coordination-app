from sqlalchemy import Column, String, Integer, ForeignKey
from app.core.database import Base
import uuid

class BatchMember(Base):
    __tablename__ = "batch_members"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    batch_id = Column(String, ForeignKey("batches.id"))
    request_id = Column(String, ForeignKey("requests.id"))
    user_id = Column(String, ForeignKey("users.id"))
    volume_liters = Column(Integer)