from random import random

from sqlalchemy import Column, ForeignKey, Integer
from sqlalchemy.orm import Session
from app.models.payment import Payment
from datetime import datetime
from app.models.batch_member import BatchMember
from app.models.batch import Batch
from app.services.tanker_service import  assign_tanker_multi_batch
# import random



# payments_service.py
def initiate_payment(db: Session, member_id: int):
    member = db.query(BatchMember).filter(BatchMember.id == member_id).first()
    if not member:
        raise Exception("Member not found")
    
    # Auto-calc
    price_per_liter = 5
    amount = member.volume_liters * price_per_liter

    payment = Payment(
        member_id=member_id,
        amount=amount,
        status="pending"
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment

def calculate_member_cost(batch, member_volume):
    price_per_liter = batch.base_price / batch.target_volume
    return member_volume * price_per_liter



def confirm_payment(db: Session, payment_id: int):

    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise Exception("Payment not found")

    member = db.query(BatchMember).filter(
        BatchMember.id == payment.member_id
    ).first()

    if not member:
        raise Exception("Member not found")
    
    

    # Deadline enforcement
    if datetime.utcnow() > member.payment_deadline:
        member.status = "cancelled"
        payment.status = "failed"
        db.commit()
        return {"error": "Payment expired"}

    # Confirm everything
    payment.status = "paid"
    member.payment_status = "paid"
    member.status = "confirmed"

    # to avoid double payments
    if payment.status == "paid":
        return {"message": "Already paid"}
    
    def generate_otp():
        return str(random.randint(1000, 9999))

    # generate OTP 
    member.delivery_code = generate_otp()
    
    # to avoid double volume addition
    if member.status == "confirmed":
        return {"message": "Member already confirmed"}

    # Update batch volume
    batch = db.query(Batch).filter(Batch.id == member.batch_id).first()
    batch.current_volume += member.volume_liters

    # to Handle missing batch (safety)
    if not batch:
        raise Exception("Batch not found")
    
    db.commit()

    # Check readiness
    if batch.current_volume >= batch.target_volume:
        batch.status = "ready"
        # assign_tanker(db, batch)
        assign_tanker_multi_batch(db)

    

    return {
        "message": "Payment confirmed",
        "batch_status": batch.status,
        "delivery_code": member.delivery_code
    }


