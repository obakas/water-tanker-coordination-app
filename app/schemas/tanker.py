from typing import Optional
from pydantic import BaseModel


class TankerBase(BaseModel):
    driver_name: str
    phone: str
    office_address: Optional[str] = None
    tank_plate_number: str
    brand: Optional[str] = None
    model: Optional[str] = None
    capacity_liters: int
    liquid_id: int
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class TankerCreate(TankerBase):
    user_id: int


class TankerUpdate(BaseModel):
    driver_name: Optional[str] = None
    phone: Optional[str] = None
    office_address: Optional[str] = None
    tank_plate_number: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    capacity_liters: Optional[int] = None
    liquid_id: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_available: Optional[bool] = None
    status: Optional[str] = None


class TankerOut(TankerBase):
    id: int
    user_id: int
    is_available: bool
    rating: int
    status: str

    class Config:
        from_attributes = True