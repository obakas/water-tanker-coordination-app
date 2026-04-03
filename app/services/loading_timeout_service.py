from __future__ import annotations

from datetime import datetime
from sqlalchemy.orm import Session

from app.models.batch import Batch
from app.models.request import LiquidRequest
from app.models.tanker import Tanker
from app.models.job_offer import JobOffer


def expire_overdue_loading_jobs(db: Session) -> dict:
    now = datetime.utcnow()

    expired_batches = (
        db.query(Batch)
        .filter(
            Batch.status == "loading",
            Batch.loading_deadline.isnot(None),
            Batch.loading_deadline < now,
        )
        .all()
    )

    expired_requests = (
        db.query(LiquidRequest)
        .filter(
            LiquidRequest.status == "loading",
            LiquidRequest.loading_deadline.isnot(None),
            LiquidRequest.loading_deadline < now,
        )
        .all()
    )

    batch_count = 0
    request_count = 0

    for batch in expired_batches:
        tanker = db.query(Tanker).filter(Tanker.id == batch.tanker_id).first()

        batch.status = "ready_for_assignment"
        batch.tanker_id = None
        batch.loading_deadline = None

        if tanker:
            tanker.status = "available"
            tanker.is_available = True

        batch_count += 1

    for request in expired_requests:
        tanker = (
            db.query(Tanker)
            .filter(Tanker.current_request_id == request.id)
            .first()
        )

        request.status = "searching_driver"
        request.loading_deadline = None

        if tanker:
            tanker.current_request_id = None
            tanker.status = "available"
            tanker.is_available = True

        request_count += 1

    db.commit()

    return {
        "expired_batch_loading_jobs": batch_count,
        "expired_priority_loading_jobs": request_count,
    }