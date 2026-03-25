from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any, Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.batch import Batch
from app.models.batch_member import BatchMember
from app.models.request import LiquidRequest
from app.models.tanker import Tanker
from app.services.batch_service import (
    get_batch_by_id,
    mark_batch_arrived,
    mark_batch_assigned,
    mark_batch_completed,
    mark_batch_delivering,
    mark_batch_loading,
)
from app.services.routing_service import (
    find_closest_tanker_to_batch,
    sort_members_by_distance_from_tanker,
)

LOADING_WINDOW_MINUTES = 45


def get_tanker_by_id(db: Session, tanker_id: int) -> Tanker:
    tanker = db.query(Tanker).filter(Tanker.id == tanker_id).first()
    if not tanker:
        raise HTTPException(status_code=404, detail="Tanker not found")
    return tanker


def get_available_tankers(db: Session, liquid_id: int | None = None) -> list[Tanker]:
    query = db.query(Tanker).filter(Tanker.status == "available", Tanker.is_available == True)

    if liquid_id is not None:
        query = query.filter(Tanker.liquid_id == liquid_id)

    return query.all()


def find_closest_available_tanker(
    db: Session,
    latitude: float,
    longitude: float,
    liquid_id: int | None = None,
) -> Tanker:
    tankers = get_available_tankers(db, liquid_id=liquid_id)
    if not tankers:
        raise HTTPException(status_code=404, detail="No available tankers found")

    # Reuse routing helper against a dummy batch-like target
    class Target:
        pass

    target = Target()
    target.latitude = latitude
    target.longitude = longitude

    tanker = find_closest_tanker_to_batch(tankers, target)
    if not tanker:
        raise HTTPException(status_code=404, detail="No suitable tanker found")

    return tanker


def assign_tanker_to_batch(db: Session, batch_id: int) -> dict[str, Any]:
    batch = get_batch_by_id(db, batch_id)

    if batch.status not in ["ready", "partial"]:
        raise HTTPException(status_code=400, detail="Batch is not ready for assignment")

    if batch.tanker_id is not None:
        raise HTTPException(status_code=400, detail="Batch already has a tanker assigned")

    tankers = get_available_tankers(db, liquid_id=batch.liquid_id)
    if not tankers:
        raise HTTPException(status_code=404, detail="No available tankers")

    tanker = find_closest_tanker_to_batch(tankers, batch)

    batch.tanker_id = tanker.id
    batch.status = "assigned"
    batch.loading_deadline = datetime.utcnow() + timedelta(minutes=LOADING_WINDOW_MINUTES)

    tanker.status = "assigned"
    tanker.is_available = False

    db.commit()
    db.refresh(batch)
    db.refresh(tanker)

    return {
        "message": "Tanker assigned successfully",
        "batch_id": batch.id,
        "tanker_id": tanker.id,
        "batch_status": batch.status,
        "tanker_status": tanker.status,
        "loading_deadline": batch.loading_deadline,
    }


