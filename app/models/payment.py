from sqlalchemy import Column, String, Float, ForeignKey
from app.core.database import Base
import uuid

class Payment(Base):
    __tablename__ = "payments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"))
    batch_id = Column(String, ForeignKey("batches.id"))

    amount = Column(Float)
    status = Column(String, default="pending")  # pending, paid