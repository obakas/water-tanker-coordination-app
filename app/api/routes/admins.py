from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.batch import Batch
from app.models.batch_member import BatchMember
from app.models.DeliveryRecord import DeliveryRecord
from app.models.payment import Payment
from app.models.request import LiquidRequest
from app.models.tanker import Tanker
from app.models.user import User
from app.services.assignment_service import create_job_offer
from app.services.batch_service import cleanup_expired_members
from app.services.refund_service import execute_member_refund
from app.utils.status_rules import ensure_valid_transition, BATCH_STATUS_TRANSITIONS, TANKER_STATUS_TRANSITIONS

router = APIRouter(prefix="/admin", tags=["Admin"])

ACTIVE_BATCH_STATUSES = {"forming", "near_ready", "ready_for_assignment", "assigned", "loading", "delivering", "arrived"}
ACTIVE_REQUEST_STATUSES = {"pending", "searching_driver", "assignment_pending", "assigned", "loading", "delivering", "arrived"}
ACTIVE_TANKER_STATUSES = {"available", "assigned", "loading", "delivering", "arrived"}
ACTIVE_DELIVERY_STATUSES = {"pending", "en_route", "arrived", "measuring", "awaiting_otp"}


# ---------- helpers ----------

def _iso(dt: datetime | None) -> str | None:
    return dt.isoformat() if dt else None


def _safe_set_batch_status(batch: Batch, next_status: str) -> None:
    current_status = str(getattr(batch, "status", "") or "")
    if current_status != next_status:
        ensure_valid_transition(current_status, next_status, BATCH_STATUS_TRANSITIONS, "Batch")
    batch.status = next_status


def _safe_set_tanker_status(tanker: Tanker, next_status: str) -> None:
    current_status = str(getattr(tanker, "status", "") or "")
    if current_status != next_status:
        ensure_valid_transition(current_status, next_status, TANKER_STATUS_TRANSITIONS, "Tanker")
    tanker.status = next_status


def _build_batch_card(db: Session, batch: Batch) -> dict[str, Any]:
    paid_members = (
        db.query(BatchMember)
        .filter(BatchMember.batch_id == batch.id, BatchMember.payment_status == "paid")
        .count()
    )
    total_members = db.query(BatchMember).filter(BatchMember.batch_id == batch.id).count()
    deliveries_total = db.query(DeliveryRecord).filter(DeliveryRecord.batch_id == batch.id).count()
    deliveries_completed = (
        db.query(DeliveryRecord)
        .filter(DeliveryRecord.batch_id == batch.id, DeliveryRecord.delivery_status == "delivered")
        .count()
    )

    target = float(getattr(batch, "target_volume", 0) or 0)
    current = float(getattr(batch, "current_volume", 0) or 0)
    fill_percent = round((current / target) * 100, 1) if target > 0 else 0.0

    return {
        "id": batch.id,
        "status": batch.status,
        "current_volume": current,
        "target_volume": target,
        "fill_percent": fill_percent,
        "member_count": total_members,
        "paid_member_count": paid_members,
        "tanker_id": batch.tanker_id,
        "search_radius_km": float(getattr(batch, "search_radius_km", 0) or 0),
        "latitude": batch.latitude,
        "longitude": batch.longitude,
        "created_at": _iso(getattr(batch, "created_at", None)),
        "expires_at": _iso(getattr(batch, "expires_at", None)),
        "loading_deadline": _iso(getattr(batch, "loading_deadline", None)),
        "completed_at": _iso(getattr(batch, "completed_at", None)),
        "deliveries_completed": deliveries_completed,
        "deliveries_total": deliveries_total,
    }


def _build_tanker_card(db: Session, tanker: Tanker) -> dict[str, Any]:
    active_batch = (
        db.query(Batch)
        .filter(Batch.tanker_id == tanker.id, Batch.status.in_(list(ACTIVE_BATCH_STATUSES)))
        .order_by(Batch.id.desc())
        .first()
    )
    active_request = None
    if tanker.current_request_id:
        active_request = db.query(LiquidRequest).filter(LiquidRequest.id == tanker.current_request_id).first()

    return {
        "id": tanker.id,
        "driver_name": tanker.driver_name,
        "phone": tanker.phone,
        "tank_plate_number": tanker.tank_plate_number,
        "status": tanker.status,
        "is_available": tanker.is_available,
        "is_online": tanker.is_online,
        "current_request_id": tanker.current_request_id,
        "active_batch_id": active_batch.id if active_batch else None,
        "active_request_status": active_request.status if active_request else None,
        "pending_offer_type": tanker.pending_offer_type,
        "pending_offer_id": tanker.pending_offer_id,
        "offer_expires_at": _iso(tanker.offer_expires_at),
        "latitude": tanker.latitude,
        "longitude": tanker.longitude,
        "last_location_update_at": _iso(tanker.last_location_update_at),
        "paused_until": _iso(tanker.paused_until),
    }


