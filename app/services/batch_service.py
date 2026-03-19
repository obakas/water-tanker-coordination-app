from sqlalchemy.orm import Session
from app.models.batch import Batch
from app.models.request import LiquidRequest
from app.models.batch_member import BatchMember

RADIUS_KM = 2

def find_or_create_batch(db: Session, request: LiquidRequest):
    batches = db.query(Batch).filter(
        Batch.liquid_id == request.liquid_id,
        Batch.status == "forming"
    ).all()

    for batch in batches:
        if batch.current_volume + request.volume_liters <= batch.target_volume:
            return add_to_batch(db, batch, request)

    return create_new_batch(db, request)


def create_new_batch(db, request):
    batch = Batch(
        liquid_id=request.liquid_id,
        current_volume=request.volume_liters,
        latitude=request.latitude,
        longitude=request.longitude,
        status="forming"
    )
    db.add(batch)
    db.commit()

    add_member(db, batch, request)
    return batch


def add_to_batch(db, batch, request):
    batch.current_volume += request.volume_liters
    db.commit()

    add_member(db, batch, request)
    return batch


def add_member(db, batch, request):
    member = BatchMember(
        batch_id=batch.id,
        request_id=request.id,
        user_id=request.user_id,
        volume_liters=request.volume_liters
    )
    db.add(member)
    db.commit()