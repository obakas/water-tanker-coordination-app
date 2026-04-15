# app/api/routes/admin_auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import create_access_token, verify_password
from app.models.admin_user import AdminUser
from app.schemas.admin_auth import AdminLoginRequest, AdminTokenResponse, AdminMeResponse
from app.api.deps import get_current_admin_user

router = APIRouter(prefix="/admin-auth", tags=["admin-auth"])


@router.post("/login", response_model=AdminTokenResponse)
def admin_login(payload: AdminLoginRequest, db: Session = Depends(get_db)):
    admin = db.query(AdminUser).filter(AdminUser.username == payload.username).first()

    if not admin or not verify_password(payload.password, admin.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin credentials",
        )

    if not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin account is inactive",
        )

    token = create_access_token(
        {
            "sub": str(admin.id),
            "username": admin.username,
            "role": admin.role,
            "type": "admin",
        }
    )

    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=AdminMeResponse)
def admin_me(current_admin: AdminUser = Depends(get_current_admin_user)):
    return current_admin