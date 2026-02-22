"""FastAPI application entry point with CORS, rate limiting, and router registration."""

import logging
import traceback

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.config import get_settings
from app.routers import account, actions, auth, connections, dashboard, prompts, runs, uploads, users, webhooks

# Maximum request body size: 15 MB (file uploads are 10MB max + overhead)
MAX_BODY_SIZE = 15 * 1024 * 1024

logger = logging.getLogger(__name__)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

# ---------------------------------------------------------------------------
# Rate limiter (shared instance — import in routers via app.state.limiter)
# ---------------------------------------------------------------------------

limiter = Limiter(key_func=get_remote_address, default_limits=["120/minute"])

app = FastAPI(
    title="Notepipe API",
    description="Post-meeting CRM automation. Fireflies -> Claude -> HubSpot/Pipedrive.",
    version="0.1.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ---------------------------------------------------------------------------
# Global exception handler — prevent internal details from leaking
# ---------------------------------------------------------------------------


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch all unhandled exceptions and return a safe 500 response.

    Logs the full traceback for debugging while returning a generic
    message to the client.
    """
    logger.error(
        "Unhandled exception on %s %s: %s\n%s",
        request.method,
        request.url.path,
        exc,
        traceback.format_exc(),
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal error occurred. Please try again later."},
    )


# ---------------------------------------------------------------------------
# CORS — allow the frontend origin
# ---------------------------------------------------------------------------

settings = get_settings()

origins = [settings.frontend_url]
if "localhost" in settings.frontend_url:
    origins.extend(["http://localhost:3000", "http://localhost:3001"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# ---------------------------------------------------------------------------
# Request body size limit
# ---------------------------------------------------------------------------


@app.middleware("http")
async def limit_request_size(request: Request, call_next):  # type: ignore[no-untyped-def]
    """Reject requests with bodies larger than MAX_BODY_SIZE to prevent DoS."""
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > MAX_BODY_SIZE:
        return JSONResponse(
            status_code=413, content={"detail": "Request body too large"}
        )
    return await call_next(request)


# ---------------------------------------------------------------------------
# Register routers
# ---------------------------------------------------------------------------

api_prefix = "/api"
app.include_router(account.router, prefix=api_prefix)
app.include_router(auth.router, prefix=api_prefix)
app.include_router(webhooks.router, prefix=api_prefix)
app.include_router(connections.router, prefix=api_prefix)
app.include_router(dashboard.router, prefix=api_prefix)
app.include_router(prompts.router, prefix=api_prefix)
app.include_router(actions.router, prefix=api_prefix)
app.include_router(runs.router, prefix=api_prefix)
app.include_router(uploads.router, prefix=api_prefix)
app.include_router(users.router, prefix=api_prefix)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------


@app.get("/health")
async def health() -> dict[str, str]:
    """Health check endpoint for Railway and monitoring."""
    return {"status": "ok"}
