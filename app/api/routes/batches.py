# app/api/routes/batches.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.batch import BatchLiveResponse
from app.schemas.batch import BatchLiveResponse
from app.services.batch_live_service import get_batch_live_snapshot
from app.services.batch_orchestration_service import (
    handle_stale_batch,
    maybe_assign_tanker_to_batch,
    prepare_batch_for_delivery,
    refresh_batch_state,
)
from app.services.batch_scoring_service import calculate_batch_health_score
from app.services.batch_service import get_batch_by_id, get_batch_members

router = APIRouter(prefix="/batches", tags=["Batches"])


@router.get("/{batch_id}")
def get_batch(batch_id: int, db: Session = Depends(get_db)):
    batch = get_batch_by_id(db, batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    members = get_batch_members(db, batch_id)

    return {
        "id": batch.id,
        "status": getattr(batch, "status", None),
        "current_volume": getattr(batch, "current_volume", None),
        "target_volume": getattr(batch, "target_volume", None),
        "volume_liters": getattr(batch, "volume_liters", None),
        "latitude": getattr(batch, "latitude", None),
        "longitude": getattr(batch, "longitude", None),
        "liquid_id": getattr(batch, "liquid_id", None),
        "user_id": getattr(batch, "user_id", None),
        "tanker_id": getattr(batch, "tanker_id", None) if hasattr(batch, "tanker_id") else None,
        "member_count": len(members),
    }


# @router.get("/{batch_id}/health")
# def get_batch_health(batch_id: int, db: Session = Depends(get_db)):
#     batch = get_batch_by_id(db, batch_id)
#     if not batch:
#         raise HTTPException(status_code=404, detail="Batch not found")

#     members = get_batch_members(db, batch_id)
#     score = calculate_batch_health_score(batch, members)

#     return {
#         "batch_id": batch.id,
#         "status": getattr(batch, "status", None),
#         "health_score": score.health_score,
#         "fill_ratio": score.fill_ratio,
#         "payment_ratio": score.payment_ratio,
#         "geo_compactness": score.geo_compactness,
#         "wait_urgency": score.wait_urgency,
#         "paid_members_count": score.paid_members_count,
#         "total_members_count": score.total_members_count,
#     }

@router.get("/{batch_id}/health")
def get_batch_health(batch_id: int, db: Session = Depends(get_db)):
    try:
        result = refresh_batch_state(db, batch_id)
        return result
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

# @router.get("/{batch_id}/live", response_model=BatchLiveResponse)
# def get_batch_live(batch_id: int, db: Session = Depends(get_db)):
#     try:
#         snapshot = get_batch_live_snapshot(db, batch_id)
#         return snapshot
#     except ValueError as e:
#         raise HTTPException(status_code=404, detail=str(e))
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Failed to fetch live batch: {str(e)}")
    
@router.get("/{batch_id}/live", response_model=BatchLiveResponse)
def get_batch_live(batch_id: int, db: Session = Depends(get_db)):
    try:
        return get_batch_live_snapshot(db, batch_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print(f"[BATCH LIVE ERROR] batch_id={batch_id} error={e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch live batch: {str(e)}")
    
@router.post("/{batch_id}/refresh")
def refresh_batch(batch_id: int, db: Session = Depends(get_db)):
    try:
        result = refresh_batch_state(db, batch_id)
        return result
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.post("/{batch_id}/assign")
def assign_batch(batch_id: int, db: Session = Depends(get_db)):
    try:
        result = maybe_assign_tanker_to_batch(db, batch_id)
        return result
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.get("/{batch_id}/delivery-plan")
def get_batch_delivery_plan(batch_id: int, db: Session = Depends(get_db)):
    try:
        result = prepare_batch_for_delivery(db, batch_id)
        return result
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.post("/{batch_id}/expire-check")
def expire_check_batch(batch_id: int, db: Session = Depends(get_db)):
    try:
        result = handle_stale_batch(db, batch_id)
        return result
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


# from fastapi import APIRouter

# from app.services import batch_service

# router = APIRouter(prefix="/batches", tags=["batches"])


# @router.get("/")
# def get_batches():
#     return {"message": "Batches endpoint working"}


# @router.post("/{batch_id}/join")
# def join_batch(batch_id: int, payload: JoinBatchRequest, db: Session = Depends(get_db)):
#     return batch_service.join_batch(db, batch_id, payload)