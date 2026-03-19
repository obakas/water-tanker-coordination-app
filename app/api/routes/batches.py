# from sqlalchemy.orm import Session
# from app.models.payment import Payment

# def initiate_payment(db: Session, user_id: str, batch_id: str, amount: float):
#     payment = Payment(
#         user_id=user_id,
#         batch_id=batch_id,
#         amount=amount,
#         status="pending"
#     )
#     db.add(payment)
#     db.commit()
#     db.refresh(payment)
#     return payment


# def confirm_payment(db: Session, payment_id: str):
#     payment = db.query(Payment).filter(Payment.id == payment_id).first()
#     if payment:
#         payment.status = "paid"
#         db.commit()
#     return payment


from fastapi import APIRouter

from app.services import batch_service

router = APIRouter(prefix="/batches", tags=["batches"])


@router.get("/")
def get_batches():
    return {"message": "Batches endpoint working"}


# @router.post("/{batch_id}/join")
# def join_batch(batch_id: int, payload: JoinBatchRequest, db: Session = Depends(get_db)):
#     return batch_service.join_batch(db, batch_id, payload)