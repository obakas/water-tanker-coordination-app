from __future__ import annotations

import random
from datetime import datetime
from typing import Any

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.batch import Batch
from app.models.batch_member import BatchMember
from app.models.DeliveryRecord import DeliveryRecord
from app.models.request import LiquidRequest
from app.models.tanker import Tanker


RESOLVED_DELIVERY_STATUSES = {"delivered", "failed", "skipped"}
ACTIVE_PROGRESS_STATUSES = {"arrived", "measuring", "awaiting_otp"}


def generate_delivery_code() -> str:
    return str(random.randint(1000, 9999))


# -----------------------------------
# Basic getters
# -----------------------------------

def get_delivery_by_id(db: Session, delivery_id: int) -> DeliveryRecord:
    delivery = db.query(DeliveryRecord).filter(DeliveryRecord.id == delivery_id).first()
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery record not found")
    return delivery


def get_tanker_by_id(db: Session, tanker_id: int) -> Tanker:
    tanker = db.query(Tanker).filter(Tanker.id == tanker_id).first()
    if not tanker:
        raise HTTPException(status_code=404, detail="Tanker not found")
    return tanker


def get_batch_by_id(db: Session, batch_id: int) -> Batch:
    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    return batch


def get_member_by_id(db: Session, member_id: int) -> BatchMember:
    member = db.query(BatchMember).filter(BatchMember.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Batch member not found")
    return member


def get_request_by_id(db: Session, request_id: int) -> LiquidRequest:
    request = db.query(LiquidRequest).filter(LiquidRequest.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    return request


# -----------------------------------
# Helpers
# -----------------------------------

def resolve_allowed_actions(delivery: DeliveryRecord) -> list[str]:
    status = delivery.delivery_status

    if status in {"pending", "en_route"}:
        return ["arrive"]

    if status == "arrived":
        return ["start_measurement"]

    if status == "measuring":
        return ["finish_measurement"]

    if status == "awaiting_otp":
        actions = ["confirm_otp"]
        if delivery.otp_verified:
            actions.append("complete")
        return actions

    return []


def assert_tanker_owns_delivery(tanker_id: int, delivery: DeliveryRecord) -> None:
    if delivery.tanker_id != tanker_id:
        raise HTTPException(
            status_code=403,
            detail="This tanker is not allowed to operate on this delivery record",
        )


def get_current_delivery_for_tanker(db: Session, tanker_id: int) -> dict[str, Any]:
    tanker = get_tanker_by_id(db, tanker_id)

    deliveries = (
        db.query(DeliveryRecord)
        .filter(
            DeliveryRecord.tanker_id == tanker.id,
            DeliveryRecord.delivery_status.notin_(list(RESOLVED_DELIVERY_STATUSES)),
        )
        .order_by(DeliveryRecord.stop_order.asc(), DeliveryRecord.id.asc())
        .all()
    )

    if not deliveries:
        return {
            "tanker_id": tanker.id,
            "current_delivery": None,
            "remaining_stops": 0,
            "allowed_actions": [],
            "message": "No active delivery stop found",
        }

    # Prefer a delivery already in progress
    current = next(
        (d for d in deliveries if d.delivery_status in ACTIVE_PROGRESS_STATUSES),
        deliveries[0],
    )

    return {
        "tanker_id": tanker.id,
        "current_delivery": current,
        "remaining_stops": len(deliveries),
        "allowed_actions": resolve_allowed_actions(current),
    }


# -----------------------------------
# Creation / provisioning
# -----------------------------------

def create_delivery_records_for_batch(
    db: Session,
    *,
    batch_id: int,
    tanker_id: int,
) -> list[DeliveryRecord]:
    """
    Create one delivery record per active + paid batch member.

    Safe against duplicates:
    if records already exist for this batch, return them.
    """
    batch = get_batch_by_id(db, batch_id)
    tanker = get_tanker_by_id(db, tanker_id)

    if batch.tanker_id != tanker.id:
        raise HTTPException(
            status_code=400,
            detail="Batch is not assigned to this tanker",
        )

    existing = (
        db.query(DeliveryRecord)
        .filter(DeliveryRecord.batch_id == batch.id)
        .order_by(DeliveryRecord.stop_order.asc(), DeliveryRecord.id.asc())
        .all()
    )
    if existing:
        return existing

    members = (
        db.query(BatchMember)
        .filter(
            BatchMember.batch_id == batch.id,
            BatchMember.status == "active",
            BatchMember.payment_status == "paid",
        )
        .order_by(BatchMember.id.asc())
        .all()
    )

    if not members:
        raise HTTPException(
            status_code=400,
            detail="No active paid members found for this batch",
        )

    created: list[DeliveryRecord] = []

    for idx, member in enumerate(members, start=1):
        record = DeliveryRecord(
            job_type="batch",
            batch_id=batch.id,
            member_id=member.id,
            request_id=member.request_id,
            tanker_id=tanker.id,
            user_id=member.user_id,
            stop_order=idx,
            planned_liters=float(member.volume_liters),
            delivery_status="pending",
            otp_required=True,
            otp_verified=False,
            delivery_code=member.delivery_code or generate_delivery_code(),
            latitude=member.latitude,
            longitude=member.longitude,
        )
        db.add(record)
        created.append(record)

        # keep member delivery code aligned
        if not member.delivery_code:
            member.delivery_code = record.delivery_code
            db.add(member)

    db.commit()

    for record in created:
        db.refresh(record)

    return created


def create_delivery_record_for_priority(
    db: Session,
    *,
    request_id: int,
    tanker_id: int,
) -> DeliveryRecord:
    """
    Create the single stop used by a priority job.
    Safe against duplicates.
    """
    request = get_request_by_id(db, request_id)
    tanker = get_tanker_by_id(db, tanker_id)

    if tanker.current_request_id != request.id:
        raise HTTPException(
            status_code=400,
            detail="This tanker is not assigned to the priority request",
        )

    existing = (
        db.query(DeliveryRecord)
        .filter(
            DeliveryRecord.request_id == request.id,
            DeliveryRecord.job_type == "priority",
        )
        .first()
    )
    if existing:
        return existing

    record = DeliveryRecord(
        job_type="priority",
        batch_id=None,
        member_id=None,
        request_id=request.id,
        tanker_id=tanker.id,
        user_id=request.user_id,
        stop_order=1,
        planned_liters=float(request.volume_liters),
        delivery_status="pending",
        otp_required=True,
        otp_verified=False,
        delivery_code=generate_delivery_code(),
        latitude=request.latitude,
        longitude=request.longitude,
    )

    db.add(record)
    db.commit()
    db.refresh(record)
    return record


# -----------------------------------
# Stop execution actions
# -----------------------------------

def arrive_delivery_stop(
    db: Session,
    *,
    tanker_id: int,
    delivery_id: int,
) -> DeliveryRecord:
    delivery = get_delivery_by_id(db, delivery_id)
    assert_tanker_owns_delivery(tanker_id, delivery)

    if delivery.delivery_status not in {"pending", "en_route"}:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot arrive delivery from status '{delivery.delivery_status}'",
        )

    delivery.delivery_status = "arrived"
    delivery.arrived_at = datetime.utcnow()

    db.add(delivery)
    db.commit()
    db.refresh(delivery)
    return delivery


def start_measurement(
    db: Session,
    *,
    tanker_id: int,
    delivery_id: int,
    meter_start_reading: float,
) -> DeliveryRecord:
    delivery = get_delivery_by_id(db, delivery_id)
    assert_tanker_owns_delivery(tanker_id, delivery)

    if delivery.delivery_status != "arrived":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot start measurement from status '{delivery.delivery_status}'",
        )

    delivery.delivery_status = "measuring"
    delivery.meter_start_reading = meter_start_reading
    delivery.measurement_started_at = datetime.utcnow()

    db.add(delivery)
    db.commit()
    db.refresh(delivery)
    return delivery


