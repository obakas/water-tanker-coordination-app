from __future__ import annotations

from datetime import datetime
from sqlalchemy.orm import Session

from app.models.batch import Batch
from app.models.request import LiquidRequest
from app.models.tanker import Tanker
from app.services.assignment_service import retry_batch_assignment, retry_priority_assignment


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

    batch_results = []
    request_results = []

    for batch in expired_batches:
        tanker = db.query(Tanker).filter(Tanker.id == batch.tanker_id).first()
        excluded_tanker_ids = [tanker.id] if tanker else []

        batch.status = "ready_for_assignment"
        batch.tanker_id = None
        batch.loading_deadline = None

        if tanker:
            tanker.current_request_id = None
            tanker.pending_offer_type = None
            tanker.pending_offer_id = None
            tanker.offer_expires_at = None
            tanker.status = "available"
            tanker.is_available = True
            db.add(tanker)

        db.add(batch)
        db.commit()
        db.refresh(batch)

        retry_result = retry_batch_assignment(
            db,
            batch.id,
            excluded_tanker_ids=excluded_tanker_ids,
        )
        batch_results.append({
            "batch_id": batch.id,
            "previous_tanker_id": tanker.id if tanker else None,
            "retry": retry_result,
        })

    for request in expired_requests:
        tanker = db.query(Tanker).filter(Tanker.current_request_id == request.id).first()
        excluded_tanker_ids = [tanker.id] if tanker else []

        request.status = "searching_driver"
        request.loading_deadline = None

        if tanker:
            tanker.current_request_id = None
            tanker.pending_offer_type = None
            tanker.pending_offer_id = None
            tanker.offer_expires_at = None
            tanker.status = "available"
            tanker.is_available = True
            db.add(tanker)

        db.add(request)
        db.commit()
        db.refresh(request)

        retry_result = retry_priority_assignment(
            db,
            request.id,
            excluded_tanker_ids=excluded_tanker_ids,
            failure_reason="loading_timeout",
        )
        request_results.append({
            "request_id": request.id,
            "previous_tanker_id": tanker.id if tanker else None,
            "retry": retry_result,
        })

    return {
        "expired_batch_loading_jobs": len(batch_results),
        "expired_priority_loading_jobs": len(request_results),
        "batch_results": batch_results,
        "priority_results": request_results,
    }
