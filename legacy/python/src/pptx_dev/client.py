"""Synchronous pptx.dev client (httpx-based)."""

from __future__ import annotations

from typing import IO, Any, BinaryIO, Union, cast

import httpx
from pydantic import BaseModel

from . import _http
from .errors import PptxNetworkError
from .opf import OPFDocument
from .types import (
    GenerateAcceptedResponse,
    GenerateFormat,
    HealthResponse,
    ParseAcceptedResponse,
    ParseMetadataResponse,
    ParseSlideResponse,
    ParseTextResponse,
    RenderAcceptedResponse,
    RenderFormat,
    RenderWebResponse,
    ValidateResponse,
)


PptxFileLike = Union[bytes, bytearray, memoryview, BinaryIO, IO[bytes]]
OPFDocumentInput = Union[OPFDocument, dict[str, Any]]


def _to_json_payload(document: OPFDocumentInput) -> Any:
    if isinstance(document, BaseModel):
        return document.model_dump(mode="json", by_alias=True, exclude_none=True)
    return document


def _file_payload(
    file: PptxFileLike,
    filename: str | None,
) -> tuple[str, Any, str]:
    name = filename or "upload.pptx"
    if isinstance(file, (bytes, bytearray, memoryview)):
        data: Any = bytes(file)
    else:
        data = file
    return (name, data, _http.PPTX_MIME)


class Pptx:
    """Synchronous client for the pptx.dev REST API.

    Auth resolution order:

    1. ``api_key=...`` passed to the constructor
    2. ``PPTX_API_KEY`` environment variable
    """

    def __init__(
        self,
        *,
        api_key: str | None = None,
        base_url: str | None = None,
        http_client: httpx.Client | None = None,
        timeout: float | httpx.Timeout | None = _http.DEFAULT_TIMEOUT_SECONDS,
        default_headers: dict[str, str] | None = None,
    ) -> None:
        self._api_key = _http.resolve_api_key(api_key)
        self.base_url = _http.clean_base_url(base_url)
        self._default_headers: dict[str, str] = dict(default_headers or {})
        if http_client is not None:
            self._client = http_client
            self._owns_client = False
        else:
            self._client = httpx.Client(timeout=timeout)
            self._owns_client = True

        self.opf = _OpfNamespace(self)
        self.parse = _ParseNamespace(self)
        self.render = _RenderNamespace(self)
        self.convert = _ConvertNamespace(self)

    # ── Lifecycle ─────────────────────────────────────────────────

    def close(self) -> None:
        if self._owns_client:
            self._client.close()

    def __enter__(self) -> "Pptx":
        return self

    def __exit__(self, *_exc: object) -> None:
        self.close()

    # ── Health ────────────────────────────────────────────────────

    def health(self) -> HealthResponse:
        return cast(HealthResponse, self._request("GET", "/v1/health"))

    # ── Internal request helper ──────────────────────────────────

    def _request(
        self,
        method: str,
        path: str,
        *,
        query: dict[str, Any] | None = None,
        json_body: Any = None,
        files: dict[str, tuple[str, Any, str]] | None = None,
        parse_json: bool = True,
    ) -> Any:
        url = f"{self.base_url}{_http.build_path(path)}"
        params = _http.build_query(query)
        headers = _http.build_headers(
            self._api_key,
            self._default_headers,
            None,
            has_body=(json_body is not None) or bool(files),
            has_multipart=bool(files),
        )

        try:
            response = self._client.request(
                method,
                url,
                params=params,
                json=json_body if files is None else None,
                files=files,
                headers=headers,
            )
        except httpx.HTTPError as cause:
            raise PptxNetworkError(
                f"pptx.dev SDK: network error calling {method} {url}", cause
            ) from cause

        if response.status_code >= 400:
            _http.raise_for_status(
                method=method,
                url=url,
                status=response.status_code,
                headers={k.lower(): v for k, v in response.headers.items()},
                text=response.text,
            )

        if not parse_json:
            return response

        text = response.text
        if not text:
            return None
        try:
            return response.json()
        except ValueError as cause:
            raise PptxNetworkError(
                f"pptx.dev SDK: invalid JSON response from {method} {url}", cause
            ) from cause


# ─── Namespaces ──────────────────────────────────────────────────────


class _OpfNamespace:
    def __init__(self, client: Pptx) -> None:
        self._client = client

    def validate(self, document: OPFDocumentInput) -> ValidateResponse:
        return cast(
            ValidateResponse,
            self._client._request(
                "POST", "/v1/validate", json_body=_to_json_payload(document)
            ),
        )

    def generate(
        self,
        document: OPFDocumentInput,
        *,
        format: GenerateFormat | None = None,
    ) -> GenerateAcceptedResponse:
        query = {"format": format} if format else None
        return cast(
            GenerateAcceptedResponse,
            self._client._request(
                "POST",
                "/v1/generate",
                query=query,
                json_body=_to_json_payload(document),
            ),
        )


class _ParseNamespace:
    def __init__(self, client: Pptx) -> None:
        self._client = client

    def upload(
        self,
        file: PptxFileLike,
        *,
        filename: str | None = None,
    ) -> ParseAcceptedResponse:
        return cast(
            ParseAcceptedResponse,
            self._client._request(
                "POST",
                "/v1/parse",
                files={"file": _file_payload(file, filename)},
            ),
        )

    def metadata(self, parse_id: str) -> ParseMetadataResponse:
        return cast(
            ParseMetadataResponse,
            self._client._request("GET", f"/v1/parse/{parse_id}/metadata"),
        )

    def slide(self, parse_id: str, index: int) -> ParseSlideResponse:
        return cast(
            ParseSlideResponse,
            self._client._request("GET", f"/v1/parse/{parse_id}/slides/{index}"),
        )

    def text(self, parse_id: str) -> ParseTextResponse:
        return cast(
            ParseTextResponse,
            self._client._request("GET", f"/v1/parse/{parse_id}/text"),
        )


class _RenderNamespace:
    def __init__(self, client: Pptx) -> None:
        self._client = client

    def web(
        self,
        file: PptxFileLike,
        *,
        filename: str | None = None,
        slides: list[int] | None = None,
    ) -> RenderWebResponse:
        query: dict[str, Any] = {"format": "web"}
        if slides:
            query["slides"] = [str(s) for s in slides]
        return cast(
            RenderWebResponse,
            self._client._request(
                "POST",
                "/v1/render",
                query=query,
                files={"file": _file_payload(file, filename)},
            ),
        )

    def export(
        self,
        file: PptxFileLike,
        format: RenderFormat,
        *,
        filename: str | None = None,
        slides: list[int] | None = None,
    ) -> RenderAcceptedResponse:
        if format == "web":
            raise ValueError(
                "Use render.web() for web format; render.export() is for svg/png."
            )
        query: dict[str, Any] = {"format": format}
        if slides:
            query["slides"] = [str(s) for s in slides]
        return cast(
            RenderAcceptedResponse,
            self._client._request(
                "POST",
                "/v1/render",
                query=query,
                files={"file": _file_payload(file, filename)},
            ),
        )


class _ConvertNamespace:
    def __init__(self, client: Pptx) -> None:
        self._client = client

    def pptx_to_opf(
        self,
        file: PptxFileLike,
        *,
        filename: str | None = None,
    ) -> dict[str, Any]:
        return cast(
            dict[str, Any],
            self._client._request(
                "POST",
                "/v1/convert",
                files={"file": _file_payload(file, filename)},
            ),
        )


__all__ = ["OPFDocumentInput", "Pptx", "PptxFileLike"]
