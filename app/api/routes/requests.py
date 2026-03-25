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
    
# from fastapi import APIRouter, Depends, HTTPException
# from sqlalchemy.orm import Session
# from app.api.deps import get_db
# from app.schemas.request import RequestCreate
# from app.models.request import LiquidRequest
# from app.services.batch_service import find_or_create_batch
# from app.services.priority_service import handle_priority_request

# router = APIRouter(prefix="/requests", tags=["requests"])


# @router.post("/")
# def create_request(payload: RequestCreate, db: Session = Depends(get_db)):
#     request = LiquidRequest(**payload.dict())
#     db.add(request)
#     db.commit()
#     db.refresh(request)

#     if payload.delivery_type == "batch":
#         result = find_or_create_batch(db, request)
#     elif payload.delivery_type == "priority":
#         result = handle_priority_request(db, request)
#     else:
#         raise HTTPException(status_code=400, detail="Invalid delivery type")

#     batch = result["batch"]
#     member = result.get("member")

#     return {
#         "request_id": request.id,
#         "batch_id": batch.id if batch else None,
#         "member_id": member.id if member else None,
#         "payment_deadline": member.payment_deadline if member else None,
#         "delivery_type": payload.delivery_type,
#     }