# app/services/late_arrival_service.py

from __future__ import annotations

from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.models.batch import Batch
from app.models.request import LiquidRequest
from app.services.time_policy import LATE_ARRIVAL_ALERT_MINUTES


def flag_late_arrivals(db: Session) -> list[dict]:
    now = datetime.utcnow()
    threshold = now - timedelta(minutes=LATE_ARRIVAL_ALERT_MINUTES)

    results: list[dict] = []

    late_batches = (
        db.query(Batch)
        .filter(
            Batch.status == "delivering",
            Batch.delivering_started_at.isnot(None),
            Batch.delivering_started_at < threshold,
        )
        .all()
    )

    late_priorities = (
        db.query(LiquidRequest)
        .filter(
            LiquidRequest.delivery_type == "priority",
            LiquidRequest.status == "delivering",
            LiquidRequest.delivering_started_at.isnot(None),
            LiquidRequest.delivering_started_at < threshold,
        )
        .all()
    )

    for batch in late_batches:
        results.append({
            "job_type": "batch",
            "job_id": batch.id,
            "status": batch.status,
            "alert": "late_arrival",
            "delivering_started_at": batch.delivering_started_at.isoformat(),
        })

    for request in late_priorities:
        results.append({
            "job_type": "priority",
            "job_id": request.id,
            "status": request.status,
            "alert": "late_arrival",
            "delivering_started_at": request.delivering_started_at.isoformat(),
        })

    return results