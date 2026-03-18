# from fastapi import APIRouter, Depends
# from sqlalchemy.orm import Session
# from app.core.database import SessionLocal
# from app.models.request import LiquidRequest
# from app.services.batch_service import find_or_create_batch

# router = APIRouter()

# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()

# @router.post("/requests")
# def create_request(data: dict, db: Session = Depends(get_db)):
#     request = LiquidRequest(**data)
#     db.add(request)
#     db.commit()
#     db.refresh(request)

#     batch = find_or_create_batch(db, request)

#     return {
#         "request_id": request.id,
#         "batch_id": batch.id,
#         "current_volume": batch.current_volume
#     }

from fastapi import APIRouter

router = APIRouter(prefix="/requests", tags=["requests"])


@router.get("/")
def get_requests():
    return {"message": "Requests endpoint working"}