def finish_measurement(
    db: Session,
    *,
    tanker_id: int,
    delivery_id: int,
    meter_end_reading: float,
    notes: str | None = None,
) -> DeliveryRecord:
    delivery = get_delivery_by_id(db, delivery_id)
    assert_tanker_owns_delivery(tanker_id, delivery)

    if delivery.delivery_status != "measuring":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot finish measurement from status '{delivery.delivery_status}'",
        )

    if delivery.meter_start_reading is None:
        raise HTTPException(
            status_code=400,
            detail="Meter start reading is missing",
        )

    if meter_end_reading < delivery.meter_start_reading:
        raise HTTPException(
            status_code=400,
            detail="Meter end reading cannot be less than meter start reading",
        )

    delivery.meter_end_reading = meter_end_reading
    delivery.actual_liters_delivered = (
        delivery.meter_end_reading - delivery.meter_start_reading
    )
    delivery.measurement_completed_at = datetime.utcnow()
    delivery.delivery_status = "awaiting_otp"
    delivery.notes = notes

    db.add(delivery)
    db.commit()
    db.refresh(delivery)
    return delivery


def confirm_delivery_otp(
    db: Session,
    *,
    tanker_id: int,
    delivery_id: int,
    otp_code: str,
) -> DeliveryRecord:
    delivery = get_delivery_by_id(db, delivery_id)
    assert_tanker_owns_delivery(tanker_id, delivery)

    if delivery.delivery_status != "awaiting_otp":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot confirm OTP from status '{delivery.delivery_status}'",
        )

    if delivery.meter_start_reading is None or delivery.meter_end_reading is None:
        raise HTTPException(
            status_code=400,
            detail="Measurement must be completed before OTP confirmation",
        )

    expected_code = str(delivery.delivery_code or "").strip()
    provided_code = str(otp_code or "").strip()

    if not expected_code:
        raise HTTPException(
            status_code=400,
            detail="No delivery OTP exists for this stop",
        )

    if provided_code != expected_code:
        raise HTTPException(status_code=400, detail="Invalid OTP code")

    delivery.otp_verified = True
    delivery.otp_verified_at = datetime.utcnow()
    delivery.customer_confirmed = True
    delivery.customer_confirmed_at = datetime.utcnow()

    db.add(delivery)
    db.commit()
    db.refresh(delivery)
    return delivery


