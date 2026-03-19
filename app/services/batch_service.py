from sqlalchemy.orm import Session
from app.models.batch import Batch
from app.models.request import LiquidRequest
from app.models.batch_member import BatchMember
from app.services.tanker_service import assign_tanker
from datetime import datetime, timedelta
from math import radians, cos, sin, asin, sqrt
RADIUS_KM = 1

# def find_or_create_batch(db: Session, request: LiquidRequest):
#     print("Incoming request:", request.id, request.volume_liters)
#     batches = db.query(Batch).filter(
#         Batch.liquid_id == request.liquid_id,
#         Batch.status == "forming"
#     ).all()

#     print("Found batches:", len(batches))
#     for batch in batches:
#         print("Checking batch:", batch.id, batch.current_volume, "/", batch.target_volume)
#         if batch.current_volume + request.volume_liters <= batch.target_volume:
#             print("Adding to existing batch:", batch.id)
#             return attach_request_to_batch(db, batch, request)

#             # return add_to_batch(db, batch, request)

#     print("Creating new batch")
#     return create_new_batch_with_request(db, request)
#     # return create_new_batch(db, request)

def create_new_batch_with_request(db, request):
    batch = Batch(
        liquid_id=request.liquid_id,
        current_volume=0,  # IMPORTANT
        latitude=request.latitude,
        longitude=request.longitude,
        status="forming"
    )

    db.add(batch)
    db.commit()
    db.refresh(batch)

    member = reserve_member_slot(db, batch, request)

    return {
        "batch": batch,
        "member": member
    }

def attach_request_to_batch(db, batch, request):

    member = reserve_member_slot(db, batch, request)

    return {
        "batch": batch,
        "member": member
    }


def reserve_member_slot(db, batch, request):

    member = BatchMember(
        batch_id=batch.id,
        request_id=request.id,
        user_id=request.user_id,
        volume_liters=request.volume_liters,
        status="pending",
        payment_status="unpaid",
        payment_deadline=datetime.utcnow() + timedelta(minutes=10)
    )

    db.add(member)
    db.commit()
    db.refresh(member)

    return member

# def create_new_batch(db, request):
#     batch = Batch(
#         liquid_id=request.liquid_id,
#         current_volume=0,
#         # current_volume=request.volume_liters,
#         latitude=request.latitude,
#         longitude=request.longitude,
#         status="forming"
#     )
#     db.add(batch)
#     db.commit()

#     add_member(db, batch, request)
#     return batch


# def add_to_batch(db, batch, request):
#     # batch.current_volume += request.volume_liters
    

#     add_member(db, batch, request)
#     if batch.current_volume >= batch.target_volume:
#         batch.status = "ready"
#         print(f"Batch {batch.id} is now READY")
#         assign_tanker(db, batch)
#     db.commit()
#     return batch


# def add_member(db, batch, request):
#     member = BatchMember(
#         batch_id=batch.id,
#         request_id=request.id,
#         user_id=request.user_id,
#         volume_liters=request.volume_liters,
#         status="pending",
#         payment_status="unpaid",
#         payment_deadline=datetime.utcnow() + timedelta(minutes=10)
#     )
#     db.add(member)
#     db.commit()
#     db.refresh(member)

#     return member


def cleanup_expired_members(db: Session):
    expired_members = db.query(BatchMember).filter(
        BatchMember.status == "pending",
        BatchMember.payment_deadline < datetime.utcnow()
    ).all()

    for member in expired_members:
        member.status = "cancelled"
        member.payment_status = "failed"

        # Optional: you can notify user via email / push here
        print(f"Member {member.id} cancelled due to payment expiry.")

        # Reduce batch volume only if it was pre-added (ours isn’t yet, so skip)
        # batch = db.query(Batch).filter(Batch.id == member.batch_id).first()
        # batch.current_volume -= member.volume_liters

    db.commit()



def haversine(lon1, lat1, lon2, lat2):
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees)
    Returns distance in kilometers
    """
    # convert decimal degrees to radians 
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])

    # haversine formula 
    dlon = lon2 - lon1 
    dlat = lat2 - lat1 
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a)) 
    km = 6371 * c
    return km


def find_or_create_batch(db: Session, request: LiquidRequest):
    print("Incoming request:", request.id, request.volume_liters)
    batches = db.query(Batch).filter(
        Batch.liquid_id == request.liquid_id,
        Batch.status == "forming"
    ).all()

    print("Found batches:", len(batches))
    for batch in batches:
        distance = haversine(
            batch.longitude, batch.latitude,
            request.longitude, request.latitude
        )
        print(f"Batch {batch.id} distance: {distance:.1f} km")

        if distance <= RADIUS_KM:
            # Check if volume fits
            if batch.current_volume + request.volume_liters <= batch.target_volume:
                print("Adding to existing nearby batch:", batch.id)
                return attach_request_to_batch(db, batch, request)

    print("Creating new batch")
    return create_new_batch_with_request(db, request)


def update_batch_center(db, batch):
    members = db.query(BatchMember).filter(
        BatchMember.batch_id == batch.id,
        BatchMember.status == "confirmed"
    ).all()
    if not members:
        return
    avg_lat = sum(m.latitude for m in members) / len(members)
    avg_lon = sum(m.longitude for m in members) / len(members)
    batch.latitude = avg_lat
    batch.longitude = avg_lon
    db.commit()