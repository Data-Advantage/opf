"""Internal HTTP plumbing shared by sync + async clients."""

from __future__ import annotations

import json as _json
import os
from dataclasses import dataclass
from typing import Any

from .errors import PptxApiError, PptxRateLimitError, PptxValidationError


DEFAULT_BASE_URL = "https://api.pptx.dev"
DEFAULT_TIMEOUT_SECONDS = 60.0

PPTX_MIME = "application/vnd.openxmlformats-officedocument.presentationml.presentation"


def resolve_api_key(explicit: str | None) -> str | None:
    if explicit is not None:
        return explicit
    return os.environ.get("PPTX_API_KEY")


def clean_base_url(base_url: str | None) -> str:
    return (base_url or DEFAULT_BASE_URL).rstrip("/")


def build_path(path: str) -> str:
    return path if path.startswith("/") else f"/{path}"


def build_query(
    query: dict[str, Any] | None,
) -> list[tuple[str, str]] | None:
    """Flatten query dict → list of (key, value). Arrays are joined with commas."""
    if not query:
        return None
    items: list[tuple[str, str]] = []
    for key, raw in query.items():
        if raw is None:
            continue
        if isinstance(raw, (list, tuple)):
            if raw:
                items.append((key, ",".join(str(v) for v in raw)))
        else:
            items.append((key, str(raw)))
    return items or None


def build_headers(
    api_key: str | None,
    defaults: dict[str, str],
    overrides: dict[str, str] | None,
    has_body: bool,
    has_multipart: bool,
) -> dict[str, str]:
    headers: dict[str, str] = dict(defaults)
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    if overrides:
        headers.update(overrides)
    if has_body and not has_multipart:
        headers.setdefault("Content-Type", "application/json")
    return headers


@dataclass
class _ErrorResult:
    message: str
    body: dict[str, Any] | str | None
    request_id: str | None


def _error_message(status: int, body: dict[str, Any] | str | None) -> str:
    if isinstance(body, dict):
        envelope = body.get("error")
        if isinstance(envelope, dict) and isinstance(envelope.get("message"), str):
            return f"pptx.dev API {status}: {envelope['message']}"
    if isinstance(body, str) and body:
        return f"pptx.dev API {status}: {body}"
    return f"pptx.dev API {status}"


def _envelope(body: dict[str, Any] | str | None) -> dict[str, Any] | None:
    if not isinstance(body, dict):
        return None
    envelope = body.get("error")
    return envelope if isinstance(envelope, dict) else None


def _validation_errors(body: dict[str, Any] | str | None) -> list[str] | None:
    envelope = _envelope(body)
    details = envelope.get("details") if envelope else None
    if not isinstance(details, dict):
        return None
    errors = details.get("errors")
    if not isinstance(errors, list):
        return None

    formatted: list[str] = []
    for issue in errors:
        if isinstance(issue, str):
            formatted.append(issue)
            continue
        if isinstance(issue, dict):
            path = issue.get("path")
            message = issue.get("message")
            if isinstance(path, str) and isinstance(message, str):
                formatted.append(f"{path}: {message}")
                continue
        formatted.append(str(issue))
    return formatted


def parse_error_body(text: str) -> dict[str, Any] | str | None:
    if not text:
        return None
    try:
        return _json.loads(text)
    except ValueError:
        return text


def raise_for_status(
    *,
    method: str,
    url: str,
    status: int,
    headers: dict[str, str],
    text: str,
) -> None:
    """Raise the appropriate typed error for a non-2xx response.

    ``headers`` must be a case-insensitive mapping of response headers. Pass
    ``dict(response.headers)`` from httpx — its ``Headers`` type is case
    insensitive but constructing a lower-cased dict also works.
    """
    body = parse_error_body(text)
    envelope = _envelope(body)
    envelope_request_id = envelope.get("requestId") if envelope else None
    request_id = (
        headers.get("x-request-id")
        or headers.get("X-Request-Id")
        or (envelope_request_id if isinstance(envelope_request_id, str) else None)
    )

    validation_errors = _validation_errors(body) if status == 422 else None
    if validation_errors is not None:
        raise PptxValidationError(
            _error_message(status, body),
            status,
            body if isinstance(body, dict) else None,
            request_id,
            validation_errors,
        )

    if status == 429:
        retry_after_raw = headers.get("retry-after") or headers.get("Retry-After")
        retry_after: int | None = None
        if retry_after_raw:
            try:
                retry_after = int(retry_after_raw)
            except ValueError:
                retry_after = None
        raise PptxRateLimitError(
            _error_message(status, body),
            body if isinstance(body, dict) else None,
            request_id,
            retry_after,
        )

    raise PptxApiError(
        _error_message(status, body),
        status,
        body,
        request_id,
    )


__all__ = [
    "DEFAULT_BASE_URL",
    "DEFAULT_TIMEOUT_SECONDS",
    "PPTX_MIME",
    "build_headers",
    "build_path",
    "build_query",
    "clean_base_url",
    "parse_error_body",
    "raise_for_status",
    "resolve_api_key",
]
