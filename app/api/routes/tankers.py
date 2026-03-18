# from fastapi import APIRouter, Depends
# from sqlalchemy.orm import Session
# from app.api.deps import get_db
# from app.models.batch import Batch

# router = APIRouter(prefix="/batches")

# @router.get("/{batch_id}")
# def get_batch(batch_id: str, db: Session = Depends(get_db)):
#     batch = db.query(Batch).filter(Batch.id == batch_id).first()
#     return batch


# @router.post("/{batch_id}/lock")
# def lock_batch(batch_id: str, db: Session = Depends(get_db)):
#     batch = db.query(Batch).filter(Batch.id == batch_id).first()
#     batch.status = "ready"
#     db.commit()
#     return {"message": "Batch locked"}

from fastapi import APIRouter

router = APIRouter(prefix="/requests", tags=["requests"])


@router.get("/")
def get_requests():
    return {"message": "Requests endpoint working"}