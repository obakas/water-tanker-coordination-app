from __future__ import annotations

import random
from datetime import datetime
from typing import Any

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.batch import Batch
from app.models.batch_member import BatchMember
from app.models.payment import Payment
from app.services.batch_orchestration_service import handle_batch_payment_confirmed
from app.services.batch_service import mark_batch_ready, recalculate_batch_volume
from app.services.tanker_service import assign_tanker_to_batch


def generate_delivery_code() -> str:
    return str(random.randint(1000, 9999))


def get_payment_by_id(db: Session, payment_id: int) -> Payment:
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment


def get_member_payment(db: Session, member_id: int) -> Payment | None:
    return db.query(Payment).filter(Payment.member_id == member_id).first()


def initiate_payment(db: Session, member_id: int) -> Payment:
    member = db.query(BatchMember).filter(BatchMember.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    amount = member.volume_liters * 5  # Replace later with pricing config

    payment = Payment(
        member_id=member_id,
        amount=amount,
        status="pending",
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


def calculate_member_cost(batch: Batch, member_volume: int) -> float:
    price_per_liter = batch.base_price / batch.target_volume
    return member_volume * price_per_liter


def confirm_payment(db: Session, payment_id: int) -> dict[str, Any]:
    payment = get_payment_by_id(db, payment_id)

    if payment.status == "paid":
        return {"message": "Payment already confirmed", "payment_id": payment.id}

    member = db.query(BatchMember).filter(BatchMember.id == payment.member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    if member.status == "confirmed":
        return {"message": "Member already confirmed", "member_id": member.id}

    if member.payment_deadline and datetime.utcnow() > member.payment_deadline:
        member.status = "cancelled"
        member.payment_status = "failed"
        payment.status = "failed"
        db.commit()
        return {"error": "Payment expired"}

    payment.status = "paid"
    member.payment_status = "paid"
    member.status = "confirmed"
    member.delivery_code = generate_delivery_code()

    db.commit()
    db.refresh(member)
    db.refresh(payment)

    batch = recalculate_batch_volume(db, member.batch_id)

    if batch.current_volume >= batch.target_volume:
        batch = mark_batch_ready(db, batch.id)
        assignment_result = assign_tanker_to_batch(db, batch.id)
    else:
        assignment_result = None

    return {
        "message": "Payment confirmed",
        "payment_id": payment.id,
        "member_id": member.id,
        "batch_id": batch.id,
        "batch_status": batch.status,
        "delivery_code": member.delivery_code,
        "assignment": assignment_result,
    }


def fail_payment(db: Session, payment_id: int, reason: str | None = None) -> Payment:
    payment = get_payment_by_id(db, payment_id)
    payment.status = "failed"
    db.commit()
    db.refresh(payment)
    return payment


def expire_payment(db: Session, payment_id: int) -> Payment:
    payment = get_payment_by_id(db, payment_id)
    payment.status = "expired"
    db.commit()
    db.refresh(payment)
    return payment


def refund_payment(db: Session, payment_id: int) -> Payment:
    payment = get_payment_by_id(db, payment_id)
    payment.status = "refunded"
    db.commit()
    db.refresh(payment)
    return payment


def confirm_batch_member_payment(db: Session, member_id: int):
    # your payment success logic...
    # member.payment_status = "paid"
    # commit...

    member = ...
    batch_id = member.batch_id

    orchestration_result = handle_batch_payment_confirmed(db, batch_id)

    return {
        "payment_confirmed": True,
        "batch_id": batch_id,
        "batch_state": orchestration_result,
    }

# from random import random

# from sqlalchemy import Column, ForeignKey, Integer
# from sqlalchemy.orm import Session
# from app.models.payment import Payment
# from datetime import datetime
# from app.models.batch_member import BatchMember
# from app.models.batch import Batch
# from app.services.tanker_service import  assign_tanker_to_batch
# # import random



# # payments_service.py
# def initiate_payment(db: Session, member_id: int):
#     member = db.query(BatchMember).filter(BatchMember.id == member_id).first()
#     if not member:
#         raise Exception("Member not found")
    
#     # Auto-calc
#     price_per_liter = 5
#     amount = member.volume_liters * price_per_liter

#     payment = Payment(
#         member_id=member_id,
#         amount=amount,
#         status="pending"
#     )
#     db.add(payment)
#     db.commit()
#     db.refresh(payment)
#     return payment

# def calculate_member_cost(batch, member_volume):
#     price_per_liter = batch.base_price / batch.target_volume
#     return member_volume * price_per_liter



# def confirm_payment(db: Session, payment_id: int):

#     payment = db.query(Payment).filter(Payment.id == payment_id).first()
#     if not payment:
#         raise Exception("Payment not found")

#     member = db.query(BatchMember).filter(
#         BatchMember.id == payment.member_id
#     ).first()

#     if not member:
#         raise Exception("Member not found")
    
    

#     # Deadline enforcement
#     if datetime.utcnow() > member.payment_deadline:
#         member.status = "cancelled"
#         payment.status = "failed"
#         db.commit()
#         return {"error": "Payment expired"}

#     # Confirm everything
#     payment.status = "paid"
#     member.payment_status = "paid"
#     member.status = "confirmed"

#     # to avoid double payments
#     if payment.status == "paid":
#         return {"message": "Already paid"}
    
#     def generate_otp():
#         return str(random.randint(1000, 9999))

#     # generate OTP 
#     member.delivery_code = generate_otp()
    
#     # to avoid double volume addition
#     if member.status == "confirmed":
#         return {"message": "Member already confirmed"}

#     # Update batch volume
#     batch = db.query(Batch).filter(Batch.id == member.batch_id).first()
#     batch.current_volume += member.volume_liters

#     # to Handle missing batch (safety)
#     if not batch:
#         raise Exception("Batch not found")
    
#     db.commit()

#     # Check readiness
#     if batch.current_volume >= batch.target_volume:
#         batch.status = "ready"
#         # assign_tanker(db, batch)
#         assign_tanker_to_batch(db)

    

#     return {
#         "message": "Payment confirmed",
#         "batch_status": batch.status,
#         "delivery_code": member.delivery_code
#     }