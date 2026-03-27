from typing import Optional, List, Literal
from pydantic import BaseModel


class DeliveryPlanStop(BaseModel):
    member_id: int
    request_id: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    volume_liters: Optional[int] = None
    sequence: int


class AssignedTankerSnapshot(BaseModel):
    tanker_id: int
    driver_name: str
    phone: str
    tank_plate_number: str
    status: str


class BatchLiveResponse(BaseModel):
    batch_id: int
    status: Literal[
        "forming",
        "near_ready",
        "ready_for_assignment",
        "assigned",
        "loading",
        "delivering",
        "completed",
        "expired",
    ]
    current_volume: float
    target_volume: float
    fill_percentage: float
    member_count: int
    paid_member_count: int
    unpaid_member_count: int
    remaining_volume: float
    payment_ratio: float
    geo_compactness: float
    wait_urgency: float
    health_score: float
    search_radius_km: Optional[float] = None
    assigned_tanker: Optional[AssignedTankerSnapshot] = None
    delivery_plan: List[DeliveryPlanStop] = []
    next_action_hint: str
    
# from pydantic import BaseModel
# from typing import Optional, List, Literal

# class BatchResponse(BaseModel):
#     id: int
#     current_volume: float
#     target_volume: float
#     status: str

# class DeliveryPlanStop(BaseModel):
#     member_id: int
#     request_id: Optional[int] = None
#     latitude: float
#     longitude: float
#     volume_liters: Optional[int] = None
#     sequence: int


# class AssignedTankerSnapshot(BaseModel):
#     tanker_id: int
#     driver_name: str
#     phone: str
#     tank_plate_number: str
#     status: str


# class BatchLiveResponse(BaseModel):
#     batch_id: int
#     status: Literal[
#         "forming",
#         "near_ready",
#         "ready_for_assignment",
#         "assigned",
#         "loading",
#         "delivering",
#         "completed",
#         "expired",
#     ]
#     current_volume: float
#     target_volume: float
#     fill_percentage: float
#     member_count: int
#     paid_member_count: int
#     unpaid_member_count: int
#     remaining_volume: float
#     payment_ratio: float
#     geo_compactness: float
#     wait_urgency: float
#     health_score: float
#     search_radius_km: Optional[float] = None
#     assigned_tanker: Optional[AssignedTankerSnapshot] = None
#     delivery_plan: List[DeliveryPlanStop] = []
#     next_action_hint: str