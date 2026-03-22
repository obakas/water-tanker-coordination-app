from datetime import datetime, timedelta

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.request import LiquidRequest
from app.models.tanker import Tanker
from app.schemas.request import RequestCreate


ASAP_BUFFER_MINUTES = 90


def resolve_priority_scheduled_for(data: RequestCreate) -> datetime:
    if data.is_asap:
        return datetime.now() + timedelta(minutes=ASAP_BUFFER_MINUTES)

    if data.scheduled_for is None:
        raise HTTPException(
            status_code=400,
            detail="scheduled_for is required for scheduled priority delivery"
        )

    return data.scheduled_for


def handle_priority_request(data: RequestCreate, db: Session):
    tanker = (
        db.query(Tanker)
        .filter(
            Tanker.is_available == True,
            Tanker.status == "available"
        )
        .first()
    )

    if not tanker:
        raise HTTPException(
            status_code=404,
            detail="No available tanker found for priority delivery"
        )

    final_scheduled_for = resolve_priority_scheduled_for(data)

    new_request = LiquidRequest(
        user_id=data.user_id,
        liquid_id=data.liquid_id,
        volume_liters=data.volume_liters,
        latitude=data.latitude,
        longitude=data.longitude,
        delivery_type="priority",
        is_asap=data.is_asap,
        scheduled_for=final_scheduled_for,
        status="assigned",
    )

    db.add(new_request)
    db.flush()

    tanker.is_available = False
    tanker.status = "assigned"
    tanker.current_request_id = new_request.id

    db.commit()
    db.refresh(new_request)

    return {
        "message": "Priority request created successfully",
        "request_id": new_request.id,
        "tanker_id": tanker.id,
        "request_status": new_request.status,
        "tanker_status": tanker.status,
        "delivery_type": new_request.delivery_type,
        "is_asap": new_request.is_asap,
        "scheduled_for": new_request.scheduled_for.isoformat(),
    }


def handle_batch_request(data: RequestCreate, db: Session):
    new_request = LiquidRequest(
        user_id=data.user_id,
        liquid_id=data.liquid_id,
        volume_liters=data.volume_liters,
        latitude=data.latitude,
        longitude=data.longitude,
        delivery_type="batch",
        is_asap=False,
        scheduled_for=None,
        status="pending",
    )

    db.add(new_request)
    db.commit()
    db.refresh(new_request)

    return {
        "message": "Batch request created successfully",
        "request_id": new_request.id,
        "request_status": new_request.status,
        "delivery_type": new_request.delivery_type,
    }


def create_request(data: RequestCreate, db: Session):
    if data.delivery_type == "priority":
        return handle_priority_request(data, db)

    return handle_batch_request(data, db)