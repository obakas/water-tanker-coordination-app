from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.tanker import Tanker
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["Auth"])


class LoginPayload(BaseModel):
    phone: str


class DriverSignupPayload(BaseModel):
    name: str
    phone: str
    tank_plate_number: str


@router.post("/login")
def login(payload: LoginPayload, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.phone == payload.phone).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id": user.id,
        "name": user.name,
        "phone": user.phone,
        "address": user.address,
    }


@router.post("/driver-login")
def driver_login(payload: LoginPayload, db: Session = Depends(get_db)):
    phone = payload.phone.strip()

    tanker = db.query(Tanker).filter(Tanker.phone == phone).first()

    if not tanker:
        raise HTTPException(status_code=404, detail="Driver not found")

    return {
        "id": tanker.id,
        "name": tanker.driver_name,
        "phone": tanker.phone,
        "tankerId": tanker.id,
    }


@router.post("/driver-signup")
def driver_signup(payload: DriverSignupPayload, db: Session = Depends(get_db)):
    phone = payload.phone.strip()
    plate = payload.tank_plate_number.strip().upper()

    existing_phone = db.query(Tanker).filter(Tanker.phone == phone).first()
    if existing_phone:
        raise HTTPException(status_code=400, detail="Driver with this phone already exists")

    existing_plate = db.query(Tanker).filter(Tanker.tank_plate_number == plate).first()
    if existing_plate:
        raise HTTPException(status_code=400, detail="Tanker plate number already exists")

    tanker = Tanker(
        driver_name=payload.name.strip(),
        phone=phone,
        tank_plate_number=plate,
        status="available",
        is_available=True,
        current_request_id=None,
    )

    db.add(tanker)
    db.commit()
    db.refresh(tanker)

    return {
        "id": tanker.id,
        "name": tanker.driver_name,
        "phone": tanker.phone,
        "tankerId": tanker.id,
    }