from pydantic import BaseModel

class BatchResponse(BaseModel):
    id: str
    current_volume: int
    target_volume: int
    status: str