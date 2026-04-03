from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.batch import Batch
from app.models.batch_member import BatchMember
from app.models.request import LiquidRequest
from app.models.tanker import Tanker
from app.schemas.tanker import TankerCreate, TankerOut, TankerUpdate
from app.utils.status_rules import (
    ensure_valid_transition,
    TANKER_STATUS_TRANSITIONS,
    BATCH_STATUS_TRANSITIONS,
)

router = APIRouter(prefix="/tankers", tags=["Tankers"])


def get_tanker_or_404(db: Session, tanker_id: int) -> Tanker:
    tanker = db.query(Tanker).filter(Tanker.id == tanker_id).first()
    if not tanker:
        raise HTTPException(status_code=404, detail="Tanker not found")
    return tanker


def get_batch_or_404(db: Session, batch_id: int) -> Batch:
    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    return batch


def validate_transition_or_400(
    current_status: str,
    next_status: str,
    transitions: dict[str, set[str]],
    entity_name: str,
) -> None:
    try:
        ensure_valid_transition(current_status, next_status, transitions, entity_name)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/", response_model=TankerOut)
def create_tanker(payload: TankerCreate, db: Session = Depends(get_db)):
    normalized_plate = payload.tank_plate_number.upper().strip()

    existing = (
        db.query(Tanker)
        .filter(Tanker.tank_plate_number == normalized_plate)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Tank plate number already exists")

    tanker = Tanker(
        driver_name=payload.driver_name,
        phone=payload.phone,
        tank_plate_number=normalized_plate,
        status="available",
        is_available=True,
        current_request_id=None,
    )

    db.add(tanker)
    db.commit()
    db.refresh(tanker)
    return tanker


@router.get("/", response_model=list[TankerOut])
def list_tankers(db: Session = Depends(get_db)):
    return db.query(Tanker).all()


@router.get("/{tanker_id}", response_model=TankerOut)
def get_tanker(tanker_id: int, db: Session = Depends(get_db)):
    return get_tanker_or_404(db, tanker_id)


@router.put("/{tanker_id}", response_model=TankerOut)
def update_tanker(
    tanker_id: int,
    payload: TankerUpdate,
    db: Session = Depends(get_db),
):
    tanker = get_tanker_or_404(db, tanker_id)
    updates = payload.dict(exclude_unset=True)

    # Do not allow free-form status changes here.
    if "status" in updates:
        raise HTTPException(
            status_code=400,
            detail="Status cannot be updated from this endpoint. Use action routes instead.",
        )

    # Normalize plate number if provided
    if "tank_plate_number" in updates and updates["tank_plate_number"]:
        normalized_plate = updates["tank_plate_number"].upper().strip()

        existing = (
            db.query(Tanker)
            .filter(
                Tanker.tank_plate_number == normalized_plate,
                Tanker.id != tanker.id,
            )
            .first()
        )
        if existing:
            raise HTTPException(status_code=400, detail="Tank plate number already exists")

        updates["tank_plate_number"] = normalized_plate

    for key, value in updates.items():
        setattr(tanker, key, value)

    db.commit()
    db.refresh(tanker)
    return tanker


@router.get("/{tanker_id}/current-job")
def get_current_job(tanker_id: int, db: Session = Depends(get_db)):
    tanker = get_tanker_or_404(db, tanker_id)

    # Active priority request
    if tanker.current_request_id:
        request = (
            db.query(LiquidRequest)
            .filter(LiquidRequest.id == tanker.current_request_id)
            .first()
        )

        if request:
            return {
                "job_type": "priority",
                "tanker": {
                    "id": tanker.id,
                    "driver_name": tanker.driver_name,
                    "phone": tanker.phone,
                    "tank_plate_number": tanker.tank_plate_number,
                    "status": tanker.status,
                    "is_available": tanker.is_available,
                    "current_request_id": tanker.current_request_id,
                },
                "job": {
                    "id": request.id,
                    "user_id": request.user_id,
                    "liquid_id": request.liquid_id,
                    "volume_liters": request.volume_liters,
                    "latitude": request.latitude,
                    "longitude": request.longitude,
                    "delivery_type": request.delivery_type,
                    "is_asap": request.is_asap,
                    "scheduled_for": request.scheduled_for,
                    "status": request.status,
                },
                "members": [],
            }

    # Active batch job
    batch = (
        db.query(Batch)
        .filter(
            Batch.tanker_id == tanker.id,
            Batch.status.in_(["assigned", "loading", "delivering", "arrived"]),
        )
        .first()
    )

    if batch:
        members = db.query(BatchMember).filter(BatchMember.batch_id == batch.id).all()

        return {
            "job_type": "batch",
            "tanker": {
                "id": tanker.id,
                "driver_name": tanker.driver_name,
                "phone": tanker.phone,
                "tank_plate_number": tanker.tank_plate_number,
                "status": tanker.status,
                "is_available": tanker.is_available,
                "current_request_id": tanker.current_request_id,
            },
            "job": {
                "id": batch.id,
                "user_id": batch.user_id,
                "liquid_id": batch.liquid_id,
                "current_volume": batch.current_volume,
                "target_volume": batch.target_volume,
                "volume_liters": batch.volume_liters,
                "latitude": batch.latitude,
                "longitude": batch.longitude,
                "status": batch.status,
                "base_price": batch.base_price,
                "tanker_id": batch.tanker_id,
                "loading_deadline": batch.loading_deadline,
                "delivering_started_at": batch.delivering_started_at,
                "completed_at": batch.completed_at,
            },
            "members": [
                {
                    "id": member.id,
                    "batch_id": member.batch_id,
                    "request_id": member.request_id,
                    "user_id": member.user_id,
                    "volume_liters": member.volume_liters,
                    "requested_volume": member.requested_volume,
                    "status": member.status,
                    "payment_status": member.payment_status,
                    "joined_at": member.joined_at,
                    "payment_deadline": member.payment_deadline,
                    "latitude": member.latitude,
                    "longitude": member.longitude,
                    "delivered_at": member.delivered_at,
                    "customer_confirmed": member.customer_confirmed,
                    "customer_confirmed_at": member.customer_confirmed_at,
                    "delivery_code": member.delivery_code,
                }
                for member in members
            ],
        }

    return {
        "job_type": None,
        "tanker": {
            "id": tanker.id,
            "driver_name": tanker.driver_name,
            "phone": tanker.phone,
            "tank_plate_number": tanker.tank_plate_number,
            "status": tanker.status,
            "is_available": tanker.is_available,
            "current_request_id": tanker.current_request_id,
        },
        "job": None,
        "members": [],
    }


@router.post("/{tanker_id}/accept/{batch_id}")
def accept_batch(tanker_id: int, batch_id: int, db: Session = Depends(get_db)):
    tanker = get_tanker_or_404(db, tanker_id)
    batch = get_batch_or_404(db, batch_id)

    if batch.tanker_id != tanker.id:
        raise HTTPException(
            status_code=403,
            detail="This tanker is not assigned to the batch",
        )

    validate_transition_or_400(
        batch.status,
        "loading",
        BATCH_STATUS_TRANSITIONS,
        "Batch",
    )
    validate_transition_or_400(
        tanker.status,
        "loading",
        TANKER_STATUS_TRANSITIONS,
        "Tanker",
    )

    batch.status = "loading"
    tanker.status = "loading"
    tanker.is_available = False

    db.commit()
    db.refresh(batch)
    db.refresh(tanker)

    return {
        "message": "Tanker accepted job. Start loading water.",
        "tanker_id": tanker.id,
        "batch_id": batch.id,
        "tanker_status": tanker.status,
        "batch_status": batch.status,
    }


@router.post("/{tanker_id}/loaded/{batch_id}")
def tanker_loaded(tanker_id: int, batch_id: int, db: Session = Depends(get_db)):
    tanker = get_tanker_or_404(db, tanker_id)
    batch = get_batch_or_404(db, batch_id)

    if batch.tanker_id != tanker.id:
        raise HTTPException(
            status_code=403,
            detail="This tanker is not assigned to the batch",
        )

    validate_transition_or_400(
        batch.status,
        "delivering",
        BATCH_STATUS_TRANSITIONS,
        "Batch",
    )
    validate_transition_or_400(
        tanker.status,
        "delivering",
        TANKER_STATUS_TRANSITIONS,
        "Tanker",
    )

    batch.status = "delivering"
    batch.delivering_started_at = datetime.utcnow()
    tanker.status = "delivering"
    tanker.is_available = False

    db.commit()
    db.refresh(batch)
    db.refresh(tanker)

    return {
        "message": "Tanker is now delivering",
        "tanker_id": tanker.id,
        "batch_id": batch.id,
        "tanker_status": tanker.status,
        "batch_status": batch.status,
        "delivering_started_at": batch.delivering_started_at,
    }


@router.post("/{tanker_id}/arrived/{batch_id}")
def tanker_arrived(tanker_id: int, batch_id: int, db: Session = Depends(get_db)):
    tanker = get_tanker_or_404(db, tanker_id)
    batch = get_batch_or_404(db, batch_id)

    if batch.tanker_id != tanker.id:
        raise HTTPException(
            status_code=403,
            detail="This tanker is not assigned to the batch",
        )

    validate_transition_or_400(
        batch.status,
        "arrived",
        BATCH_STATUS_TRANSITIONS,
        "Batch",
    )
    validate_transition_or_400(
        tanker.status,
        "arrived",
        TANKER_STATUS_TRANSITIONS,
        "Tanker",
    )

    batch.status = "arrived"
    tanker.status = "arrived"
    tanker.is_available = False

    db.commit()
    db.refresh(batch)
    db.refresh(tanker)

    return {
        "message": "Tanker has arrived at the delivery area",
        "tanker_id": tanker.id,
        "batch_id": batch.id,
        "tanker_status": tanker.status,
        "batch_status": batch.status,
    }


@router.post("/{tanker_id}/complete/{batch_id}")
def complete_batch_delivery(
    tanker_id: int,
    batch_id: int,
    db: Session = Depends(get_db),
):
    tanker = get_tanker_or_404(db, tanker_id)
    batch = get_batch_or_404(db, batch_id)

    if batch.tanker_id != tanker.id:
        raise HTTPException(
            status_code=403,
            detail="This tanker is not assigned to the batch",
        )

    # First move into completed legally
    validate_transition_or_400(
        batch.status,
        "completed",
        BATCH_STATUS_TRANSITIONS,
        "Batch",
    )
    validate_transition_or_400(
        tanker.status,
        "completed",
        TANKER_STATUS_TRANSITIONS,
        "Tanker",
    )

    members = db.query(BatchMember).filter(BatchMember.batch_id == batch.id).all()

    # for member in members:
    #     if member.status == "confirmed":
    #         member.status = "delivered"
    # LEGACY ROUTE:
# Delivery execution is now managed through DeliveryRecord stop completion.
# This route should not be used by the driver frontend.
    for member in members:
        if member.status == "active" and member.payment_status == "paid":
            member.status = "delivered"
            member.delivered_at = datetime.utcnow()
            member.customer_confirmed = True
            member.customer_confirmed_at = datetime.utcnow()

    batch.status = "completed"
    batch.completed_at = datetime.utcnow()
    tanker.status = "completed"
    tanker.is_available = False

    db.commit()
    db.refresh(batch)
    db.refresh(tanker)

    # Then immediately reset tanker back to available for next job
    validate_transition_or_400(
        tanker.status,
        "available",
        TANKER_STATUS_TRANSITIONS,
        "Tanker",
    )

    tanker.status = "available"
    tanker.is_available = True
    tanker.current_request_id = None

    db.commit()
    db.refresh(tanker)

    return {
        "message": "Batch delivery completed successfully",
        "tanker_id": tanker.id,
        "batch_id": batch.id,
        "tanker_status": tanker.status,
        "batch_status": batch.status,
        "completed_at": batch.completed_at,
    }


@router.post("/{tanker_id}/complete-priority")
def complete_priority_delivery(tanker_id: int, db: Session = Depends(get_db)):
    tanker = get_tanker_or_404(db, tanker_id)

    if not tanker.current_request_id:
        raise HTTPException(
            status_code=400,
            detail="This tanker has no active priority request",
        )

    request = (
        db.query(LiquidRequest)
        .filter(LiquidRequest.id == tanker.current_request_id)
        .first()
    )

    if not request:
        raise HTTPException(
            status_code=404,
            detail="Active priority request not found",
        )

    validate_transition_or_400(
        tanker.status,
        "completed",
        TANKER_STATUS_TRANSITIONS,
        "Tanker",
    )

    request.status = "completed"
    tanker.status = "completed"
    tanker.is_available = False

    db.commit()
    db.refresh(tanker)

    validate_transition_or_400(
        tanker.status,
        "available",
        TANKER_STATUS_TRANSITIONS,
        "Tanker",
    )

    tanker.current_request_id = None
    tanker.status = "available"
    tanker.is_available = True

    db.commit()
    db.refresh(tanker)

    return {
        "message": "Priority delivery completed successfully",
        "tanker_id": tanker.id,
        "request_id": request.id,
        "tanker_status": tanker.status,
        "request_status": request.status,
    }


@router.post("/{tanker_id}/reset")
def reset_tanker(tanker_id: int, db: Session = Depends(get_db)):
    """
    Manual/admin reset route.
    Useful if a delivery is aborted or something gets stuck.
    """
    tanker = get_tanker_or_404(db, tanker_id)

    validate_transition_or_400(
        tanker.status,
        "available",
        TANKER_STATUS_TRANSITIONS,
        "Tanker",
    )

    tanker.status = "available"
    tanker.is_available = True
    tanker.current_request_id = None

    db.commit()
    db.refresh(tanker)

    return {
        "message": "Tanker reset successfully",
        "tanker_id": tanker.id,
        "tanker_status": tanker.status,
    }

@router.post("/{tanker_id}/pause")
def pause_tanker(tanker_id: int, minutes: int = 10, db: Session = Depends(get_db)):
    tanker = db.query(Tanker).filter(Tanker.id == tanker_id).first()
    if not tanker:
        raise HTTPException(status_code=404, detail="Tanker not found")

    tanker.paused_until = datetime.utcnow() + timedelta(minutes=minutes)
    db.commit()

    return {
        "message": f"Tanker paused for {minutes} minutes",
        "paused_until": tanker.paused_until,
    }


@router.post("/{tanker_id}/resume")
def resume_tanker(tanker_id: int, db: Session = Depends(get_db)):
    tanker = db.query(Tanker).filter(Tanker.id == tanker_id).first()
    if not tanker:
        raise HTTPException(status_code=404, detail="Tanker not found")

    tanker.paused_until = None
    db.commit()

    return {"message": "Tanker resumed and available for assignment"}