def complete_delivery_stop(
    db: Session,
    *,
    tanker_id: int,
    delivery_id: int,
    auto_finalize_job: bool = True,
) -> dict[str, Any]:
    delivery = get_delivery_by_id(db, delivery_id)
    assert_tanker_owns_delivery(tanker_id, delivery)

    if delivery.delivery_status != "awaiting_otp":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot complete delivery from status '{delivery.delivery_status}'",
        )

    if delivery.otp_required and not delivery.otp_verified:
        raise HTTPException(
            status_code=400,
            detail="OTP must be verified before completing this stop",
        )

    if delivery.meter_start_reading is None or delivery.meter_end_reading is None:
        raise HTTPException(
            status_code=400,
            detail="Measurement must be completed before delivery completion",
        )

    delivery.delivery_status = "delivered"
    delivery.delivered_at = datetime.utcnow()

    db.add(delivery)

    # Sync linked batch member
    if delivery.job_type == "batch" and delivery.member_id:
        member = get_member_by_id(db, delivery.member_id)
        member.status = "delivered"
        member.delivered_at = delivery.delivered_at
        member.customer_confirmed = True
        member.customer_confirmed_at = delivery.customer_confirmed_at or datetime.utcnow()
        db.add(member)

    # Sync linked priority request
    if delivery.job_type == "priority" and delivery.request_id:
        request = get_request_by_id(db, delivery.request_id)
        request.status = "completed"
        db.add(request)

    db.commit()
    db.refresh(delivery)

    finalize_result = None
    if auto_finalize_job:
        finalize_result = finalize_job_if_all_stops_resolved(db, delivery)

    return {
        "message": "Delivery stop completed successfully",
        "delivery": delivery,
        "finalize_result": finalize_result,
    }


