"""Typed exception hierarchy for pptx.dev SDK errors.

Mirrors ``@pptx/sdk`` for TypeScript. All errors inherit from
:class:`PptxError` and expose ``request_id`` when the server returned an
``X-Request-Id`` response header.
"""

from __future__ import annotations

from typing import Any


class PptxError(Exception):
    """Base class for all pptx.dev SDK errors."""


class PptxNetworkError(PptxError):
    """Raised when the underlying HTTP client fails (DNS, TLS, timeout, abort)."""

    def __init__(self, message: str, cause: BaseException | None = None) -> None:
        super().__init__(message)
        self.__cause__ = cause


class PptxApiError(PptxError):
    """Raised for non-2xx HTTP responses from the pptx.dev API."""

    def __init__(
        self,
        message: str,
        status: int,
        body: dict[str, Any] | str | None,
        request_id: str | None = None,
    ) -> None:
        super().__init__(message)
        self.status = status
        self.body = body
        envelope = body.get("error") if isinstance(body, dict) else None
        if not isinstance(envelope, dict):
            envelope = {}
        raw_code = envelope.get("code")
        raw_request_id = envelope.get("requestId")
        self.code = raw_code if isinstance(raw_code, str) else None
        self.details = envelope.get("details")
        envelope_request_id = raw_request_id if isinstance(raw_request_id, str) else None
        self.request_id = request_id if request_id is not None else envelope_request_id


class PptxValidationError(PptxApiError):
    """Raised on HTTP 422 validation failures from ``/v1/generate``."""

    def __init__(
        self,
        message: str,
        status: int,
        body: dict[str, Any] | None,
        request_id: str | None,
        validation_errors: list[str],
    ) -> None:
        super().__init__(message, status, body, request_id)
        self.validation_errors = validation_errors


class PptxRateLimitError(PptxApiError):
    """Raised on HTTP 429. Exposes ``retry_after_seconds`` when the server sends a
    ``Retry-After`` header."""

    def __init__(
        self,
        message: str,
        body: dict[str, Any] | None,
        request_id: str | None,
        retry_after_seconds: int | None,
    ) -> None:
        super().__init__(message, 429, body, request_id)
        self.retry_after_seconds = retry_after_seconds


__all__ = [
    "PptxApiError",
    "PptxError",
    "PptxNetworkError",
    "PptxRateLimitError",
    "PptxValidationError",
]
