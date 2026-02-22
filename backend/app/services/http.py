"""Shared retry configuration for external HTTP calls.

Provides a tenacity-based retry decorator for transient HTTP errors:
  - 429 rate limit
  - 5xx server errors
  - Network timeouts and connection failures

Usage:
    from app.services.http import api_retry

    @api_retry
    async def call_external_api(...):
        ...
"""

import logging

import httpx
from tenacity import (
    before_sleep_log,
    retry,
    retry_if_exception,
    stop_after_attempt,
    wait_exponential,
)

logger = logging.getLogger(__name__)


def _is_retryable(exc: BaseException) -> bool:
    """Return True for transient HTTP errors worth retrying."""
    if isinstance(exc, httpx.HTTPStatusError):
        return exc.response.status_code in {429, 500, 502, 503, 504}
    return isinstance(
        exc,
        (
            httpx.ConnectError,
            httpx.ReadTimeout,
            httpx.WriteTimeout,
            httpx.PoolTimeout,
            httpx.ConnectTimeout,
        ),
    )


api_retry = retry(
    retry=retry_if_exception(_is_retryable),
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    before_sleep=before_sleep_log(logger, logging.WARNING),
    reraise=True,
)
