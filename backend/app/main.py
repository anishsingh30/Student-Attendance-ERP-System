from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy.exc import SQLAlchemyError
from app.core.config import settings
from app.core.database import Base, engine
from app.core.error_handlers import (
    http_exception_handler,
    validation_exception_handler,
    sqlalchemy_exception_handler,
    generic_exception_handler
)
from app.api import auth, students, faculty, attendance, agent, alerts, notifications, ai, admin, reports, scheduler, ml, public
from app.services.scheduler_service import attendance_scheduler

import logging

logger = logging.getLogger("attendance.main")

# Application lifespan: manage scheduler background tasks & database initialization
@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.ENVIRONMENT == "development":
        # Development convenience: ensure SQLite tables exist for local testing
        Base.metadata.create_all(bind=engine)
    else:
        logger.info("Production mode: schema management governed via Alembic migrations.")

    attendance_scheduler.start()
    yield
    attendance_scheduler.stop()


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Agentic AI-based automated attendance monitoring, risk prediction, recovery calculation, and smart alert platform for colleges.",
    version="2.0.0",
    lifespan=lifespan
)

# Exception handlers (Secure Error Handling: No raw stack traces exposed to users)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(SQLAlchemyError, sqlalchemy_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request, Response

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        if settings.SECURITY_HEADERS_ENABLED:
            response.headers["X-Content-Type-Options"] = "nosniff"
            response.headers["X-Frame-Options"] = "DENY"
            response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
            response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
            
            if settings.is_production:
                # Production CSP: Strictly hardened, zero 'unsafe-inline' and zero 'unsafe-eval' in script-src
                csp = (
                    "default-src 'self'; "
                    "script-src 'self'; "
                    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
                    "font-src 'self' https://fonts.gstatic.com data:; "
                    "img-src 'self' data: https: /uploads/ blob:; "
                    "connect-src 'self' https:; "
                    "frame-ancestors 'none'; "
                    "object-src 'none'; "
                    "base-uri 'self'; "
                    "form-action 'self';"
                )
            else:
                # Development CSP: Preserves Vite HMR, local websocket live-reload, and dev tooling
                csp = (
                    "default-src 'self'; "
                    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
                    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
                    "font-src 'self' https://fonts.gstatic.com data:; "
                    "img-src 'self' data: https: /uploads/ blob:; "
                    "connect-src 'self' http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:* https:; "
                    "frame-ancestors 'none'; "
                    "object-src 'none'; "
                    "base-uri 'self';"
                )
            response.headers["Content-Security-Policy"] = csp
            if settings.is_production or request.url.scheme == "https":
                response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

app.add_middleware(SecurityHeadersMiddleware)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Static files for user avatars / assets
import os
from fastapi.staticfiles import StaticFiles

uploads_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(uploads_path, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_path), name="uploads")

# Include Routers
app.include_router(public.router, prefix=settings.API_V1_STR)
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(students.router, prefix=settings.API_V1_STR)
app.include_router(faculty.router, prefix=settings.API_V1_STR)
app.include_router(attendance.router, prefix=settings.API_V1_STR)
app.include_router(agent.router, prefix=settings.API_V1_STR)
app.include_router(alerts.router, prefix=settings.API_V1_STR)
app.include_router(notifications.router, prefix=settings.API_V1_STR)
app.include_router(ai.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)
app.include_router(scheduler.router, prefix=settings.API_V1_STR)
app.include_router(ml.router, prefix=settings.API_V1_STR)

from fastapi.responses import JSONResponse
from sqlalchemy import text
from app.core.database import SessionLocal
from app.ml.predictor import ml_predictor
from app.agents.llm_provider import llm_provider

@app.get("/")
def root():
    return {
        "project": settings.PROJECT_NAME,
        "status": "online",
        "docs_url": "/docs",
        "api_v1": settings.API_V1_STR,
        "security": "Enforced independently of LLM"
    }

@app.get("/health")
def health_liveness():
    return {
        "status": "alive",
        "environment": settings.ENVIRONMENT,
        "version": "2.1.0"
    }

@app.get("/ready")
def health_readiness():
    """Deep readiness probe checking database, scheduler, ML pipeline, and LLM provider."""
    checks = {}
    is_ready = True

    # 1. Database check
    db = None
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        checks["database"] = {"status": "healthy", "engine": "connected"}
    except Exception as e:
        is_ready = False
        checks["database"] = {"status": "unhealthy", "error": "Database connection failed"}
    finally:
        if db:
            db.close()

    # 2. Scheduler check
    checks["scheduler"] = {
        "status": "running" if attendance_scheduler.is_running else "stopped",
        "interval_hours": attendance_scheduler.interval_hours
    }

    # 3. ML Model check
    ml_status = ml_predictor.get_metrics()
    checks["ml_pipeline"] = {
        "status": "active" if ml_status.get("status") != "NOT_TRAINED" else "uninitialized",
        "model_version": ml_status.get("model_version", "v2.1.0"),
        "algorithm": ml_status.get("algorithm", "RandomForestClassifier")
    }

    # 4. LLM Engine check
    llm_info = llm_provider.get_status_info()
    checks["ai_engine"] = {
        "provider": llm_info.get("active_provider"),
        "is_mock_fallback": llm_info.get("is_mock_fallback")
    }

    # 5. Email Notifications check
    checks["notifications"] = {
        "in_app": "enabled",
        "smtp_email": "configured" if bool(settings.SMTP_HOST) else "unconfigured_logged_only"
    }

    status_code = 200 if is_ready else 503
    return JSONResponse(
        status_code=status_code,
        content={
            "status": "ready" if is_ready else "not_ready",
            "dependencies": checks
        }
    )

