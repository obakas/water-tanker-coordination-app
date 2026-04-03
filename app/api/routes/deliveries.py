from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.delivery import (
    ConfirmOtpIn,
    DeliveryOut,
    FailDeliveryIn,
    FinishMeasurementIn,
    SkipDeliveryIn,
    StartMeasurementIn,
    TankerCurrentStopResponse,
)
from app.services.delivery_service import (
    arrive_delivery_stop,
    complete_delivery_stop,
    confirm_delivery_otp,
    fail_delivery_stop,
    finish_measurement,
    get_current_delivery_for_tanker,
    skip_delivery_stop,
    start_measurement,
)

router = APIRouter(prefix="/deliveries", tags=["Deliveries"])


# @router.get("/tankers/{tanker_id}/current-stop")
# def get_tanker_current_stop(
#     tanker_id: int,
#     db: Session = Depends(get_db),
# ):
#     """
#     Get the current active delivery stop for a tanker.
#     Useful for a backend-driven driver UI.
#     """
#     result = get_current_delivery_for_tanker(db, tanker_id)

#     current_delivery = result.get("current_delivery")

#     return {
#         "tanker_id": result["tanker_id"],
#         "remaining_stops": result["remaining_stops"],
#         "allowed_actions": result["allowed_actions"],
#         "current_delivery": DeliveryOut.model_validate(current_delivery).model_dump()
#         if current_delivery
#         else None,
#         "message": result.get("message"),
#     }

@router.get(
    "/tankers/{tanker_id}/current-stop",
    response_model=TankerCurrentStopResponse,
)
def get_tanker_current_stop(
    tanker_id: int,
    db: Session = Depends(get_db),
):
    """
    Driver polling endpoint.
    Returns tanker meta, job meta, current stop, allowed actions,
    and stop summary for the active job.
    """
    return get_current_delivery_for_tanker(db, tanker_id)


@router.post("/{delivery_id}/arrive")
def arrive_at_delivery_stop(
    delivery_id: int,
    tanker_id: int,
    db: Session = Depends(get_db),
):
    """
    Mark that the tanker has arrived at the stop.
    tanker_id is passed as a query param for now.
    Example:
      POST /deliveries/5/arrive?tanker_id=2
    """
    delivery = arrive_delivery_stop(
        db,
        tanker_id=tanker_id,
        delivery_id=delivery_id,
    )

    return {
        "message": "Arrived at delivery stop",
        "delivery": DeliveryOut.model_validate(delivery).model_dump(),
    }


@router.post("/{delivery_id}/start-measurement")
def begin_measurement(
    delivery_id: int,
    payload: StartMeasurementIn,
    tanker_id: int,
    db: Session = Depends(get_db),
):
    """
    Start meter measurement for a stop.
    """
    delivery = start_measurement(
        db,
        tanker_id=tanker_id,
        delivery_id=delivery_id,
        meter_start_reading=payload.meter_start_reading,
    )

    return {
        "message": "Measurement started",
        "delivery": DeliveryOut.model_validate(delivery).model_dump(),
    }


@router.post("/{delivery_id}/finish-measurement")
def end_measurement(
    delivery_id: int,
    payload: FinishMeasurementIn,
    tanker_id: int,
    db: Session = Depends(get_db),
):
    """
    Finish meter measurement and move stop to awaiting_otp.
    """
    delivery = finish_measurement(
        db,
        tanker_id=tanker_id,
        delivery_id=delivery_id,
        meter_end_reading=payload.meter_end_reading,
        notes=payload.notes,
    )

    return {
        "message": "Measurement completed. Waiting for customer OTP.",
        "delivery": DeliveryOut.model_validate(delivery).model_dump(),
    }


@router.post("/{delivery_id}/confirm-otp")
def verify_delivery_otp(
    delivery_id: int,
    payload: ConfirmOtpIn,
    tanker_id: int,
    db: Session = Depends(get_db),
):
    """
    Confirm the customer OTP for this stop.
    """
    delivery = confirm_delivery_otp(
        db,
        tanker_id=tanker_id,
        delivery_id=delivery_id,
        otp_code=payload.otp_code,
    )

    return {
        "message": "Delivery OTP verified successfully",
        "delivery": DeliveryOut.model_validate(delivery).model_dump(),
    }


@router.post("/{delivery_id}/complete")
def complete_stop(
    delivery_id: int,
    tanker_id: int,
    db: Session = Depends(get_db),
):
    """
    Complete the delivery stop after OTP verification.
    This may also finalize the whole batch/priority job if all stops are resolved.
    """
    result = complete_delivery_stop(
        db,
        tanker_id=tanker_id,
        delivery_id=delivery_id,
        auto_finalize_job=True,
    )

    return {
        "message": result["message"],
        "delivery": DeliveryOut.model_validate(result["delivery"]).model_dump(),
        "finalize_result": result.get("finalize_result"),
    }


@router.post("/{delivery_id}/fail")
def fail_stop(
    delivery_id: int,
    payload: FailDeliveryIn,
    tanker_id: int,
    db: Session = Depends(get_db),
):
    """
    Mark a stop as failed.
    """
    result = fail_delivery_stop(
        db,
        tanker_id=tanker_id,
        delivery_id=delivery_id,
        reason=payload.reason,
    )

    return {
        "message": result["message"],
        "delivery": DeliveryOut.model_validate(result["delivery"]).model_dump(),
        "finalize_result": result.get("finalize_result"),
    }


@router.post("/{delivery_id}/skip")
def skip_stop(
    delivery_id: int,
    payload: SkipDeliveryIn,
    tanker_id: int,
    db: Session = Depends(get_db),
):
    """
    Mark a stop as skipped.
    """
    result = skip_delivery_stop(
        db,
        tanker_id=tanker_id,
        delivery_id=delivery_id,
        reason=payload.reason,
    )

    return {
        "message": result["message"],
        "delivery": DeliveryOut.model_validate(result["delivery"]).model_dump(),
        "finalize_result": result.get("finalize_result"),
    }