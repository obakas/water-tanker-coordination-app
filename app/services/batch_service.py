from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.batch import Batch
from app.models.batch_member import BatchMember
from app.models.request import LiquidRequest
from app.models.tanker import Tanker
from app.services.routing_service import calculate_distance_km

RADIUS_KM = 1.0
PAYMENT_WINDOW_MINUTES = 10

def recalculate_batch_volume(db: Session, batch_id: int) -> Batch:
    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    confirmed_members = (
        db.query(BatchMember)
        .filter(
            BatchMember.batch_id == batch_id,
            # BatchMember.status == "active",
            BatchMember.status == "active",
            BatchMember.payment_status == "paid",
        )
        .all()
    )

    # batch.current_volume = sum(member.volume_liters for member in active)
    batch.current_volume = sum(member.volume_liters for member in confirmed_members)

    db.add(batch)
    db.commit()
    db.refresh(batch)
    return batch


def create_new_batch_with_request(db: Session, request: LiquidRequest) -> dict[str, Any]:
    """
    Create a new batch and reserve the first member slot.
    """
    batch = Batch(
        liquid_id=request.liquid_id,
        current_volume=0,
        latitude=request.latitude,
        longitude=request.longitude,
        status="forming",
    )

    db.add(batch)
    db.flush()

    member = reserve_member_slot(db, batch, request)

    db.commit()
    db.refresh(batch)
    db.refresh(member)

    return {"batch": batch, "member": member}


def attach_request_to_batch(db: Session, batch: Batch, request: LiquidRequest) -> dict[str, Any]:
    """
    Attach a request to an existing batch.
    """
    member = reserve_member_slot(db, batch, request)
    db.commit()
    db.refresh(member)
    return {"batch": batch, "member": member}


def reserve_member_slot(db: Session, batch: Batch, request: LiquidRequest) -> BatchMember:
    """
    Create batch member reservation pending payment.
    """
    member = BatchMember(
        batch_id=batch.id,
        request_id=request.id,
        user_id=request.user_id,
        volume_liters=request.volume_liters,
        status="pending",
        payment_status="unpaid",
        payment_deadline=datetime.utcnow() + timedelta(minutes=PAYMENT_WINDOW_MINUTES),
        latitude=request.latitude,
        longitude=request.longitude,
    )
    db.add(member)
    db.flush()
    return member


def find_or_create_batch(db: Session, request: LiquidRequest) -> dict[str, Any]:
    """
    Find a nearby forming batch within radius and capacity; otherwise create one.
    """
    batches = db.query(Batch).filter(
        Batch.liquid_id == request.liquid_id,
        Batch.status == "forming",
    ).all()

    for batch in batches:
        distance_km = calculate_distance_km(
            batch.longitude,
            batch.latitude,
            request.longitude,
            request.latitude,
        )

        if distance_km <= RADIUS_KM:
            if batch.current_volume + request.volume_liters <= batch.target_volume:
                return attach_request_to_batch(db, batch, request)

    return create_new_batch_with_request(db, request)


def get_batch_by_id(db: Session, batch_id: int) -> Batch:
    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    return batch


def get_batch_members(db: Session, batch_id: int) -> list[BatchMember]:
    return db.query(BatchMember).filter(BatchMember.batch_id == batch_id).all()


def update_batch_status(db: Session, batch: Batch, status: str) -> Batch:
    batch.status = status
    db.add(batch)
    db.commit()
    db.refresh(batch)
    return batch

def update_batch_center(db: Session, batch: Batch) -> Batch:
    """
    Recompute batch center using confirmed members only.
    """
    members = db.query(BatchMember).filter(
        BatchMember.batch_id == batch.id,
        BatchMember.status == "active",
    ).all()

    if not members:
        return batch

    avg_lat = sum(m.latitude for m in members) / len(members)
    avg_lon = sum(m.longitude for m in members) / len(members)

    batch.latitude = avg_lat
    batch.longitude = avg_lon

    db.commit()
    db.refresh(batch)
    return batch

def update_batch_current_volume(db: Session, batch_id: int):
    batch = get_batch_by_id(db, batch_id)
    if not batch:
        raise ValueError(f"Batch {batch_id} not found")

    members = get_batch_members(db, batch_id) or []

    paid_members = [
        m for m in members
        # if getattr(m, "payment_status", None) == "paid"
        # and getattr(m, "status", None) == "active"
        # and getattr(m, "status", None) == "confirmed"
        if getattr(m, "status", None) == "active"
        and getattr(m, "payment_status", None) == "paid"
        
    ]

    batch.current_volume = sum(
        float(getattr(m, "volume_liters", 0) or 0)
        for m in paid_members
    )

    db.add(batch)
    db.commit()
    db.refresh(batch)

    return batch.current_volume


def recalculate_batch_volume(db: Session, batch_id: int) -> Batch:
    """
    Set batch.current_volume from confirmed/paid members.
    """
    batch = get_batch_by_id(db, batch_id)

    members = db.query(BatchMember).filter(
        BatchMember.batch_id == batch.id,
        # BatchMember.status.in_(["confirmed", "delivered"]),
        BatchMember.status.in_(["active", "delivered"])
    ).all()

    batch.current_volume = sum(member.volume_liters for member in members)

    db.commit()
    db.refresh(batch)
    return batch


def mark_batch_ready(db: Session, batch_id: int) -> Batch:
    batch = get_batch_by_id(db, batch_id)
    batch.status = "ready"
    db.commit()
    db.refresh(batch)
    return batch


def mark_batch_assigned(db: Session, batch_id: int, tanker_id: int) -> Batch:
    batch = get_batch_by_id(db, batch_id)
    batch.status = "assigned"
    batch.tanker_id = tanker_id
    db.commit()
    db.refresh(batch)
    return batch


def mark_batch_loading(db: Session, batch_id: int) -> Batch:
    batch = get_batch_by_id(db, batch_id)
    batch.status = "loading"
    db.commit()
    db.refresh(batch)
    return batch


def mark_batch_delivering(db: Session, batch_id: int) -> Batch:
    batch = get_batch_by_id(db, batch_id)
    batch.status = "delivering"
    db.commit()
    db.refresh(batch)
    return batch


def mark_batch_arrived(db: Session, batch_id: int) -> Batch:
    batch = get_batch_by_id(db, batch_id)
    batch.status = "arrived"
    db.commit()
    db.refresh(batch)
    return batch


def mark_batch_completed(db: Session, batch_id: int) -> Batch:
    batch = get_batch_by_id(db, batch_id)
    batch.status = "completed"
    db.commit()
    db.refresh(batch)
    return batch


def cleanup_expired_members(db: Session) -> int:
    expired_members = db.query(BatchMember).filter(
        BatchMember.status == "pending",
        BatchMember.payment_deadline < datetime.utcnow(),
    ).all()

    count = 0
    for member in expired_members:
        member.status = "cancelled"
        member.payment_status = "failed"
        count += 1

    db.commit()
    return count


def cleanup_unaccepted_batches(db: Session) -> int:
    """
    If tanker did not respond before loading_deadline, release tanker and reset batch.
    """
    expired_batches = db.query(Batch).filter(
        Batch.status == "assigned",
        Batch.loading_deadline < datetime.utcnow(),
    ).all()

    count = 0
    for batch in expired_batches:
        tanker = db.query(Tanker).filter(Tanker.id == batch.tanker_id).first()

        if tanker:
            tanker.status = "available"
            tanker.is_available = True

        batch.status = "ready"
        batch.tanker_id = None
        batch.loading_deadline = None
        count += 1

    db.commit()
    return count


