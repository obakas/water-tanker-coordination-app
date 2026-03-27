from sqlalchemy.orm import Session
from app.services.batch_service import get_batch_by_id, get_batch_members


def build_next_action_hint(status: str, remaining_volume: float) -> str:
    if status == "forming":
        return f"Waiting for more members to join. {remaining_volume:.0f}L remaining."
    if status == "near_ready":
        return f"Batch is close to dispatch. {remaining_volume:.0f}L remaining."
    if status == "ready_for_assignment":
        return "Batch is ready and waiting for tanker assignment."
    if status == "assigned":
        return "A tanker has been assigned to this batch."
    if status == "loading":
        return "Driver is loading water."
    if status == "delivering":
        return "Driver is delivering this batch."
    if status == "completed":
        return "Batch delivery completed."
    if status == "expired":
        return "Batch expired before dispatch."
    return "Batch updated."


def get_batch_live_snapshot(db: Session, batch_id: int) -> dict:
    batch = get_batch_by_id(db, batch_id)
    if not batch:
        raise ValueError(f"Batch {batch_id} not found")

    members = get_batch_members(db, batch_id) or []

    paid_members = [
        m for m in members
        if getattr(m, "payment_status", None) == "paid"
    ]

    current_volume = float(getattr(batch, "current_volume", 0) or 0)
    target_volume = float(getattr(batch, "target_volume", 0) or 0)
    remaining_volume = max(target_volume - current_volume, 0)
    fill_percentage = (current_volume / target_volume * 100) if target_volume > 0 else 0

    paid_member_count = len(paid_members)
    member_count = len(members)
    unpaid_member_count = member_count - paid_member_count

    return {
        "batch_id": batch.id,
        "status": batch.status,
        "current_volume": current_volume,
        "target_volume": target_volume,
        "fill_percentage": round(fill_percentage, 2),
        "member_count": member_count,
        "paid_member_count": paid_member_count,
        "unpaid_member_count": unpaid_member_count,
        "remaining_volume": round(remaining_volume, 2),

        # keep these simple for now until your scoring service is confirmed
        "payment_ratio": round((paid_member_count / member_count), 2) if member_count > 0 else 0,
        "geo_compactness": 0,
        "wait_urgency": 0,
        "health_score": 0,

        "search_radius_km": getattr(batch, "search_radius_km", 1),
        "assigned_tanker": None,
        "delivery_plan": [],
        "next_action_hint": build_next_action_hint(batch.status, remaining_volume),
    }

# from sqlalchemy.orm import Session
# from app.models.batch import Batch
# from app.models.batch_member import BatchMember
# from app.models.tanker import Tanker
# from app.services.batch_service import get_batch_by_id, get_batch_members
# from app.services.batch_scoring_service import calculate_batch_health_score


# def build_next_action_hint(status: str, remaining_volume: float, paid_member_count: int) -> str:
#     if status == "forming":
#         return f"Waiting for more members to join. {remaining_volume:.0f}L remaining."
#     if status == "near_ready":
#         return f"Batch is close to dispatch. {remaining_volume:.0f}L remaining."
#     if status == "ready_for_assignment":
#         return "Batch is ready. Looking for the best tanker."
#     if status == "assigned":
#         return "Tanker assigned. Waiting for driver to begin loading."
#     if status == "loading":
#         return "Driver is loading water for delivery."
#     if status == "delivering":
#         return "Water is on the way."
#     if status == "completed":
#         return "Batch delivery completed successfully."
#     if status == "expired":
#         return "Batch expired before dispatch."
#     return "Batch status updated."


# def get_batch_delivery_plan(db: Session, batch_id: int) -> list[dict]:
#     """
#     Replace this with your real source of delivery plan if you already store it.
#     For now, fallback to a simple ordered member list.
#     """
#     members = get_batch_members(db, batch_id)

#     plan = []
#     for index, member in enumerate(members, start=1):
#         plan.append({
#             "member_id": member.id,
#             "request_id": getattr(member, "request_id", None),
#             "latitude": member.latitude,
#             "longitude": member.longitude,
#             "volume_liters": getattr(member, "volume_liters", None),
#             "sequence": index,
#         })
#     return plan


# def get_assigned_tanker_snapshot(db: Session, batch: Batch):
#     tanker_id = getattr(batch, "assigned_tanker_id", None)
#     if not tanker_id:
#         return None

#     tanker = db.query(Tanker).filter(Tanker.id == tanker_id).first()
#     if not tanker:
#         return None

#     return {
#         "tanker_id": tanker.id,
#         "driver_name": tanker.driver_name,
#         "phone": tanker.phone,
#         "tank_plate_number": tanker.tank_plate_number,
#         "status": tanker.status,
#     }


# def get_batch_live_snapshot(db: Session, batch_id: int) -> dict:
#     batch = get_batch_by_id(db, batch_id)
#     if not batch:
#         raise ValueError(f"Batch {batch_id} not found")

#     members = get_batch_members(db, batch_id)
#     member_count = len(members)

#     paid_members = [
#         m for m in members
#         if getattr(m, "payment_status", None) == "paid"
#     ]
#     paid_member_count = len(paid_members)
#     unpaid_member_count = member_count - paid_member_count

#     current_volume = float(batch.current_volume or 0)
#     target_volume = float(batch.target_volume or 0)
#     remaining_volume = max(target_volume - current_volume, 0)
#     fill_percentage = (current_volume / target_volume * 100) if target_volume > 0 else 0

#     # Assuming your scoring service returns a dict like:
#     # {
#     #   "fill_ratio": ...,
#     #   "payment_ratio": ...,
#     #   "geo_compactness": ...,
#     #   "wait_urgency": ...,
#     #   "health_score": ...
#     # }
#     health = calculate_batch_health_score(db, batch.id)

#     payment_ratio = float(health.get("payment_ratio", 0))
#     geo_compactness = float(health.get("geo_compactness", 0))
#     wait_urgency = float(health.get("wait_urgency", 0))
#     health_score = float(health.get("health_score", 0))

#     assigned_tanker = get_assigned_tanker_snapshot(db, batch)
#     delivery_plan = get_batch_delivery_plan(db, batch.id)

#     return {
#         "batch_id": batch.id,
#         "status": batch.status,
#         "current_volume": current_volume,
#         "target_volume": target_volume,
#         "fill_percentage": round(fill_percentage, 2),
#         "member_count": member_count,
#         "paid_member_count": paid_member_count,
#         "unpaid_member_count": unpaid_member_count,
#         "remaining_volume": round(remaining_volume, 2),
#         "payment_ratio": round(payment_ratio, 2),
#         "geo_compactness": round(geo_compactness, 2),
#         "wait_urgency": round(wait_urgency, 2),
#         "health_score": round(health_score, 2),
#         "search_radius_km": getattr(batch, "search_radius_km", None),
#         "assigned_tanker": assigned_tanker,
#         "delivery_plan": delivery_plan,
#         "next_action_hint": build_next_action_hint(
#             batch.status,
#             remaining_volume,
#             paid_member_count,
#         ),
#     }