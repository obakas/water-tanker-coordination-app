from app.core.database import SessionLocal
from app.models.admin_user import AdminUser
from app.core.security import hash_password

db = SessionLocal()

username = "admin"
password = "123"

admin = db.query(AdminUser).filter(AdminUser.username == username).first()

if admin:
    admin.hashed_password = hash_password(password)
    admin.is_active = True
    print("Admin reset.")
else:
    admin = AdminUser(
        username="admin",
        email="admin@example.com",
        hashed_password=hash_password(password),
        role="superadmin",
        is_active=True
    )
    db.add(admin)
    print("Admin created.")

db.commit()
db.close()