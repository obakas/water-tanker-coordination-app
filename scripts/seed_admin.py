# scripts/seed_admin.py
from app.core.database import SessionLocal
from app.models.admin_user import AdminUser
from app.core.security import hash_password

db = SessionLocal()

username = "admin"
password = "123"

existing = db.query(AdminUser).filter(AdminUser.username == username).first()
if not existing:
    admin = AdminUser(
        username=username,
        email="admin@example.com",
        hashed_password=hash_password(password),
        role="superadmin",
        is_active=True,
    )
    db.add(admin)
    db.commit()
    print("Admin created.")
else:
    print("Admin already exists.")

db.close()