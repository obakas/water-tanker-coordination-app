from pydantic import BaseModel

class PaymentCreate(BaseModel):
    user_id: str
    batch_id: str
    amount: float