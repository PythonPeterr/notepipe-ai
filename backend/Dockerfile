FROM python:3.12-slim

# Copy uv binary from official image
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Install deps first (cached layer — only re-runs when pyproject.toml or uv.lock changes)
COPY pyproject.toml uv.lock ./
RUN uv sync --locked --no-dev --no-install-project

# Copy source and install project
COPY . .
RUN uv sync --locked --no-dev

# Railway injects PORT env var; default to 8000
# Use 2 workers for concurrency (Railway starter plan has 512MB-1GB RAM)
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
