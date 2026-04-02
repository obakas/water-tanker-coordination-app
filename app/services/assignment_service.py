from __future__ import annotations
from datetime import datetime
from typing import Any
from sqlalchemy.orm import Session
from app.models.batch import Batch
from app.models.batch_member import BatchMember
from app.models.tanker import Tanker
from app.models.job_offer import JobOffer
from app.services.driver_scoring_service import (
    compute_driver_score,
    build_zone_key,
    get_or_create_metric,
    haversine_km,
    score_driver_for_batch,
)
from app.services.delivery_service import (create_delivery_record_for_priority,create_delivery_records_for_batch)



MAX_BATCH_ASSIGNMENT_RADIUS_KM = 2.0

def get_eligible_tankers(db: Session):
    return db.query(Tanker).filter(
        Tanker.is_available == True,
        Tanker.status == "available",
        Tanker.is_online == True,
    ).all()


def rank_tankers_for_job(
    db: Session,
    *,
    job_lat: float,
    job_lon: float,
    job_type: str,
):
    tankers = get_eligible_tankers(db)

    ranked = []
    for tanker in tankers:
        if tanker.paused_until and tanker.paused_until > datetime.utcnow():
            continue

        breakdown = compute_driver_score(
            db,
            tanker,
            job_lat=job_lat,
            job_lon=job_lon,
            job_type=job_type,
        )
        ranked.append((tanker, breakdown))

    ranked.sort(key=lambda item: item[1].final_score, reverse=True)
    return ranked


def create_job_offer(
    db: Session,
    *,
    tanker_id: int,
    job_type: str,
    request_id: int | None = None,
    batch_id: int | None = None,
    job_lat: float,
    job_lon: float,
    estimated_distance_km: float | None = None,
    estimated_eta_minutes: float | None = None,
):
    offer = JobOffer(
        tanker_id=tanker_id,
        job_type=job_type,
        request_id=request_id,
        batch_id=batch_id,
        zone_key=build_zone_key(job_lat, job_lon),
        estimated_distance_km=estimated_distance_km,
        estimated_eta_minutes=estimated_eta_minutes,
    )
    db.add(offer)

    metric = get_or_create_metric(db, tanker_id)
    metric.offers_total += 1
    if job_type == "priority":
        metric.priority_offers_total += 1
    metric.last_offered_at = datetime.utcnow()

    db.flush()
    return offer


def mark_offer_accepted(db: Session, offer: JobOffer, response_seconds: float | None = None):
    offer.response_type = "accepted"
    offer.responded_at = datetime.utcnow()
    offer.response_seconds = response_seconds

    metric = get_or_create_metric(db, offer.tanker_id)
    metric.accepts_total += 1
    if offer.job_type == "priority":
        metric.priority_accepts_total += 1
    metric.last_accepted_at = datetime.utcnow()

    if response_seconds is not None:
        old = metric.avg_response_seconds
        metric.avg_response_seconds = ((old * 4) + response_seconds) / 5


def mark_offer_declined(
    db: Session,
    offer: JobOffer,
    *,
    decline_reason: str,
    response_seconds: float | None = None,
):
    offer.response_type = "declined"
    offer.decline_reason = decline_reason
    offer.responded_at = datetime.utcnow()
    offer.response_seconds = response_seconds

    metric = get_or_create_metric(db, offer.tanker_id)
    metric.declines_total += 1
    metric.decline_count_today += 1

    if response_seconds is not None:
        old = metric.avg_response_seconds
        metric.avg_response_seconds = ((old * 4) + response_seconds) / 5


def mark_offer_timeout(db: Session, offer: JobOffer):
    offer.response_type = "timeout"
    offer.responded_at = datetime.utcnow()

    metric = get_or_create_metric(db, offer.tanker_id)
    metric.timeouts_total += 1
    metric.timeout_count_today += 1


def assign_best_tanker_for_priority(
    db: Session,
    *,
    request,
    offer_limit: int = 5,
):
    

    ranked = rank_tankers_for_job(
        db,
        job_lat=request.latitude,
        job_lon=request.longitude,
        job_type="priority",
    )

    

    ranked = ranked[:offer_limit]
    if not ranked:
        return None

    # V1: assign top driver immediately.
    # Later, this becomes timed offer -> accept/decline/timeout.
    tanker, breakdown = ranked[0]

    tanker.status = "assigned"
    tanker.is_available = False

    # priority.status = "assigned"
    # request.status = "assigned"
    
    tanker.current_request_id = request.id

    request.status = "assigned"
    db.commit()
    db.refresh(tanker)
    db.refresh(request)

    # 🔥 CREATE DELIVERY RECORD (priority = single stop)
    create_delivery_record_for_priority(
    db,
    request_id=request.id,
    tanker_id=tanker.id,
)

    create_job_offer(
        db,
        tanker_id=tanker.id,
        job_type="priority",
        request_id=request.id,
        job_lat=request.latitude,
        job_lon=request.longitude,
    )

    return {
        "tanker": tanker,
        "score_breakdown": breakdown,
        "ranked_candidates": [
            {
                "tanker_id": t.id,
                "score": b.final_score,
            }
            for t, b in ranked
        ],
    }


