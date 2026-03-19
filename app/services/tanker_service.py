from datetime import datetime, timedelta
from app.models import batch
from app.models.tanker import Tanker
from app.models.batch import Batch
from app.schemas import batch
from app.models.batch_member import BatchMember
from app.utils.location import haversine
from sqlalchemy.orm import Session

def assign_tanker_multi_batch(db):
    # Get available tankers
    tankers = db.query(Tanker).filter(Tanker.status == "available").all()
    if not tankers:
        print("No available tankers")
        return None

    # Get batches with confirmed members and not assigned yet
    batches = db.query(Batch).filter(
        Batch.status.in_(["ready", "partial"]),
        Batch.tanker_id.is_(None)
    ).all()

    if not batches:
        print("No batches to assign")
        return None

    # Pick the closest tanker to the first batch
    closest_tanker = min(
        tankers,
        key=lambda t: min(
            haversine(t.longitude, t.latitude, b.longitude, b.latitude)
            for b in batches
        )
    )

    # closest_tanker.status = "busy"
    # db.commit()
    # print(f"Assigned Tanker {closest_tanker.id} to multiple batches")
    
    # 👇 NEW FLOW STARTS HERE
    closest_tanker.status = "assigned"
    batch.tanker_id = closest_tanker.id
    batch.status = "assigned"

    # ⏳ Give tanker time to fill water
    batch.loading_deadline = datetime.utcnow() + timedelta(minutes=45)


    # Build multi-batch route
    route = []
    unvisited_batches = batches.copy()
    current_lon, current_lat = closest_tanker.longitude, closest_tanker.latitude

    while unvisited_batches:
        # Pick nearest batch
        next_batch = min(
            unvisited_batches,
            key=lambda b: haversine(current_lon, current_lat, b.longitude, b.latitude)
        )
        unvisited_batches.remove(next_batch)
        next_batch.tanker_id = closest_tanker.id
        db.commit()

        # Add its confirmed members using greedy within-batch delivery
        members = db.query(BatchMember).filter(
            BatchMember.batch_id == next_batch.id,
            BatchMember.status == "confirmed"
        ).all()

        ordered_members = optimize_delivery_order(current_lon, current_lat, members)
        route.extend(ordered_members)

        # Update current location to last member or batch center if no members
        if ordered_members:
            current_lon, current_lat = ordered_members[-1].longitude, ordered_members[-1].latitude
        else:
            current_lon, current_lat = next_batch.longitude, next_batch.latitude

    print("Full multi-batch delivery order:")
    for i, member in enumerate(route):
        print(f"Stop {i+1}: Member {member.id} (Batch {member.batch_id})")

    return closest_tanker


def optimize_delivery_order(start_lon, start_lat, members):
    """Greedy nearest-neighbor route for members starting from given coordinates."""
    unvisited = members.copy()
    route = []
    current_lon, current_lat = start_lon, start_lat

    while unvisited:
        next_member = min(
            unvisited,
            key=lambda m: haversine(current_lon, current_lat, m.longitude, m.latitude)
        )
        route.append(next_member)
        current_lon, current_lat = next_member.longitude, next_member.latitude
        unvisited.remove(next_member)

    return route


def mark_batch_delivered(db, batch_id):
    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not batch:
        raise Exception("Batch not found")

    batch.status = "completed"
    members = db.query(BatchMember).filter(BatchMember.batch_id == batch.id).all()
    for m in members:
        if m.status == "confirmed":
            m.status = "delivered"
    db.commit()
    return {"message": f"Batch {batch_id} marked as delivered"}


def pay_tanker(db, tanker_id):
    tanker = db.query(Tanker).filter(Tanker.id == tanker_id).first()
    if not tanker:
        raise Exception("Tanker not found")

    total_delivered_volume = sum(
        m.volume_liters for m in db.query(BatchMember)
        .filter(BatchMember.status == "delivered", BatchMember.batch.has(tanker_id=tanker_id))
        .all()
    )

    payment_amount = total_delivered_volume * 1.5  # e.g., 1.5/unit as rate
    tanker.status = "available"  # Ready for next assignment
    db.commit()
    return {"tanker_id": tanker.id, "amount": payment_amount, "status": "paid"}


def confirm_delivery(db: Session, tanker_id: int, batch_id: int):
    # Mark all members in the batch as delivered
    members = db.query(BatchMember).filter(
        BatchMember.batch_id == batch_id,
        BatchMember.status == "confirmed"
    ).all()

    for m in members:
        m.status = "delivered"

    db.commit()

    # Automatically pay the tanker
    pay_tanker_internal(db, tanker_id)


def pay_tanker_internal(db: Session, tanker_id: int):
    tanker = db.query(Tanker).filter(Tanker.id == tanker_id).first()
    if not tanker:
        raise Exception("Tanker not found")

    delivered_members = db.query(BatchMember).filter(
        BatchMember.status == "delivered",
        BatchMember.batch.has(tanker_id=tanker_id)
    ).all()

    total_volume = sum(m.volume_liters for m in delivered_members)
    rate_per_liter = 1.5  # Example rate
    payment_amount = total_volume * rate_per_liter

    # Mark tanker as available
    tanker.status = "available"
    db.commit()

    return {
        "tanker_id": tanker.id,
        "total_volume": total_volume,
        "payment_amount": payment_amount,
        "status": "paid"
    }


