from pydantic import BaseModel

class BatchResponse(BaseModel):
    id: int
    current_volume: float
    target_volume: float
    status: str