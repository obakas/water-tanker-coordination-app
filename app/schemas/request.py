from datetime import datetime, timedelta
from typing import Literal, Optional

from pydantic import BaseModel, model_validator


ASAP_BUFFER_MINUTES = 90


class RequestCreate(BaseModel):
    user_id: int
    liquid_id: int
    volume_liters: int
    latitude: float
    longitude: float
    delivery_type: Literal["batch", "priority"]

    is_asap: bool = False
    scheduled_for: Optional[datetime] = None

    @model_validator(mode="after")
    def validate_request(self):
        if self.delivery_type == "batch":
            if self.is_asap:
                raise ValueError("is_asap cannot be used for batch delivery")
            if self.scheduled_for is not None:
                raise ValueError("scheduled_for cannot be used for batch delivery")
            return self

        if self.is_asap:
            return self

        if self.scheduled_for is None:
            raise ValueError(
                "scheduled_for is required for priority delivery when is_asap is false"
            )

        min_allowed_time = datetime.now() + timedelta(minutes=ASAP_BUFFER_MINUTES)

        if self.scheduled_for < min_allowed_time:
            raise ValueError(
                f"scheduled_for must be at least {ASAP_BUFFER_MINUTES} minutes from now"
            )

        return self