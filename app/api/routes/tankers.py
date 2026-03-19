from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.tanker import Tanker
from app.models.batch import Batch

router = APIRouter(prefix="/tanker", tags=["Tanker"])


# 🚚 Tanker accepts job
@router.post("/accept/{batch_id}")
def accept_batch(batch_id: int, db: Session = Depends(get_db)):
    batch = db.query(Batch).filter(Batch.id == batch_id).first()

    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    if batch.status != "assigned":
        raise HTTPException(status_code=400, detail="Batch not ready for acceptance")

    batch.status = "loading"

    tanker = db.query(Tanker).filter(Tanker.id == batch.tanker_id).first()
    tanker.status = "loading"

    db.commit()

    return {"message": "Tanker accepted job. Start loading water."}


# 💧 Tanker finished loading water
@router.post("/loaded/{batch_id}")
def tanker_loaded(batch_id: int, db: Session = Depends(get_db)):
    batch = db.query(Batch).filter(Batch.id == batch_id).first()

    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    if batch.status != "loading":
        raise HTTPException(status_code=400, detail="Batch not in loading state")

    batch.status = "delivering"

    tanker = db.query(Tanker).filter(Tanker.id == batch.tanker_id).first()
    tanker.status = "delivering"

    db.commit()

    return {"message": "Tanker is now delivering"}