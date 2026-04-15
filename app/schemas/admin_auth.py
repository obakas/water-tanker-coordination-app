# app/schemas/admin_auth.py
from pydantic import BaseModel


class AdminLoginRequest(BaseModel):
    username: str
    password: str


class AdminTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AdminMeResponse(BaseModel):
    id: int
    username: str
    email: str | None = None
    role: str
    is_active: bool