def mark_job_completed(db: Session, tanker_id: int, job_type: str, earnings: float = 0.0):
    metric = get_or_create_metric(db, tanker_id)

    metric.completed_total += 1
    metric.jobs_completed_today += 1
    metric.earnings_today += earnings
    metric.last_completed_at = datetime.utcnow()

    if job_type == "priority":
        metric.priority_completed_total += 1

def assign_best_tanker_for_batch(
    db: Session,
    batch: Batch,
    members: list[BatchMember],
) -> dict[str, Any]:
    """
    Assign the best tanker to a ready batch.
    """
    current_status = str(getattr(batch, "status", "") or "").lower()
    if current_status in {"assigned", "loading", "delivering", "completed"}:
        return {
            "assigned": False,
            "batch_id": batch.id,
            "reason": f"Batch already in status '{current_status}'",
        }

    eligible_tankers = get_eligible_tankers_for_batch(db, batch)
    if not eligible_tankers:
        return {
            "assigned": False,
            "batch_id": batch.id,
            "reason": "No eligible tankers found",
        }

    ranked = rank_tankers_for_batch(
        db=db,
        batch=batch,
        members=members,
        tankers=eligible_tankers,
    )

    if not ranked:
        return {
            "assigned": False,
            "batch_id": batch.id,
            "reason": "No ranked tanker candidates available",
        }

    best = ranked[0]
    tanker: Tanker = best["tanker"]

    # Assign tanker to batch
    # tanker.status = "assigned"
    tanker.status = "assigned"
    tanker.is_available = False

    batch.status = "assigned"
    batch.tanker_id = tanker.id

    # If your Tanker model uses current_request_id only for priority,
    # leave it alone here unless you intentionally reuse it for batches.
    # If your Batch model has tanker_id, set it.
    if hasattr(batch, "tanker_id"):
        batch.tanker_id = tanker.id

    # db.add(tanker)
    # db.add(batch)
    db.commit()
    db.refresh(tanker)
    db.refresh(batch)

    # 🔥 CREATE DELIVERY RECORDS (batch = multiple stops)
    create_delivery_records_for_batch(
    db,
    batch_id=batch.id,
    tanker_id=tanker.id,
)

    return {
        "assigned": True,
        "batch_id": batch.id,
        "tanker_id": tanker.id,
        "tanker_name": getattr(tanker, "driver_name", None),
        "score": best["score"],
        "score_breakdown": best["breakdown"],
        "reason": "Best eligible tanker assigned successfully",
    }


def get_eligible_tankers_for_batch(db: Session, batch: Batch) -> list[Tanker]:
    """
    V1 eligibility rules for batch assignment:
    - tanker is online
    - tanker is available
    - tanker is not paused
    - tanker is within assignment radius
    """
    batch_lat = getattr(batch, "latitude", None)
    batch_lon = getattr(batch, "longitude", None)

    tankers = db.query(Tanker).all()
    eligible: list[Tanker] = []

    for tanker in tankers:
        is_online = bool(getattr(tanker, "is_online", True))
        status = str(getattr(tanker, "status", "") or "").lower()
        paused_until = getattr(tanker, "paused_until", None)

        # only available tankers should be considered
        if not is_online:
            continue

        # if status not in {"available", "idle"}:
        #     continue
        if status != "available":
            continue
        # status == "available"

        # if paused_until is not None:
        #     continue
        if paused_until and paused_until > datetime.utcnow():
            continue

        tanker_lat = getattr(tanker, "latitude", None)
        tanker_lon = getattr(tanker, "longitude", None)

        # if we don't know location, skip for now
        if None in (batch_lat, batch_lon, tanker_lat, tanker_lon):
            continue

        distance_km = haversine_km(
            tanker_lat,
            tanker_lon,
            batch_lat,
            batch_lon,
        )

        if distance_km > MAX_BATCH_ASSIGNMENT_RADIUS_KM:
            continue

        eligible.append(tanker)

    return eligible


def rank_tankers_for_batch(
    db: Session,
    batch: Batch,
    members: list[BatchMember],
    tankers: list[Tanker],
) -> list[dict[str, Any]]:
    ranked: list[dict[str, Any]] = []

    for tanker in tankers:
        score_breakdown = score_driver_for_batch(
            db=db,
            tanker=tanker,
            batch=batch,
            members=members,
        )

        ranked.append(
            {
                "tanker": tanker,
                "tanker_id": tanker.id,
                "score": score_breakdown["final_score"],
                "breakdown": score_breakdown,
            }
        )

    ranked.sort(key=lambda item: item["score"], reverse=True)
    return ranked


