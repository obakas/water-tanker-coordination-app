from pydantic import BaseModel

class TankerCreate(BaseModel):
    driver_name: str
    phone: str
    capacity_liters: int
    liquid_id: str