def _build_delivery_card(db: Session, delivery: DeliveryRecord) -> dict[str, Any]:
    user = db.query(User).filter(User.id == delivery.user_id).first() if delivery.user_id else None
    return {
        "id": delivery.id,
        "job_type": delivery.job_type,
        "batch_id": delivery.batch_id,
        "member_id": delivery.member_id or delivery.batch_member_id,
        "request_id": delivery.request_id,
        "tanker_id": delivery.tanker_id,
        "user_id": delivery.user_id,
        "user_name": user.name if user else None,
        "delivery_status": delivery.delivery_status,
        "stop_order": delivery.stop_order,
        "planned_liters": float(delivery.planned_liters or 0),
        "actual_liters_delivered": float(delivery.actual_liters_delivered or 0) if delivery.actual_liters_delivered is not None else None,
        "measurement_valid": delivery.measurement_valid,
        "otp_verified": delivery.otp_verified,
        "anomaly_flagged": delivery.anomaly_flagged,
        "failure_reason": delivery.failure_reason,
        "skip_reason": delivery.skip_reason,
        "notes": delivery.notes,
        "created_at": _iso(delivery.created_at),
        "updated_at": _iso(delivery.updated_at),
        "arrived_at": _iso(delivery.arrived_at),
        "delivered_at": _iso(delivery.delivered_at),
        "failed_at": _iso(delivery.failed_at),
        "skipped_at": _iso(delivery.skipped_at),
    }


# ---------- read endpoints ----------

@router.get("/overview")
def admin_overview(db: Session = Depends(get_db)):
    batch_status_counts = {
        status: count
        for status, count in db.query(Batch.status, func.count(Batch.id)).group_by(Batch.status).all()
    }
    tanker_status_counts = {
        status: count
        for status, count in db.query(Tanker.status, func.count(Tanker.id)).group_by(Tanker.status).all()
    }
    request_status_counts = {
        status: count
        for status, count in db.query(LiquidRequest.status, func.count(LiquidRequest.id)).group_by(LiquidRequest.status).all()
    }
    delivery_status_counts = {
        status: count
        for status, count in db.query(DeliveryRecord.delivery_status, func.count(DeliveryRecord.id)).group_by(DeliveryRecord.delivery_status).all()
    }
    payment_status_counts = {
        status: count
        for status, count in db.query(Payment.status, func.count(Payment.id)).group_by(Payment.status).all()
    }

    total_payment_value = db.query(func.coalesce(func.sum(Payment.amount), 0)).scalar() or 0
    paid_payment_value = db.query(func.coalesce(func.sum(Payment.amount), 0)).filter(Payment.status == "paid").scalar() or 0

    return {
        "generated_at": _iso(datetime.utcnow()),
        "totals": {
            "users": db.query(func.count(User.id)).scalar() or 0,
            "batches": db.query(func.count(Batch.id)).scalar() or 0,
            "priority_requests": db.query(func.count(LiquidRequest.id)).filter(LiquidRequest.delivery_type == "priority").scalar() or 0,
            "tankers": db.query(func.count(Tanker.id)).scalar() or 0,
            "payments": db.query(func.count(Payment.id)).scalar() or 0,
            "delivery_records": db.query(func.count(DeliveryRecord.id)).scalar() or 0,
            "online_tankers": db.query(func.count(Tanker.id)).filter(Tanker.is_online.is_(True)).scalar() or 0,
            "available_tankers": db.query(func.count(Tanker.id)).filter(Tanker.is_available.is_(True), Tanker.status == "available").scalar() or 0,
            "active_batches": db.query(func.count(Batch.id)).filter(Batch.status.in_(list(ACTIVE_BATCH_STATUSES))).scalar() or 0,
            "active_priority_requests": db.query(func.count(LiquidRequest.id)).filter(LiquidRequest.status.in_(list(ACTIVE_REQUEST_STATUSES)), LiquidRequest.delivery_type == "priority").scalar() or 0,
            "active_deliveries": db.query(func.count(DeliveryRecord.id)).filter(DeliveryRecord.delivery_status.in_(list(ACTIVE_DELIVERY_STATUSES))).scalar() or 0,
        },
        "payment_value": {
            "total": float(total_payment_value),
            "paid": float(paid_payment_value),
        },
        "status_breakdown": {
            "batches": batch_status_counts,
            "tankers": tanker_status_counts,
            "requests": request_status_counts,
            "deliveries": delivery_status_counts,
            "payments": payment_status_counts,
        },
    }