def fail_delivery_stop(
    db: Session,
    *,
    tanker_id: int,
    delivery_id: int,
    reason: str,
) -> dict[str, Any]:
    delivery = get_delivery_by_id(db, delivery_id)
    assert_tanker_owns_delivery(tanker_id, delivery)

    if delivery.delivery_status in RESOLVED_DELIVERY_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Delivery is already resolved with status '{delivery.delivery_status}'",
        )

    delivery.delivery_status = "failed"
    delivery.failure_reason = reason
    delivery.notes = reason

    db.add(delivery)
    db.commit()
    db.refresh(delivery)

    finalize_result = finalize_job_if_all_stops_resolved(db, delivery)

    return {
        "message": "Delivery stop marked as failed",
        "delivery": delivery,
        "finalize_result": finalize_result,
    }


def skip_delivery_stop(
    db: Session,
    *,
    tanker_id: int,
    delivery_id: int,
    reason: str,
) -> dict[str, Any]:
    delivery = get_delivery_by_id(db, delivery_id)
    assert_tanker_owns_delivery(tanker_id, delivery)

    if delivery.delivery_status in RESOLVED_DELIVERY_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Delivery is already resolved with status '{delivery.delivery_status}'",
        )

    delivery.delivery_status = "skipped"
    delivery.failure_reason = reason
    delivery.notes = reason

    db.add(delivery)
    db.commit()
    db.refresh(delivery)

    finalize_result = finalize_job_if_all_stops_resolved(db, delivery)

    return {
        "message": "Delivery stop skipped",
        "delivery": delivery,
        "finalize_result": finalize_result,
    }


# -----------------------------------
# Job finalization
# -----------------------------------

def finalize_job_if_all_stops_resolved(
    db: Session,
    delivery: DeliveryRecord,
) -> dict[str, Any] | None:
    """
    If all delivery records for the job are resolved, close the job and release tanker.
    """
    tanker = get_tanker_by_id(db, delivery.tanker_id)

    if delivery.job_type == "batch":
        if not delivery.batch_id:
            return None

        batch = get_batch_by_id(db, delivery.batch_id)

        deliveries = (
            db.query(DeliveryRecord)
            .filter(DeliveryRecord.batch_id == batch.id)
            .all()
        )

        if not deliveries:
            return None

        unresolved = [
            d for d in deliveries
            if d.delivery_status not in RESOLVED_DELIVERY_STATUSES
        ]

        if unresolved:
            return {
                "job_type": "batch",
                "job_completed": False,
                "remaining_unresolved_stops": len(unresolved),
            }

        batch.status = "completed"
        batch.completed_at = datetime.utcnow()

        tanker.status = "available"
        tanker.is_available = True
        tanker.current_request_id = None

        db.add(batch)
        db.add(tanker)
        db.commit()
        db.refresh(batch)
        db.refresh(tanker)

        return {
            "job_type": "batch",
            "job_completed": True,
            "batch_id": batch.id,
            "batch_status": batch.status,
            "tanker_status": tanker.status,
        }

    if delivery.job_type == "priority":
        if not delivery.request_id:
            return None

        request = get_request_by_id(db, delivery.request_id)

        deliveries = (
            db.query(DeliveryRecord)
            .filter(
                DeliveryRecord.request_id == request.id,
                DeliveryRecord.job_type == "priority",
            )
            .all()
        )

        unresolved = [
            d for d in deliveries
            if d.delivery_status not in RESOLVED_DELIVERY_STATUSES
        ]

        if unresolved:
            return {
                "job_type": "priority",
                "job_completed": False,
                "remaining_unresolved_stops": len(unresolved),
            }

        request.status = "completed"

        tanker.status = "available"
        tanker.is_available = True
        tanker.current_request_id = None

        db.add(request)
        db.add(tanker)
        db.commit()
        db.refresh(request)
        db.refresh(tanker)

        return {
            "job_type": "priority",
            "job_completed": True,
            "request_id": request.id,
            "request_status": request.status,
            "tanker_status": tanker.status,
        }

    return None