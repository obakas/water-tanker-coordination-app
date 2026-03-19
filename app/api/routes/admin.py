from http.client import HTTPException
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.batch_service import cleanup_expired_members
from app.services.tanker_service import pay_tanker_internal

router = APIRouter()

@router.post("/cleanup-expired")
def trigger_cleanup(db: Session = Depends(get_db)):
    cleanup_expired_members(db)
    return {"message": "Cleanup triggered"}


@router.post("/pay/{tanker_id}")
def pay_tanker(tanker_id: int, db: Session = Depends(get_db)):
    try:
        result = pay_tanker_internal(db, tanker_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))