@router.get("/live")
def admin_live(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    active_batches = (
        db.query(Batch)
        .filter(Batch.status.in_(list(ACTIVE_BATCH_STATUSES)))
        .order_by(Batch.created_at.desc(), Batch.id.desc())
        .limit(limit)
        .all()
    )
    active_tankers = (
        db.query(Tanker)
        .filter((Tanker.status.in_(list(ACTIVE_TANKER_STATUSES))) | (Tanker.pending_offer_type.is_not(None)))
        .order_by(Tanker.id.desc())
        .limit(limit)
        .all()
    )
    active_deliveries = (
        db.query(DeliveryRecord)
        .filter(DeliveryRecord.delivery_status.in_(list(ACTIVE_DELIVERY_STATUSES)))
        .order_by(DeliveryRecord.updated_at.desc(), DeliveryRecord.id.desc())
        .limit(limit)
        .all()
    )
    active_requests = (
        db.query(LiquidRequest)
        .filter(LiquidRequest.delivery_type == "priority", LiquidRequest.status.in_(list(ACTIVE_REQUEST_STATUSES)))
        .order_by(LiquidRequest.created_at.desc(), LiquidRequest.id.desc())
        .limit(limit)
        .all()
    )

    return {
        "generated_at": _iso(datetime.utcnow()),
        "batches": [_build_batch_card(db, item) for item in active_batches],
        "tankers": [_build_tanker_card(db, item) for item in active_tankers],
        "deliveries": [_build_delivery_card(db, item) for item in active_deliveries],
        "priority_requests": [
            {
                "id": request.id,
                "status": request.status,
                "user_id": request.user_id,
                "volume_liters": request.volume_liters,
                "is_asap": request.is_asap,
                "scheduled_for": _iso(request.scheduled_for),
                "created_at": _iso(request.created_at),
                "updated_at": _iso(request.updated_at),
                "retry_count": request.retry_count,
                "refund_eligible": request.refund_eligible,
                "latitude": request.latitude,
                "longitude": request.longitude,
            }
            for request in active_requests
        ],
    }


@router.get("/requests")
def admin_requests(
    limit: int = Query(50, ge=1, le=200),
    delivery_type: str | None = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(LiquidRequest)
    if delivery_type:
        query = query.filter(LiquidRequest.delivery_type == delivery_type)
    requests = query.order_by(LiquidRequest.created_at.desc(), LiquidRequest.id.desc()).limit(limit).all()
    return {
        "items": [
            {
                "id": item.id,
                "user_id": item.user_id,
                "delivery_type": item.delivery_type,
                "status": item.status,
                "volume_liters": item.volume_liters,
                "is_asap": item.is_asap,
                "scheduled_for": _iso(item.scheduled_for),
                "latitude": item.latitude,
                "longitude": item.longitude,
                "retry_count": item.retry_count,
                "assignment_failed_reason": item.assignment_failed_reason,
                "refund_eligible": item.refund_eligible,
                "created_at": _iso(item.created_at),
                "updated_at": _iso(item.updated_at),
            }
            for item in requests
        ]
    }


@router.get("/payments")
def admin_payments(limit: int = Query(50, ge=1, le=200), db: Session = Depends(get_db)):
    payments = db.query(Payment).order_by(Payment.id.desc()).limit(limit).all()
    return {
        "items": [
            {
                "id": item.id,
                "user_id": item.user_id,
                "batch_id": item.batch_id,
                "member_id": item.member_id,
                "amount": float(item.amount or 0),
                "status": item.status,
            }
            for item in payments
        ]
    }


@router.get("/tankers")
def admin_tankers(limit: int = Query(50, ge=1, le=200), db: Session = Depends(get_db)):
    tankers = db.query(Tanker).order_by(Tanker.id.desc()).limit(limit).all()
    return {"items": [_build_tanker_card(db, item) for item in tankers]}


@router.get("/deliveries")
def admin_deliveries(limit: int = Query(50, ge=1, le=200), db: Session = Depends(get_db)):
    deliveries = db.query(DeliveryRecord).order_by(DeliveryRecord.updated_at.desc(), DeliveryRecord.id.desc()).limit(limit).all()
    return {"items": [_build_delivery_card(db, item) for item in deliveries]}


# ---------- write endpoints ----------

@router.post("/maintenance/cleanup-expired")
def trigger_cleanup(db: Session = Depends(get_db)):
    cleanup_expired_members(db)
    return {"message": "Expired members cleanup triggered"}


@router.post("/batches/{batch_id}/expire")
def force_expire_batch(batch_id: int, refund_paid_members: bool = True, db: Session = Depends(get_db)):
    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    current_status = str(batch.status or "")
    if current_status in {"completed", "expired", "failed", "partially_completed"}:
        raise HTTPException(status_code=400, detail=f"Batch already resolved as '{current_status}'")

    if current_status != "expired":
        _safe_set_batch_status(batch, "expired")

    batch.completed_at = None
    batch.assignment_failed_at = datetime.utcnow()

    refunds: list[dict[str, Any]] = []
    members = db.query(BatchMember).filter(BatchMember.batch_id == batch.id).all()
    db.add(batch)
    db.commit()
    db.refresh(batch)

    if refund_paid_members:
        for member in members:
            if member.payment_status == "paid" and member.status == "active":
                try:
                    result = execute_member_refund(db, member, batch)
                    refunds.append({"member_id": member.id, "success": True, "result": result})
                except HTTPException as exc:
                    refunds.append({"member_id": member.id, "success": False, "detail": exc.detail})

    return {
        "message": "Batch force-expired successfully",
        "batch_id": batch.id,
        "status": batch.status,
        "refunds": refunds,
    }


@router.post("/batches/{batch_id}/offer/{tanker_id}")
def force_offer_batch_to_tanker(batch_id: int, tanker_id: int, db: Session = Depends(get_db)):
    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    tanker = db.query(Tanker).filter(Tanker.id == tanker_id).first()
    if not tanker:
        raise HTTPException(status_code=404, detail="Tanker not found")

    if tanker.current_request_id is not None:
        raise HTTPException(status_code=400, detail="Tanker already has an active priority request")
    if tanker.pending_offer_type or tanker.pending_offer_id:
        raise HTTPException(status_code=400, detail="Tanker already has a pending offer")
    if batch.status in {"completed", "expired", "failed", "partially_completed"}:
        raise HTTPException(status_code=400, detail=f"Cannot offer resolved batch in status '{batch.status}'")

    tanker.pending_offer_type = "batch"
    tanker.pending_offer_id = batch.id
    tanker.offer_expires_at = datetime.utcnow() + timedelta(seconds=60)
    tanker.is_available = False
    if tanker.status == "completed":
        tanker.status = "available"

    if batch.status in {"forming", "near_ready"}:
        _safe_set_batch_status(batch, "ready_for_assignment")

    batch.assignment_started_at = batch.assignment_started_at or datetime.utcnow()
    batch.assignment_failed_at = None

    offer = create_job_offer(
        db,
        tanker_id=tanker.id,
        job_type="batch",
        batch_id=batch.id,
        job_lat=batch.latitude,
        job_lon=batch.longitude,
    )

    db.add(tanker)
    db.add(batch)
    db.commit()
    db.refresh(tanker)
    db.refresh(batch)

    return {
        "message": "Batch offer sent to tanker",
        "batch_id": batch.id,
        "tanker_id": tanker.id,
        "offer_id": offer.id,
        "offer_expires_at": _iso(tanker.offer_expires_at),
    }


@router.post("/batch-members/{member_id}/refund")
def admin_refund_member(member_id: int, db: Session = Depends(get_db)):
    member = db.query(BatchMember).filter(BatchMember.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Batch member not found")

    batch = db.query(Batch).filter(Batch.id == member.batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    return execute_member_refund(db, member, batch)


@router.post("/tankers/{tanker_id}/reset")
def reset_tanker_availability(tanker_id: int, db: Session = Depends(get_db)):
    tanker = db.query(Tanker).filter(Tanker.id == tanker_id).first()
    if not tanker:
        raise HTTPException(status_code=404, detail="Tanker not found")

    tanker.pending_offer_type = None
    tanker.pending_offer_id = None
    tanker.offer_expires_at = None
    tanker.current_request_id = None
    tanker.is_available = True
    if tanker.status in {"completed", "available", "assigned"}:
        tanker.status = "available"
    elif tanker.status not in {"loading", "delivering", "arrived"}:
        tanker.status = "available"

    db.add(tanker)
    db.commit()
    db.refresh(tanker)

    return {
        "message": "Tanker reset to available state",
        "tanker_id": tanker.id,
        "status": tanker.status,
        "is_available": tanker.is_available,
    }
