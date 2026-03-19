from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.schemas.request import RequestCreate
from app.models.request import LiquidRequest
from app.services.batch_service import find_or_create_batch

router = APIRouter(prefix="/requests", tags=["requests"])


# @router.get("/")
# def get_requests():
#     return {"message": "Requests endpoint working"}

@router.post("/")
def create_request(payload: RequestCreate, db: Session = Depends(get_db)):
    request = LiquidRequest(**payload.dict())
    db.add(request)
    db.commit()
    db.refresh(request)

    # batch = find_or_create_batch(db, request)
    result = find_or_create_batch(db, request)

    batch = result["batch"]
    member = result["member"]

    return {
        "request_id": request.id,
        "batch_id": batch.id,
        "member_id": member.id,
        "payment_deadline": member.payment_deadline
    }