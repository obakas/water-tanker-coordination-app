from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./test.db"
    SECRET_KEY: str = "change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 720

    # Temporary admin login. Keep this in Render env vars, not frontend.
    ADMIN_USERNAME: str = "obaka"
    ADMIN_PASSWORD: str = "123"

    PAYMENT_PROVIDER: str = "paystack"
    FRONTEND_URL: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
