from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.request import RequestCreate
from app.services.client_flow_service import (create_client_request_flow,
get_client_request_status_flow,
get_priority_request_live_flow,
)

router = APIRouter(prefix="/requests", tags=["requests"])


@router.post("/")
def create_request(payload: RequestCreate, db: Session = Depends(get_db)):
    try:
        return create_client_request_flow(db, payload)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create request: {str(e)}")
    

@router.get("/{request_id}/status")
def get_request_status(request_id: int, db: Session = Depends(get_db)):
    try:
        return get_client_request_status_flow(db, request_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch request status: {str(e)}")
    

@router.get("/{request_id}/live")
def get_priority_request_live(request_id: int, db: Session = Depends(get_db)):
    try:
        return get_priority_request_live_flow(db, request_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch priority live status: {str(e)}")
    
