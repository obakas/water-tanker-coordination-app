from typing import Optional, Literal
from pydantic import BaseModel, field_validator


TankerStatus = Literal[
    "available",
    "assigned",
    "loading",
    "delivering",
    "arrived",
    "completed",
]


class TankerBase(BaseModel):
    driver_name: str
    phone: Optional[str] = None
    tank_plate_number: str


class TankerCreate(TankerBase):

    @field_validator("tank_plate_number")
    @classmethod
    def normalize_plate(cls, v: str) -> str:
        return v.upper().strip()


class TankerUpdate(BaseModel):
    driver_name: Optional[str] = None
    phone: Optional[str] = None
    tank_plate_number: Optional[str] = None
    is_available: Optional[bool] = None



class TankerOut(TankerBase):
    id: int
    status: TankerStatus
    is_available: bool
    current_request_id: Optional[int] = None

    class Config:
        from_attributes = True