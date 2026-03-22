from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.tanker import Tanker
from app.models.batch import Batch
from app.schemas.tanker import TankerCreate, TankerUpdate, TankerOut

router = APIRouter(prefix="/tankers", tags=["Tankers"])


@router.post("/", response_model=TankerOut)
def create_tanker(payload: TankerCreate, db: Session = Depends(get_db)):
    existing_plate = db.query(Tanker).filter(
        Tanker.tank_plate_number == payload.tank_plate_number
    ).first()
    if existing_plate:
        raise HTTPException(status_code=400, detail="Tank plate number already exists")

    tanker = Tanker(**payload.dict())
    db.add(tanker)
    db.commit()
    db.refresh(tanker)
    return tanker


@router.get("/", response_model=list[TankerOut])
def list_tankers(db: Session = Depends(get_db)):
    return db.query(Tanker).all()


@router.get("/{tanker_id}", response_model=TankerOut)
def get_tanker(tanker_id: int, db: Session = Depends(get_db)):
    tanker = db.query(Tanker).filter(Tanker.id == tanker_id).first()
    if not tanker:
        raise HTTPException(status_code=404, detail="Tanker not found")
    return tanker


@router.put("/{tanker_id}", response_model=TankerOut)
def update_tanker(tanker_id: int, payload: TankerUpdate, db: Session = Depends(get_db)):
    tanker = db.query(Tanker).filter(Tanker.id == tanker_id).first()
    if not tanker:
        raise HTTPException(status_code=404, detail="Tanker not found")

    for key, value in payload.dict(exclude_unset=True).items():
        setattr(tanker, key, value)

    db.commit()
    db.refresh(tanker)
    return tanker


@router.post("/accept/{batch_id}")
def accept_batch(batch_id: int, db: Session = Depends(get_db)):
    batch = db.query(Batch).filter(Batch.id == batch_id).first()

    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    if batch.status != "assigned":
        raise HTTPException(status_code=400, detail="Batch not ready for acceptance")

    batch.status = "loading"

    tanker = db.query(Tanker).filter(Tanker.id == batch.tanker_id).first()
    if tanker:
        tanker.status = "loading"

    db.commit()

    return {"message": "Tanker accepted job. Start loading water."}


@router.post("/loaded/{batch_id}")
def tanker_loaded(batch_id: int, db: Session = Depends(get_db)):
    batch = db.query(Batch).filter(Batch.id == batch_id).first()

    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    if batch.status != "loading":
        raise HTTPException(status_code=400, detail="Batch not in loading state")

    batch.status = "delivering"

    tanker = db.query(Tanker).filter(Tanker.id == batch.tanker_id).first()
    if tanker:
        tanker.status = "delivering"

    db.commit()

    return {"message": "Tanker is now delivering"}