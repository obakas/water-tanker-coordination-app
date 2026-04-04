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
from app.models.user import User
from app.services.payout_service import trigger_driver_payout


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


def get_user_by_id(db: Session, user_id: int | None) -> User | None:
    if not user_id:
        return None
    return db.query(User).filter(User.id == user_id).first()


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
        actions = []
        if not delivery.otp_verified:
            actions.append("confirm_otp")
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


def sync_linked_delivery_outcome(
    db: Session,
    *,
    delivery: DeliveryRecord,
    outcome: str,
) -> None:
    now = datetime.utcnow()

    if delivery.job_type == "batch" and delivery.member_id:
        member = get_member_by_id(db, delivery.member_id)

        if outcome == "delivered":
            member.status = "delivered"
            member.delivered_at = delivery.delivered_at or now
            member.customer_confirmed = True
            member.customer_confirmed_at = delivery.customer_confirmed_at or now
        elif outcome == "failed":
            member.status = "failed"
        elif outcome == "skipped":
            member.status = "skipped"

        db.add(member)

    if delivery.job_type == "priority" and delivery.request_id:
        request = get_request_by_id(db, delivery.request_id)

        if outcome == "delivered":
            request.status = "completed"
            request.completed_at = delivery.delivered_at or now
        elif outcome == "failed":
            request.status = "failed"
        elif outcome == "skipped":
            request.status = "failed"

        db.add(request)


def summarize_resolved_job(deliveries: list[DeliveryRecord]) -> dict[str, int]:
    statuses = [d.delivery_status for d in deliveries]
    delivered_count = sum(1 for status in statuses if status == "delivered")
    failed_count = sum(1 for status in statuses if status == "failed")
    skipped_count = sum(1 for status in statuses if status == "skipped")
    total_count = len(statuses)

    return {
        "total_count": total_count,
        "delivered_count": delivered_count,
        "failed_count": failed_count,
        "skipped_count": skipped_count,
    }


def resolve_job_outcome_status(
    *,
    delivered_count: int,
    failed_count: int,
    skipped_count: int,
    total_count: int,
) -> str:
    if total_count <= 0:
        return "pending"

    if delivered_count == total_count:
        return "completed"

    if delivered_count > 0:
        return "partially_completed"

    if failed_count + skipped_count == total_count:
        return "failed"

    return "completed"


def get_current_delivery_for_tanker(db: Session, tanker_id: int) -> dict[str, Any]:
    tanker = get_tanker_by_id(db, tanker_id)

    deliveries = (
        db.query(DeliveryRecord)
        .filter(DeliveryRecord.tanker_id == tanker.id)
        .order_by(DeliveryRecord.stop_order.asc(), DeliveryRecord.id.asc())
        .all()
    )

    active_deliveries = [
        d for d in deliveries if d.delivery_status not in RESOLVED_DELIVERY_STATUSES
    ]

    if not active_deliveries:
        return {
            "tanker": {
                "id": tanker.id,
                "driver_name": tanker.driver_name,
                "phone": tanker.phone,
                "tank_plate_number": tanker.tank_plate_number,
                "status": tanker.status,
                "is_available": tanker.is_available,
            },
            "job": None,
            "current_stop": None,
            "allowed_actions": [],
            "stops_summary": [],
            "message": "No active delivery stop found",
        }

    current = next(
        (d for d in active_deliveries if d.delivery_status in ACTIVE_PROGRESS_STATUSES),
        active_deliveries[0],
    )

    return {
        "tanker": {
            "id": tanker.id,
            "driver_name": tanker.driver_name,
            "phone": tanker.phone,
            "tank_plate_number": tanker.tank_plate_number,
            "status": tanker.status,
            "is_available": tanker.is_available,
        },
        "job": _build_job_meta(db, tanker, current, deliveries),
        "current_stop": _build_stop_details(db, current),
        "allowed_actions": resolve_allowed_actions(current),
        "stops_summary": [_build_stop_summary(db, d) for d in deliveries],
        "message": "Active delivery stop found",
    }