def assign_tanker_to_priority_request(db: Session, request_id: int) -> dict[str, Any]:
    request = db.query(LiquidRequest).filter(LiquidRequest.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Priority request not found")

    tanker = find_closest_available_tanker(
        db,
        latitude=request.latitude,
        longitude=request.longitude,
        liquid_id=request.liquid_id,
    )

    tanker.status = "assigned"
    tanker.is_available = False
    tanker.current_request_id = request.id
    request.status = "assigned"

    db.commit()
    db.refresh(tanker)
    db.refresh(request)

    return {
        "message": "Priority tanker assigned",
        "request_id": request.id,
        "tanker_id": tanker.id,
    }


def get_current_job(db: Session, tanker_id: int) -> dict[str, Any]:
    tanker = get_tanker_by_id(db, tanker_id)

    batch = db.query(Batch).filter(Batch.tanker_id == tanker.id, Batch.status != "completed").first()
    if batch:
        return {
            "job_type": "batch",
            "batch_id": batch.id,
            "status": batch.status,
        }

    if tanker.current_request_id:
        request = db.query(LiquidRequest).filter(LiquidRequest.id == tanker.current_request_id).first()
        if request and request.status != "completed":
            return {
                "job_type": "priority",
                "request_id": request.id,
                "status": request.status,
            }

    return {"job_type": None, "message": "No current job assigned"}


def accept_batch_job(db: Session, tanker_id: int, batch_id: int) -> dict[str, Any]:
    tanker = get_tanker_by_id(db, tanker_id)
    batch = get_batch_by_id(db, batch_id)

    if batch.tanker_id != tanker.id:
        raise HTTPException(status_code=403, detail="This batch is not assigned to this tanker")

    tanker.status = "assigned"
    batch.status = "assigned"

    db.commit()
    return {"message": "Batch job accepted", "batch_id": batch.id, "tanker_id": tanker.id}


def mark_loading(db: Session, tanker_id: int, batch_id: int) -> dict[str, Any]:
    tanker = get_tanker_by_id(db, tanker_id)
    batch = get_batch_by_id(db, batch_id)

    if batch.tanker_id != tanker.id:
        raise HTTPException(status_code=403, detail="Unauthorized tanker for batch")

    tanker.status = "loading"
    mark_batch_loading(db, batch_id)

    db.commit()
    db.refresh(tanker)

    return {"message": "Tanker is loading", "tanker_status": tanker.status, "batch_status": batch.status}


def mark_loaded_and_departed(db: Session, tanker_id: int, batch_id: int) -> dict[str, Any]:
    tanker = get_tanker_by_id(db, tanker_id)
    batch = get_batch_by_id(db, batch_id)

    if batch.tanker_id != tanker.id:
        raise HTTPException(status_code=403, detail="Unauthorized tanker for batch")

    tanker.status = "delivering"
    mark_batch_delivering(db, batch_id)

    db.commit()
    db.refresh(tanker)

    return {"message": "Tanker departed for delivery", "tanker_status": tanker.status}


def mark_arrived(db: Session, tanker_id: int, batch_id: int) -> dict[str, Any]:
    tanker = get_tanker_by_id(db, tanker_id)
    batch = get_batch_by_id(db, batch_id)

    if batch.tanker_id != tanker.id:
        raise HTTPException(status_code=403, detail="Unauthorized tanker for batch")

    tanker.status = "arrived"
    mark_batch_arrived(db, batch_id)

    db.commit()
    db.refresh(tanker)

    return {"message": "Tanker arrived", "tanker_status": tanker.status}


def mark_tanker_available(db: Session, tanker_id: int) -> Tanker:
    tanker = get_tanker_by_id(db, tanker_id)
    tanker.status = "available"
    tanker.is_available = True
    tanker.current_request_id = None
    db.commit()
    db.refresh(tanker)
    return tanker


def release_tanker(db: Session, tanker_id: int) -> Tanker:
    return mark_tanker_available(db, tanker_id)


def complete_batch_delivery(db: Session, tanker_id: int, batch_id: int) -> dict[str, Any]:
    tanker = get_tanker_by_id(db, tanker_id)
    batch = get_batch_by_id(db, batch_id)

    if batch.tanker_id != tanker.id:
        raise HTTPException(status_code=403, detail="Unauthorized tanker for batch")

    members = db.query(BatchMember).filter(
        BatchMember.batch_id == batch.id,
        BatchMember.status == "confirmed",
    ).all()

    for member in members:
        member.status = "delivered"

    mark_batch_completed(db, batch.id)
    tanker_payment = pay_tanker_internal(db, tanker.id)
    release_tanker(db, tanker.id)

    return {
        "message": "Batch delivery completed",
        "batch_id": batch.id,
        "tanker_payment": tanker_payment,
    }


def complete_priority_delivery(db: Session, tanker_id: int, request_id: int) -> dict[str, Any]:
    tanker = get_tanker_by_id(db, tanker_id)

    request = db.query(LiquidRequest).filter(LiquidRequest.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Priority request not found")

    if tanker.current_request_id != request.id:
        raise HTTPException(status_code=403, detail="This priority request is not assigned to this tanker")

    request.status = "completed"
    db.commit()

    release_tanker(db, tanker.id)

    return {
        "message": "Priority delivery completed",
        "request_id": request.id,
    }


def pay_tanker_internal(db: Session, tanker_id: int) -> dict[str, Any]:
    tanker = get_tanker_by_id(db, tanker_id)

    delivered_members = db.query(BatchMember).filter(
        BatchMember.status == "delivered",
        BatchMember.batch.has(tanker_id=tanker_id),
    ).all()

    total_volume = sum(m.volume_liters for m in delivered_members)
    rate_per_liter = 1.5
    payment_amount = total_volume * rate_per_liter

    return {
        "tanker_id": tanker.id,
        "total_volume": total_volume,
        "payment_amount": payment_amount,
        "status": "paid",
    }


def pay_tanker(db: Session, tanker_id: int) -> dict[str, Any]:
    payment = pay_tanker_internal(db, tanker_id)
    release_tanker(db, tanker_id)
    return payment

# from datetime import datetime, timedelta
# from app.models import batch
# from app.models.tanker import Tanker
# from app.models.batch import Batch
# from app.schemas import batch
# from app.models.batch_member import BatchMember
# from app.utils.location import haversine
# from sqlalchemy.orm import Session

# def assign_tanker_to_batch(db: Session, batch_id: int):
#     batch = db.query(Batch).filter(Batch.id == batch_id).first()
#     if not batch:
#         raise Exception("Batch not found")

#     if batch.status not in ["ready", "partial"]:
#         raise Exception("Batch is not ready for tanker assignment")

#     if batch.tanker_id is not None:
#         raise Exception("Batch already has a tanker assigned")

#     tankers = db.query(Tanker).filter(Tanker.status == "available").all()
#     if not tankers:
#         raise Exception("No available tankers")

#     closest_tanker = min(
#         tankers,
#         key=lambda t: haversine(t.longitude, t.latitude, batch.longitude, batch.latitude)
#         if t.longitude is not None and t.latitude is not None else float("inf")
#     )

#     batch.tanker_id = closest_tanker.id
#     batch.status = "assigned"
#     batch.loading_deadline = datetime.utcnow() + timedelta(minutes=45)

#     closest_tanker.status = "assigned"
#     closest_tanker.is_available = False

#     db.commit()
#     db.refresh(batch)
#     db.refresh(closest_tanker)

#     return {
#         "message": "Tanker assigned successfully",
#         "batch_id": batch.id,
#         "tanker_id": closest_tanker.id,
#         "batch_status": batch.status,
#         "tanker_status": closest_tanker.status,
#         "loading_deadline": batch.loading_deadline,
#     }

    

# def optimize_delivery_order(start_lon, start_lat, members):
#     """Greedy nearest-neighbor route for members starting from given coordinates."""
#     unvisited = members.copy()
#     route = []
#     current_lon, current_lat = start_lon, start_lat

#     while unvisited:
#         next_member = min(
#             unvisited,
#             key=lambda m: haversine(current_lon, current_lat, m.longitude, m.latitude)
#         )
#         route.append(next_member)
#         current_lon, current_lat = next_member.longitude, next_member.latitude
#         unvisited.remove(next_member)

#     return route


# def mark_batch_delivered(db, batch_id):
#     batch = db.query(Batch).filter(Batch.id == batch_id).first()
#     if not batch:
#         raise Exception("Batch not found")

#     batch.status = "completed"
#     members = db.query(BatchMember).filter(BatchMember.batch_id == batch.id).all()
#     for m in members:
#         if m.status == "confirmed":
#             m.status = "delivered"
#     db.commit()
#     return {"message": f"Batch {batch_id} marked as delivered"}


# def pay_tanker(db, tanker_id):
#     tanker = db.query(Tanker).filter(Tanker.id == tanker_id).first()
#     if not tanker:
#         raise Exception("Tanker not found")

#     total_delivered_volume = sum(
#         m.volume_liters for m in db.query(BatchMember)
#         .filter(BatchMember.status == "delivered", BatchMember.batch.has(tanker_id=tanker_id))
#         .all()
#     )

#     payment_amount = total_delivered_volume * 1.5  # e.g., 1.5/unit as rate
#     tanker.status = "available"  # Ready for next assignment
#     db.commit()
#     return {"tanker_id": tanker.id, "amount": payment_amount, "status": "paid"}


# def confirm_delivery(db: Session, tanker_id: int, batch_id: int):
#     # Mark all members in the batch as delivered
#     members = db.query(BatchMember).filter(
#         BatchMember.batch_id == batch_id,
#         BatchMember.status == "confirmed"
#     ).all()

#     for m in members:
#         m.status = "delivered"

#     db.commit()

#     # Automatically pay the tanker
#     pay_tanker_internal(db, tanker_id)


# def pay_tanker_internal(db: Session, tanker_id: int):
#     tanker = db.query(Tanker).filter(Tanker.id == tanker_id).first()
#     if not tanker:
#         raise Exception("Tanker not found")

#     delivered_members = db.query(BatchMember).filter(
#         BatchMember.status == "delivered",
#         BatchMember.batch.has(tanker_id=tanker_id)
#     ).all()

#     total_volume = sum(m.volume_liters for m in delivered_members)
#     rate_per_liter = 1.5  # Example rate
#     payment_amount = total_volume * rate_per_liter

#     # Mark tanker as available
#     tanker.status = "available"
#     db.commit()

#     return {
#         "tanker_id": tanker.id,
#         "total_volume": total_volume,
#         "payment_amount": payment_amount,
#         "status": "paid"
#     }


