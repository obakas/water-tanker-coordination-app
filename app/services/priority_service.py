from app.models.batch import Batch
from app.models.batch_member import BatchMember
from app.models.tanker import Tanker
from fastapi import HTTPException


def handle_priority_request(db, request):
    tanker = (
        db.query(Tanker)
        .filter(Tanker.is_available == True)
        .filter(Tanker.status == "available")
        .first()
    )

    if not tanker:
        raise HTTPException(
            status_code=404,
            detail="No available tanker found for priority delivery"
        )

    tanker.is_available = False
    tanker.status = "assigned"

    batch = Batch(
        area_name="Priority Delivery",
        total_volume_liters=request.volume_liters,
        tanker_id=tanker.id,
        status="assigned",
    )
    db.add(batch)
    db.commit()
    db.refresh(batch)

    member = BatchMember(
        batch_id=batch.id,
        request_id=request.id,
        payment_status="pending",
    )
    db.add(member)
    db.commit()
    db.refresh(member)

    return {
        "batch": batch,
        "member": member,
    }