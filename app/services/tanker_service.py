from app.models.tanker import Tanker
from app.models.batch import Batch

def assign_tanker(db, batch: Batch):
    tanker = db.query(Tanker).filter(
        Tanker.status == "idle",
        Tanker.capacity >= batch.target_volume
    ).first()

    if not tanker:
        print("No tanker available")
        return None

    tanker.status = "busy"
    batch.status = "assigned"
    batch.tanker_id = tanker.id

    db.commit()

    print(f"Tanker {tanker.id} assigned to batch {batch.id}")

    return tanker