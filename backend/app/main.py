"""FastAPI application entry point with CORS and router registration."""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import account, auth, connections, dashboard, runs, templates, users, webhooks

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

app = FastAPI(
    title="Notepipe API",
    description="Post-meeting CRM automation. Fireflies -> Claude -> HubSpot/Pipedrive.",
    version="0.1.0",
)

# ---------------------------------------------------------------------------
# CORS — allow the frontend origin
# ---------------------------------------------------------------------------

settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Register routers
# ---------------------------------------------------------------------------

api_prefix = "/api"
app.include_router(account.router, prefix=api_prefix)
app.include_router(auth.router, prefix=api_prefix)
app.include_router(webhooks.router, prefix=api_prefix)
app.include_router(connections.router, prefix=api_prefix)
app.include_router(dashboard.router, prefix=api_prefix)
app.include_router(templates.router, prefix=api_prefix)
app.include_router(runs.router, prefix=api_prefix)
app.include_router(users.router, prefix=api_prefix)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/health")
async def health() -> dict[str, str]:
    """Health check endpoint for Railway and monitoring."""
    return {"status": "ok"}
