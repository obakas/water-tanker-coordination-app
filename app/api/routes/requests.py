from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.request import RequestCreate
from app.services.client_flow_service import create_client_request_flow

router = APIRouter(prefix="/requests", tags=["requests"])


@router.post("/")
def create_request(payload: RequestCreate, db: Session = Depends(get_db)):
    try:
        return create_client_request_flow(db, payload)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create request: {str(e)}")
    
