from __future__ import annotations

from datetime import datetime
from typing import Any

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.request import LiquidRequest
from app.models.tanker import Tanker
from app.services.request_service import create_priority_request_record


def assign_priority_tanker(db: Session, request: LiquidRequest) -> Tanker:
    """
    Assign a tanker directly to a priority request.
    This is the path you want to keep.
    """
    tanker = (
        db.query(Tanker)
        .filter(
            Tanker.is_available == True,
            Tanker.status == "available",
        )
        .first()
    )

    if not tanker:
        raise HTTPException(
            status_code=404,
            detail="No available tanker found for priority delivery",
        )

    tanker.is_available = False
    tanker.status = "assigned"
    tanker.current_request_id = request.id

    request.status = "assigned"

    db.commit()
    db.refresh(tanker)
    db.refresh(request)

    return tanker


def create_and_assign_priority_request(db: Session, data) -> dict[str, Any]:
    """
    For ASAP priority request: create request and assign tanker immediately.
    """
    request = create_priority_request_record(db, data)
    tanker = assign_priority_tanker(db, request)

    return {
        "message": "Priority request created and assigned successfully",
        "request_id": request.id,
        "tanker_id": tanker.id,
        "request_status": request.status,
        "tanker_status": tanker.status,
        "scheduled_for": request.scheduled_for.isoformat() if request.scheduled_for else None,
    }


def create_scheduled_priority_request(db: Session, data) -> dict[str, Any]:
    """
    Create a scheduled priority request without immediate tanker assignment.
    """
    request = create_priority_request_record(db, data)
    request.status = "pending"
    db.commit()
    db.refresh(request)

    return {
        "message": "Scheduled priority request created successfully",
        "request_id": request.id,
        "request_status": request.status,
        "scheduled_for": request.scheduled_for.isoformat() if request.scheduled_for else None,
    }


def activate_scheduled_priority_request(db: Session, request_id: int) -> dict[str, Any]:
    """
    Assign tanker when scheduled time arrives.
    """
    request = db.query(LiquidRequest).filter(LiquidRequest.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Priority request not found")

    if request.delivery_type != "priority":
        raise HTTPException(status_code=400, detail="Request is not priority")

    tanker = assign_priority_tanker(db, request)

    return {
        "message": "Scheduled priority request activated",
        "request_id": request.id,
        "tanker_id": tanker.id,
    }


def get_pending_scheduled_priority_requests(db: Session) -> list[LiquidRequest]:
    return db.query(LiquidRequest).filter(
        LiquidRequest.delivery_type == "priority",
        LiquidRequest.is_asap == False,
        LiquidRequest.status == "pending",
        LiquidRequest.scheduled_for <= datetime.utcnow(),
    ).all()


def release_priority_tanker(db: Session, tanker_id: int) -> Tanker:
    tanker = db.query(Tanker).filter(Tanker.id == tanker_id).first()
    if not tanker:
        raise HTTPException(status_code=404, detail="Tanker not found")

    tanker.status = "available"
    tanker.is_available = True
    tanker.current_request_id = None

    db.commit()
    db.refresh(tanker)
    return tanker


def complete_priority_request(db: Session, request_id: int, tanker_id: int) -> dict[str, Any]:
    request = db.query(LiquidRequest).filter(LiquidRequest.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Priority request not found")

    request.status = "completed"
    release_priority_tanker(db, tanker_id)

    db.commit()
    db.refresh(request)

    return {
        "message": "Priority delivery completed",
        "request_id": request.id,
        "request_status": request.status,
    }

# from app.models.batch import Batch
# from app.models.batch_member import BatchMember
# from app.models.tanker import Tanker
# from fastapi import HTTPException


# def handle_priority_request(db, request):
#     tanker = (
#         db.query(Tanker)
#         .filter(Tanker.is_available == True)
#         .filter(Tanker.status == "available")
#         .first()
#     )

#     if not tanker:
#         raise HTTPException(
#             status_code=404,
#             detail="No available tanker found for priority delivery"
#         )

#     tanker.is_available = False
#     tanker.status = "assigned"

#     batch = Batch(
#         area_name="Priority Delivery",
#         total_volume_liters=request.volume_liters,
#         tanker_id=tanker.id,
#         status="assigned",
#     )
#     db.add(batch)
#     db.commit()
#     db.refresh(batch)

#     member = BatchMember(
#         batch_id=batch.id,
#         request_id=request.id,
#         payment_status="pending",
#     )
#     db.add(member)
#     db.commit()
#     db.refresh(member)

#     return {
#         "batch": batch,
#         "member": member,
#     }