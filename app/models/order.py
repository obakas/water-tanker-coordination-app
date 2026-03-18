from sqlalchemy import Column, String, ForeignKey
from app.core.database import Base
import uuid

class Order(Base):
    __tablename__ = "orders"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    batch_id = Column(String, ForeignKey("batches.id"))
    tanker_id = Column(String, ForeignKey("tankers.id"))

    status = Column(String, default="assigned")  # assigned, in_progress, delivered