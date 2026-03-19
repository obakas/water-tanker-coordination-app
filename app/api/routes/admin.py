from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.batch_service import cleanup_expired_members

router = APIRouter()

@router.post("/cleanup-expired")
def trigger_cleanup(db: Session = Depends(get_db)):
    cleanup_expired_members(db)
    return {"message": "Cleanup triggered"}