import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from .api.v1 import admin, auth, conversations, documents, knowledge, public, sources
from .config import get_settings
from .database import SessionLocal, init_db
from .models import AuditLog
from .services.security import decode_access_token

settings = get_settings()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    openapi_url="/api/v1/openapi.json",
    docs_url="/docs",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials="*" not in settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_audit(request: Request, call_next):
    request_id = request.headers.get("x-request-id", str(uuid.uuid4()))
    response = None
    error = None
    try:
        response = await call_next(request)
        return response
    except Exception as exc:
        error = str(exc)
        raise
    finally:
        should_audit = request.method in {
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
        } or request.url.path.endswith("/download")
        if should_audit:
            actor_id = None
            authorization = request.headers.get("authorization", "")
            if authorization.lower().startswith("bearer "):
                try:
                    actor_id = decode_access_token(authorization.split(" ", 1)[1])
                except Exception:
                    pass
            async with SessionLocal() as db:
                db.add(
                    AuditLog(
                        id=str(uuid.uuid4()),
                        request_id=request_id,
                        actor_user_id=actor_id,
                        action=f"{request.method} {request.url.path}",
                        resource_type="API",
                        resource_id=None,
                        result="SUCCESS" if response and response.status_code < 400 else "FAILED",
                        error_message=error,
                        ip_address=request.client.host if request.client else None,
                        user_agent=request.headers.get("user-agent"),
                    )
                )
                await db.commit()
        if response:
            response.headers["x-request-id"] = request_id


@app.get("/health", tags=["System"])
async def health() -> dict[str, str]:
    return {
        "status": "ok",
        "database": "postgresql" if settings.database_url.startswith("postgresql") else "sqlite",
        "storage": settings.storage_backend,
        "ai_provider": settings.ai_provider,
    }


app.include_router(auth.router, prefix="/api/v1")
app.include_router(conversations.router, prefix="/api/v1")
app.include_router(conversations.message_router, prefix="/api/v1")
app.include_router(documents.router, prefix="/api/v1")
app.include_router(knowledge.router, prefix="/api/v1")
app.include_router(sources.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(public.router, prefix="/api/v1")
