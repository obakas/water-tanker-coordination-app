# app/core/scheduler.py

from apscheduler.schedulers.background import BackgroundScheduler
from app.core.database import SessionLocal
from app.services.batch_monitor_service import process_all_active_batches

scheduler = BackgroundScheduler()


def run_batch_monitor():
    db = SessionLocal()
    try:
        results = process_all_active_batches(db)
        print("Batch monitor tick:")
        for item in results:
            print(item)
    finally:
        db.close()


def start_scheduler():
    if not scheduler.running:
        scheduler.add_job(
            run_batch_monitor,
            trigger="interval",
            seconds=60,
            id="batch_monitor_job",
            replace_existing=True,
        )
        scheduler.start()


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()