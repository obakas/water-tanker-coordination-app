from sqlalchemy import Column, ForeignKey, Integer
from sqlalchemy.orm import Session
from app.models.payment import Payment
from datetime import datetime
from app.models.batch_member import BatchMember
from app.models.batch import Batch
from app.services.tanker_service import assign_tanker



def initiate_payment(db: Session, member_id: int):

    member = db.query(BatchMember).filter(BatchMember.id == member_id).first()
    if not member:
        raise Exception("Member not found")

    batch = db.query(Batch).filter(Batch.id == member.batch_id).first()

    amount = calculate_member_cost(batch, member.volume_liters)

    # Add your commission (example: 10%)
    commission = amount * 0.1
    total_amount = amount + commission
    total_amount = round(total_amount, 2)

    payment = Payment(
        user_id=member.user_id,
        batch_id=batch.id,
        member_id=member.id,
        amount=total_amount,
        status="pending"
    )

    db.add(payment)
    db.commit()
    db.refresh(payment)

    return {
        "payment_id": payment.id,
        "amount": total_amount,
        "base_amount": amount,
        "commission": commission
    }

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

    # Update batch volume
    batch = db.query(Batch).filter(Batch.id == member.batch_id).first()
    batch.current_volume += member.volume_liters

    # Check readiness
    if batch.current_volume >= batch.target_volume:
        batch.status = "ready"
        assign_tanker(db, batch)

    db.commit()

    return {
        "message": "Payment confirmed",
        "batch_status": batch.status
    }