from datetime import datetime

from sqlalchemy import Column, DateTime, String, Integer, ForeignKey
from app.core.database import Base
# import uuid

class BatchMember(Base):
    __tablename__ = "batch_members"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("batches.id"))
    request_id = Column(Integer, ForeignKey("requests.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    volume_liters = Column(Integer)

    requested_volume = Column(Integer)  # e.g. 2000L

    status = Column(String, default="pending")
    # pending | confirmed | cancelled

    payment_status = Column(String, default="unpaid")
    # unpaid | paid | refunded

    joined_at = Column(DateTime, default=datetime.utcnow)
    payment_deadline = Column(DateTime)