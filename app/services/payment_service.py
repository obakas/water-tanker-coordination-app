from __future__ import annotations

from enum import member
import random
from datetime import datetime
from typing import Any

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.batch import Batch
from app.models.batch_member import BatchMember
from app.models.payment import Payment
from app.services.batch_orchestration_service import handle_batch_payment_confirmed


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



def calculate_member_cost(batch: Batch, member_volume: int) -> float:
    price_per_liter = batch.base_price / batch.target_volume
    return member_volume * price_per_liter


def confirm_payment(db: Session, payment_id: int) -> dict[str, Any]:
    payment = get_payment_by_id(db, payment_id)

    if payment.status == "paid":
        return {
            "message": "Payment already confirmed",
            "payment_id": payment.id,
            "member_id": payment.member_id,
            "batch_id": member.batch_id if member else None,
            "member_status": member.status if member else None,
            "member_payment_status": member.payment_status if member else None,
        }

    member = db.query(BatchMember).filter(BatchMember.id == payment.member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    if member.payment_deadline and datetime.utcnow() > member.payment_deadline:
        member.status = "cancelled"
        member.payment_status = "failed"
        payment.status = "failed"
        db.commit()
        db.refresh(member)
        db.refresh(payment)

        return {
            "message": "Payment expired",
            "payment_id": payment.id,
            "member_id": member.id,
            "batch_id": member.batch_id,
            "payment_status": payment.status,
            "member_status": member.status,
        }

    if member.payment_status == "paid" and member.status == "active":
        return {
            "message": "Member already confirmed",
            "payment_id": payment.id,
            "member_id": member.id,
            "batch_id": member.batch_id,
        }

    payment.status = "paid"
    member.payment_status = "paid"
    member.status = "active"
    member.delivery_code = generate_delivery_code()

    if hasattr(member, "is_active"):
        member.is_active = True

    db.add(payment)
    db.add(member)
    db.commit()
    db.refresh(payment)
    db.refresh(member)

    orchestration_result = handle_batch_payment_confirmed(
        db,
        batch_id=member.batch_id,
        member_id=member.id,
    )

    return {
        "message": "Payment confirmed",
        "payment_id": payment.id,
        "member_id": member.id,
        "batch_id": member.batch_id,
        "member_status": member.status,
        "member_payment_status": member.payment_status,
        "delivery_code": member.delivery_code,
        "batch_snapshot": orchestration_result,
    }