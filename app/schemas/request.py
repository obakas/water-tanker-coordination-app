from pydantic import BaseModel

class RequestCreate(BaseModel):
    user_id: str
    liquid_id: str
    volume_liters: int
    latitude: float
    longitude: float