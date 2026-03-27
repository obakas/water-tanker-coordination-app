# app/services/batch_orchestration_service.py

from __future__ import annotations

from typing import Any, Optional

from sqlalchemy.orm import Session

from app.models.batch import Batch
from app.models.batch_member import BatchMember
from app.services.batch_scoring_service import (
    calculate_batch_health_score,
    get_batch_dispatch_priority,
    is_batch_near_ready,
    is_batch_ready_for_assignment,
    should_expire_batch,
    should_widen_radius,
)
from app.services.batch_service import (
    get_batch_by_id,
    get_batch_members,
    update_batch_status,
    update_batch_current_volume,
)
from app.services.assignment_service import assign_batch
from app.services.routing_service import plan_batch_delivery_order


def build_batch_state_snapshot(batch: Batch, members: list[BatchMember]) -> dict[str, Any]:
    score = calculate_batch_health_score(batch, members)

    return {
        "batch_id": batch.id,
        "status": getattr(batch, "status", None),
        "current_volume": getattr(batch, "current_volume", None),
        "target_volume": getattr(batch, "target_volume", None),
        "health_score": score.health_score,
        "fill_ratio": score.fill_ratio,
        "payment_ratio": score.payment_ratio,
        "geo_compactness": score.geo_compactness,
        "wait_urgency": score.wait_urgency,
        "paid_members_count": score.paid_members_count,
        "total_members_count": score.total_members_count,
        "dispatch_priority": get_batch_dispatch_priority(batch, members),
        "should_widen_radius": should_widen_radius(batch, members),
        "is_near_ready": is_batch_near_ready(batch, members),
        "is_ready_for_assignment": is_batch_ready_for_assignment(batch, members),
        "should_expire": should_expire_batch(batch, members),
    }


def determine_next_batch_status(batch: Batch, members: list[BatchMember]) -> str:
    """
    Recommended status ladder:
    - forming
    - near_ready
    - ready_for_assignment
    - assigned
    - loading
    - delivering
    - completed
    - expired

    This function only decides early/mid lifecycle statuses.
    It should not override downstream operational statuses like delivering/completed.
    """
    current_status = str(getattr(batch, "status", "forming") or "forming").lower()

    # Don't disturb terminal/operational statuses from delivery flow.
    protected_statuses = {"assigned", "loading", "delivering", "completed", "expired", "cancelled"}
    if current_status in protected_statuses:
        return current_status

    if should_expire_batch(batch, members):
        return "expired"

    if is_batch_ready_for_assignment(batch, members):
        return "ready_for_assignment"

    if is_batch_near_ready(batch, members):
        return "near_ready"

    return "forming"


# def refresh_batch_state(db: Session, batch_id: int) -> dict[str, Any]:
#     batch = get_batch_by_id(db, batch_id)
#     if not batch:
#         raise ValueError(f"Batch {batch_id} not found")

#     members = get_batch_members(db, batch_id)

#     # Keep volume synced before scoring
#     update_batch_current_volume(db, batch)
#     db.refresh(batch)

#     members = get_batch_members(db, batch_id)
#     next_status = determine_next_batch_status(batch, members)

#     if getattr(batch, "status", None) != next_status:
#         update_batch_status(db, batch, next_status)
#         db.refresh(batch)

#     members = get_batch_members(db, batch_id)
#     return build_batch_state_snapshot(batch, members)

def refresh_batch_state(db: Session, batch_id: int) -> dict:
    batch = get_batch_by_id(db, batch_id)
    if not batch:
        raise ValueError(f"Batch {batch_id} not found")

    update_batch_current_volume(db, batch.id)

    health = calculate_batch_health_score(db, batch.id)

    if should_expire_batch(batch):
        batch.status = "expired"
    elif is_batch_ready_for_assignment(batch):
        batch.status = "ready_for_assignment"
    elif is_batch_near_ready(batch):
        batch.status = "near_ready"
    else:
        batch.status = "forming"

    db.add(batch)
    db.commit()
    db.refresh(batch)

    return {
        "batch": batch,
        "health": health,
    }


def handle_batch_member_join(
    db: Session,
    batch_id: int,
) -> dict[str, Any]:
    """
    Call this after a member has been added into a batch.
    """
    return refresh_batch_state(db, batch_id)


def handle_batch_payment_confirmed(
    db: Session,
    batch_id: int,
) -> dict[str, Any]:
    """
    Call this after a batch member payment succeeds.
    This is the most important trigger in the batch flow.
    """
    snapshot = refresh_batch_state(db, batch_id)

    if snapshot["status"] == "ready_for_assignment":
        assignment_result = maybe_assign_tanker_to_batch(db, batch_id)
        snapshot["assignment"] = assignment_result

    return snapshot


def maybe_assign_tanker_to_batch(db: Session, batch_id: int) -> dict[str, Any]:
    batch = get_batch_by_id(db, batch_id)
    if not batch:
        raise ValueError(f"Batch {batch_id} not found")

    members = get_batch_members(db, batch_id)
    if not is_batch_ready_for_assignment(batch, members):
        return {
            "assigned": False,
            "reason": "Batch is not ready for assignment",
            "batch_id": batch_id,
        }

    current_status = str(getattr(batch, "status", "") or "").lower()
    if current_status in {"assigned", "loading", "delivering", "completed"}:
        return {
            "assigned": False,
            "reason": f"Batch already in operational status '{current_status}'",
            "batch_id": batch_id,
        }

    result = assign_batch(db=db, batch=batch, members=members)

    # Expecting assignment_service.assign_batch() to return something like:
    # {
    #   "assigned": True/False,
    #   "tanker_id": ...,
    #   "batch_id": ...,
    #   "reason": ...
    # }
    if result.get("assigned"):
        update_batch_status(db, batch, "assigned")
        db.refresh(batch)

    return result


def prepare_batch_for_delivery(db: Session, batch_id: int) -> dict[str, Any]:
    """
    Builds an ordered stop plan once the batch has a tanker and is about to deliver.
    """
    batch = get_batch_by_id(db, batch_id)
    if not batch:
        raise ValueError(f"Batch {batch_id} not found")

    members = get_batch_members(db, batch_id)
    ordered_stops = plan_batch_delivery_order(batch=batch, members=members)

    return {
        "batch_id": batch_id,
        "delivery_plan": ordered_stops,
        "stop_count": len(ordered_stops),
    }


def handle_stale_batch(db: Session, batch_id: int) -> dict[str, Any]:
    """
    This can be called by admin tools, scheduled jobs, or manual refresh logic.
    """
    batch = get_batch_by_id(db, batch_id)
    if not batch:
        raise ValueError(f"Batch {batch_id} not found")

    members = get_batch_members(db, batch_id)

    if should_expire_batch(batch, members):
        update_batch_status(db, batch, "expired")
        db.refresh(batch)

        return {
            "batch_id": batch_id,
            "expired": True,
            "status": batch.status,
            "reason": "Batch expired due to age and weak formation",
        }

    return {
        "batch_id": batch_id,
        "expired": False,
        "status": getattr(batch, "status", None),
        "reason": "Batch did not meet expiration rule",
    }