from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent 

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./test.db"
    # DATABASE_URL: str = " "
    SECRET_KEY: str = "change-me"
    ADMIN_SECRET: str = "change-me"
    PAYMENT_PROVIDER: str = "paystack"
    FRONTEND_URL: str = "http://localhost:5173"

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 8  # 8 hours
    JWT_ALGORITHM: str = "HS256"

    model_config = SettingsConfigDict(
        # env_file=".env",
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
