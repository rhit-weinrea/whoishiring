from pydantic_settings import BaseSettings
from functools import lru_cache


class EnvironmentConfig(BaseSettings):
    DATABASE_URL: str
    DATABASE_URL_SYNC: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days by default
    DEEPSEEK_API_KEY: str
    DEEPSEEK_API_URL: str = "https://api.deepseek.com/v1/chat/completions"
    DEEPSEEK_MODEL: str = "deepseek-chat"
    HN_API_BASE_URL: str = "https://hacker-news.firebaseio.com/v0"
    APP_NAME: str = "HN Job Board API"
    APP_VERSION: str = "1.0.0"
    DEBUG_MODE: bool = True
    CORS_ORIGINS: str = "https://who-is-hiring.com,https://www.who-is-hiring.com,https://main.d1j1xagueqmavc.amplifyapp.com,http://localhost:3000,http://localhost:5173"
    ADMIN_API_KEY: str = "default_value"
    GEOCODER_USER_AGENT: str = "hn-job-board"
    SMTP_HOST: str | None = None
    SMTP_PORT: int = 587
    SMTP_USERNAME: str | None = None
    SMTP_PASSWORD: str | None = None
    SMTP_FROM_EMAIL: str | None = None
    SMTP_USE_TLS: bool = True
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def fetch_environment_config() -> EnvironmentConfig:
    return EnvironmentConfig()
