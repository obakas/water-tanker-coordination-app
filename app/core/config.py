from pydantic import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://user:password@localhost/water_app"
    SECRET_KEY: str = "supersecret"
    PAYMENT_PROVIDER: str = "paystack"

settings = Settings()