def _build_job_meta(
    db: Session,
    tanker: Tanker,
    current: DeliveryRecord | None,
    deliveries: list[DeliveryRecord],
) -> dict[str, Any] | None:
    if not current:
        return None

    total_stops = len(deliveries)
    completed_stops = sum(
        1 for d in deliveries if d.delivery_status in RESOLVED_DELIVERY_STATUSES
    )
    remaining_stops = total_stops - completed_stops

    if current.job_type == "batch":
        batch = get_batch_by_id(db, current.batch_id)
        return {
            "job_type": "batch",
            "job_id": batch.id,
            "job_status": batch.status,
            "total_stops": total_stops,
            "completed_stops": completed_stops,
            "remaining_stops": remaining_stops,
        }

    request = get_request_by_id(db, current.request_id)
    return {
        "job_type": "priority",
        "job_id": request.id,
        "job_status": request.status,
        "total_stops": total_stops,
        "completed_stops": completed_stops,
        "remaining_stops": remaining_stops,
    }


def _build_stop_summary(db: Session, delivery: DeliveryRecord) -> dict[str, Any]:
    user = get_user_by_id(db, delivery.user_id)

    return {
        "delivery_id": delivery.id,
        "stop_order": delivery.stop_order,
        "customer_name": user.name if user else None,
        "phone": user.phone if user else None,
        "address": user.address if user else None,
        "planned_liters": delivery.planned_liters,
        "delivery_status": delivery.delivery_status,
    }


def _build_stop_details(db: Session, delivery: DeliveryRecord) -> dict[str, Any]:
    return {
        "delivery_id": delivery.id,
        "stop_order": delivery.stop_order,
        "delivery_status": delivery.delivery_status,
        "planned_liters": delivery.planned_liters,
        "actual_liters_delivered": delivery.actual_liters_delivered,
        "meter_start_reading": delivery.meter_start_reading,
        "meter_end_reading": delivery.meter_end_reading,
        "otp_required": delivery.otp_required,
        "otp_verified": delivery.otp_verified,
        "delivery_code": delivery.delivery_code,
        "customer_confirmed": delivery.customer_confirmed,
        "customer": _build_customer_payload(db, delivery),
        "location": {
            "latitude": delivery.latitude,
            "longitude": delivery.longitude,
        },
        "timestamps": {
            "dispatched_at": delivery.dispatched_at,
            "arrived_at": delivery.arrived_at,
            "measurement_started_at": delivery.measurement_started_at,
            "measurement_completed_at": delivery.measurement_completed_at,
            "delivered_at": delivery.delivered_at,
        },
        "notes": delivery.notes,
        "failure_reason": delivery.failure_reason,
    }


def _build_customer_payload(db: Session, delivery: DeliveryRecord) -> dict[str, Any]:
    user = get_user_by_id(db, delivery.user_id)

    return {
        "user_id": delivery.user_id,
        "name": user.name if user else None,
        "phone": user.phone if user else None,
        "address": user.address if user else None,
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
    sync_linked_delivery_outcome(db, delivery=delivery, outcome="delivered")

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
    sync_linked_delivery_outcome(db, delivery=delivery, outcome="failed")

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
    sync_linked_delivery_outcome(db, delivery=delivery, outcome="skipped")

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

        summary = summarize_resolved_job(deliveries)
        batch.status = resolve_job_outcome_status(**summary)
        batch.completed_at = datetime.utcnow()

        payout_result = trigger_driver_payout(
            db,
            tanker_id=tanker.id,
            job_type="batch",
            job_id=batch.id,
            amount=60000.0,
        )

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
            "resolution_summary": summary,
            "payout": payout_result,
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

        summary = summarize_resolved_job(deliveries)
        request.status = resolve_job_outcome_status(**summary)
        if request.status in {"completed", "partially_completed"}:
            request.completed_at = datetime.utcnow()

        payout_result = trigger_driver_payout(
            db,
            tanker_id=tanker.id,
            job_type="priority",
            job_id=request.id,
            amount=55000.0,
        )

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
            "resolution_summary": summary,
            "payout": payout_result,
        }

    return None
