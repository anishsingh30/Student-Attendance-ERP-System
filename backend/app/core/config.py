import os
import secrets
import logging
from pathlib import Path
from typing import List, Optional
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger("attendance.config")

# Robust .env file loading: locate backend root and workspace root
BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent
_ENV_PATHS = [
    BACKEND_ROOT / ".env",
    BACKEND_ROOT.parent / ".env"
]
for p in _ENV_PATHS:
    if p.exists():
        load_dotenv(dotenv_path=p, override=False)

INSECURE_SECRET_PLACEHOLDERS = {
    "your-secret-production-key...",
    "change-me",
    "secret",
    "password",
    "dev-secret",
    "replace-with-a-secure-random-secret-key-in-production",
    "prod-session-key-attendance-erp-secure-2026",
    "replace_with_a_secure_random_secret",
    "replace-with-a-secure-random-secret",
    "super-secret-production-key-for-attendance-ai-2026"
}

def _resolve_secret_key(raw_key: Optional[str] = None, raw_env: Optional[str] = None) -> str:
    env = (raw_env or os.getenv("ENVIRONMENT", "development")).lower()
    key = (raw_key or os.getenv("SECRET_KEY", "")).strip()

    is_placeholder = key.lower() in {p.lower() for p in INSECURE_SECRET_PLACEHOLDERS}

    if env == "production":
        if not key or is_placeholder or len(key) < 32:
            raise RuntimeError(
                "CRITICAL SECURITY CONFIGURATION ERROR: "
                "A cryptographically strong, non-placeholder SECRET_KEY environment variable "
                "(minimum 32 characters) is mandatory in production mode."
            )
        return key

    # Development mode
    if not key:
        dev_key = secrets.token_urlsafe(48)
        logger.warning(
            "Notice: No SECRET_KEY set in environment. Generated an ephemeral development session key. "
            "Set SECRET_KEY in .env for persistent sessions."
        )
        return dev_key
    return key


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BACKEND_ROOT / ".env") if (BACKEND_ROOT / ".env").exists() else ".env",
        extra="ignore"
    )

    PROJECT_NAME: str = "Automated Student Attendance Alert System"
    API_V1_STR: str = "/api"
    ENVIRONMENT: str = "development"
    SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database
    DATABASE_URL: str = "sqlite:///./attendance.db"
    
    # LLM Settings
    LLM_PROVIDER: str = "mock"  # "mock", "gemini", "openai"
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-flash-lite-latest"
    GEMINI_MAX_OUTPUT_TOKENS: int = 1000
    GEMINI_TEMPERATURE: float = 0.2
    GEMINI_TIMEOUT_SECONDS: int = 12
    GEMINI_RETRY_COUNT: int = 1
    
    # SMTP Email Settings
    SMTP_HOST: str = "smtp.college.edu"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "attendance-alerts@college.edu"
    EMAIL_ENABLED: bool = False

    # Automated Attendance Monitoring Scheduler
    SCHEDULER_ENABLED: bool = True
    SCHEDULER_INTERVAL_HOURS: int = 24
    SCHEDULER_IN_PROCESS: bool = True
    CRON_SECRET: str = ""

    # Default University Attendance Thresholds
    DEFAULT_THRESHOLD_GREEN: float = 80.0
    DEFAULT_THRESHOLD_YELLOW: float = 75.0
    DEFAULT_THRESHOLD_ORANGE: float = 65.0
    
    # CORS & Web Security
    CORS_ALLOWED_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000,http://localhost:8000,http://127.0.0.1:8000"
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ]
    SECURITY_HEADERS_ENABLED: bool = True

    # Rate Limiting Settings
    AUTH_RATE_LIMIT_ENABLED: bool = True
    AUTH_RATE_LIMIT_REQUESTS: int = 15
    AUTH_RATE_LIMIT_WINDOW_SECONDS: int = 60

    def model_post_init(self, __context):
        # Resolve SECRET_KEY after fields are loaded from env_file/os.environ
        resolved = _resolve_secret_key(self.SECRET_KEY, self.ENVIRONMENT)
        object.__setattr__(self, "SECRET_KEY", resolved)

        # Normalize postgres:// to postgresql:// for SQLAlchemy 2.0 / Alembic
        if self.DATABASE_URL and self.DATABASE_URL.startswith("postgres://"):
            normalized_url = self.DATABASE_URL.replace("postgres://", "postgresql://", 1)
            object.__setattr__(self, "DATABASE_URL", normalized_url)

        # In serverless environments (e.g. Vercel), disable in-process scheduler loop by default
        if os.getenv("VERCEL") == "1" or os.getenv("AWS_LAMBDA_FUNCTION_NAME"):
            object.__setattr__(self, "SCHEDULER_IN_PROCESS", False)

        # Parse CORS_ALLOWED_ORIGINS if set as comma-separated string
        if self.CORS_ALLOWED_ORIGINS:
            origins = [o.strip() for o in self.CORS_ALLOWED_ORIGINS.split(",") if o.strip()]
            if origins:
                object.__setattr__(self, "CORS_ORIGINS", origins)

    @property
    def is_secret_key_configured(self) -> bool:
        return bool(self.SECRET_KEY and len(self.SECRET_KEY) >= 16)

    @property
    def is_gemini_configured(self) -> bool:
        return bool(self.GEMINI_API_KEY and len(self.GEMINI_API_KEY) > 5)

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() == "production"


settings = Settings()
