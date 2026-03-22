from typing import Literal, Optional
from pydantic import BaseModel, model_validator


class RequestCreate(BaseModel):
    user_id: int
    liquid_id: int
    volume_liters: int
    latitude: float
    longitude: float
    delivery_type: Literal["batch", "priority"]
    scheduled_time: Optional[str] = None

    @model_validator(mode="after")
    def validate_scheduled_time(self):
        if self.delivery_type == "priority" and not self.scheduled_time:
            raise ValueError("scheduled_time is required for priority delivery")
        return self