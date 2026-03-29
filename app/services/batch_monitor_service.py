# app/services/batch_monitor_service.py

from sqlalchemy.orm import Session
from app.models.batch import Batch
from app.services.batch_orchestration_service import refresh_batch_state
from app.services.batch_scoring_service import (
    should_expire_batch,
    should_widen_radius,
    is_batch_ready_for_assignment,
)
from app.services.assignment_service import assign_batch
from app.services.batch_service import recalculate_batch_volume
from app.services.routing_service import plan_batch_delivery_order


ACTIVE_BATCH_STATUSES = [
    "forming",
    "near_ready",
    "ready_for_assignment",
    "assigned",
    "loading",
    "delivering",
]

def refresh_batch_after_member_change(db: Session, batch_id: int) -> Batch:
    batch = recalculate_batch_volume(db, batch_id)

    fill_ratio = 0
    if batch.target_volume > 0:
        fill_ratio = batch.current_volume / batch.target_volume

    if batch.status in {"assigned", "loading", "delivering", "completed", "expired"}:
        return batch

    if batch.current_volume <= 0:
        batch.status = "forming"
    elif fill_ratio < 0.8:
        batch.status = "forming"
    elif fill_ratio < 1.0:
        batch.status = "near_ready"
    else:
        batch.status = "ready_for_assignment"

    db.add(batch)
    db.commit()
    db.refresh(batch)
    return batch


def get_active_batches(db: Session) -> list[Batch]:
    return (
        db.query(Batch)
        .filter(Batch.status.in_(ACTIVE_BATCH_STATUSES))
        .all()
    )


def process_single_batch(db: Session, batch: Batch) -> dict:
    result = {
        "batch_id": batch.id,
        "previous_status": batch.status,
        "new_status": batch.status,
        "expired": False,
        "radius_widened": False,
        "assigned": False,
        "delivery_plan_updated": False,
        "errors": [],
    }

    try:
        refreshed = refresh_batch_state(db, batch.id)
        batch = refreshed["batch"]

        if should_expire_batch(batch):
            batch.status = "expired"
            db.add(batch)
            db.commit()
            db.refresh(batch)

            result["new_status"] = batch.status
            result["expired"] = True
            return result

        if should_widen_radius(batch):
            # assuming you have a field like search_radius_km
            batch.search_radius_km = min((batch.search_radius_km or 1) + 1, 5)
            db.add(batch)
            db.commit()
            db.refresh(batch)
            result["radius_widened"] = True

        if batch.status == "ready_for_assignment" and is_batch_ready_for_assignment(batch):
            assignment_result = assign_batch(db, batch.id)
            if assignment_result.get("assigned"):
                result["assigned"] = True
                db.refresh(batch)

        if batch.status in ["assigned", "loading", "delivering"]:
            plan_batch_delivery_order(db, batch.id)
            result["delivery_plan_updated"] = True

        db.refresh(batch)
        result["new_status"] = batch.status

    except Exception as e:
        db.rollback()
        result["errors"].append(str(e))

    return result


def process_all_active_batches(db: Session) -> list[dict]:
    batches = get_active_batches(db)
    results = []

    for batch in batches:
        results.append(process_single_batch(db, batch))

    return results