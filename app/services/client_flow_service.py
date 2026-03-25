from __future__ import annotations

from typing import Any

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.schemas.request import RequestCreate
from app.services.batch_service import find_or_create_batch
from app.services.payment_service import confirm_payment, initiate_payment
from app.services.priority_service import (
    create_and_assign_priority_request,
    create_scheduled_priority_request,
)
from app.services.request_service import (
    create_batch_request_record,
    create_priority_request_record,
    get_request_by_id,
)


def create_client_request_flow(db: Session, data: RequestCreate) -> dict[str, Any]:
    """
    Main entry point from route layer.
    """
    if data.delivery_type == "batch":
        return create_batch_request_flow(db, data)

    if data.delivery_type == "priority":
        return create_priority_request_flow(db, data)

    raise HTTPException(status_code=400, detail="Invalid delivery type")


def create_batch_request_flow(db: Session, data: RequestCreate) -> dict[str, Any]:
    """
    1. Create request
    2. Find/create batch
    3. Create payment
    """
    request = create_batch_request_record(db, data)
    batch_result = find_or_create_batch(db, request)

    batch = batch_result["batch"]
    member = batch_result["member"]
    payment = initiate_payment(db, member.id)

    return {
        "message": "Batch request created successfully",
        "request_id": request.id,
        "batch_id": batch.id,
        "member_id": member.id,
        "payment_id": payment.id,
        "request_status": request.status,
        "batch_status": batch.status,
    }


def create_priority_request_flow(db: Session, data: RequestCreate) -> dict[str, Any]:
    """
    ASAP -> immediate assignment
    Scheduled -> save and wait
    """
    if data.is_asap:
        return create_and_assign_priority_request(db, data)

    return create_scheduled_priority_request(db, data)


def initiate_batch_member_payment_flow(db: Session, member_id: int) -> dict[str, Any]:
    payment = initiate_payment(db, member_id)
    return {
        "message": "Payment initiated",
        "payment_id": payment.id,
        "status": payment.status,
    }


def confirm_batch_member_payment_flow(db: Session, payment_id: int) -> dict[str, Any]:
    return confirm_payment(db, payment_id)


def get_client_request_status_flow(db: Session, request_id: int) -> dict[str, Any]:
    request = get_request_by_id(db, request_id)
    return {
        "request_id": request.id,
        "delivery_type": request.delivery_type,
        "status": request.status,
        "scheduled_for": request.scheduled_for.isoformat() if request.scheduled_for else None,
    }


def cancel_client_request_flow(db: Session, request_id: int) -> dict[str, Any]:
    request = get_request_by_id(db, request_id)
    request.status = "cancelled"
    db.commit()
    db.refresh(request)

    return {
        "message": "Request cancelled successfully",
        "request_id": request.id,
        "status": request.status,
    }