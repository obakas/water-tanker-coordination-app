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
from app.models.DeliveryRecord import DeliveryRecord
from app.models.tanker import Tanker







def get_priority_request_live_flow(db: Session, request_id: int) -> dict[str, Any]:
    request = get_request_by_id(db, request_id)

    if request.delivery_type != "priority":
        raise HTTPException(status_code=400, detail="Request is not a priority request")

    # tanker = (
    #     db.query(Tanker)
    #     .filter(Tanker.current_request_id == request.id)
    #     .first()
    # )

    delivery = (
        db.query(DeliveryRecord)
        .filter(
            DeliveryRecord.request_id == request.id,
            DeliveryRecord.job_type == "priority",
        )
        .order_by(DeliveryRecord.id.desc())
        .first()
    )

    tanker = None
    if delivery and delivery.tanker_id:
        tanker = db.query(Tanker).filter(Tanker.id == delivery.tanker_id).first()

    if not tanker:
        tanker = (
            db.query(Tanker)
            .filter(Tanker.current_request_id == request.id)
            .first()
        )

    return {
        "request_id": request.id,
        "delivery_type": request.delivery_type,
        "request_status": request.status,
        "is_asap": request.is_asap,
        "scheduled_for": request.scheduled_for.isoformat() if request.scheduled_for else None,

        "tanker_id": tanker.id if tanker else None,
        "driver_name": tanker.driver_name if tanker else None,
        "tanker_phone": tanker.phone if tanker else None,
        "tanker_status": tanker.status if tanker else None,

        "delivery_id": delivery.id if delivery else None,
        "delivery_status": delivery.delivery_status if delivery else None,
        "otp": delivery.delivery_code if delivery else None,
        "otp_verified": delivery.otp_verified if delivery else False,
        "otp_required": delivery.otp_required if delivery else True,

        "planned_liters": delivery.planned_liters if delivery else float(request.volume_liters),
        "actual_liters_delivered": delivery.actual_liters_delivered if delivery else None,

        "meter_start_reading": delivery.meter_start_reading if delivery else None,
        "meter_end_reading": delivery.meter_end_reading if delivery else None,

        "arrived_at": delivery.arrived_at.isoformat() if delivery and delivery.arrived_at else None,
        "measurement_started_at": delivery.measurement_started_at.isoformat() if delivery and delivery.measurement_started_at else None,
        "measurement_completed_at": delivery.measurement_completed_at.isoformat() if delivery and delivery.measurement_completed_at else None,
        "delivered_at": delivery.delivered_at.isoformat() if delivery and delivery.delivered_at else None,

        "customer_confirmed": delivery.customer_confirmed if delivery else False,
        "failure_reason": delivery.failure_reason if delivery else None,
        "notes": delivery.notes if delivery else None,
    }


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
    payment_result = confirm_payment(db, payment.id)

    return {
        "message": "Batch request created successfully",
        "request_id": request.id,
        "batch_id": batch.id,
        "member_id": member.id,
        "payment_id": payment.id,
        "request_status": request.status,
        "request_status": request.status,
        "batch_status": payment_result.get("batch_snapshot", {}).get("status", batch.status),
        "payment_status": payment_result.get("member_payment_status"),
        "member_status": payment_result.get("member_status"),
        "delivery_code": payment_result.get("delivery_code"),
        "batch_snapshot": payment_result.get("batch_snapshot"),
        # "batch_status": batch.status,
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