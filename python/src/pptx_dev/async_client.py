"""Asynchronous pptx.dev client (httpx.AsyncClient)."""

from __future__ import annotations

from typing import Any, cast

import httpx

from . import _http
from .client import OPFDocumentInput, PptxFileLike, _file_payload, _to_json_payload
from .errors import PptxNetworkError
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


class AsyncPptx:
    """Async version of :class:`pptx_dev.Pptx`. Same surface, same auth rules."""

    def __init__(
        self,
        *,
        api_key: str | None = None,
        base_url: str | None = None,
        http_client: httpx.AsyncClient | None = None,
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
            self._client = httpx.AsyncClient(timeout=timeout)
            self._owns_client = True

        self.opf = _AsyncOpfNamespace(self)
        self.parse = _AsyncParseNamespace(self)
        self.render = _AsyncRenderNamespace(self)
        self.convert = _AsyncConvertNamespace(self)

    # ── Lifecycle ─────────────────────────────────────────────────

    async def aclose(self) -> None:
        if self._owns_client:
            await self._client.aclose()

    async def __aenter__(self) -> "AsyncPptx":
        return self

    async def __aexit__(self, *_exc: object) -> None:
        await self.aclose()

    # ── Health ────────────────────────────────────────────────────

    async def health(self) -> HealthResponse:
        return cast(HealthResponse, await self._request("GET", "/v1/health"))

    # ── Internal request helper ──────────────────────────────────

    async def _request(
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
            response = await self._client.request(
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


class _AsyncOpfNamespace:
    def __init__(self, client: AsyncPptx) -> None:
        self._client = client

    async def validate(self, document: OPFDocumentInput) -> ValidateResponse:
        return cast(
            ValidateResponse,
            await self._client._request(
                "POST", "/v1/validate", json_body=_to_json_payload(document)
            ),
        )

    async def generate(
        self,
        document: OPFDocumentInput,
        *,
        format: GenerateFormat | None = None,
    ) -> GenerateAcceptedResponse:
        query = {"format": format} if format else None
        return cast(
            GenerateAcceptedResponse,
            await self._client._request(
                "POST",
                "/v1/generate",
                query=query,
                json_body=_to_json_payload(document),
            ),
        )


class _AsyncParseNamespace:
    def __init__(self, client: AsyncPptx) -> None:
        self._client = client

    async def upload(
        self,
        file: PptxFileLike,
        *,
        filename: str | None = None,
    ) -> ParseAcceptedResponse:
        return cast(
            ParseAcceptedResponse,
            await self._client._request(
                "POST",
                "/v1/parse",
                files={"file": _file_payload(file, filename)},
            ),
        )

    async def metadata(self, parse_id: str) -> ParseMetadataResponse:
        return cast(
            ParseMetadataResponse,
            await self._client._request("GET", f"/v1/parse/{parse_id}/metadata"),
        )

    async def slide(self, parse_id: str, index: int) -> ParseSlideResponse:
        return cast(
            ParseSlideResponse,
            await self._client._request("GET", f"/v1/parse/{parse_id}/slides/{index}"),
        )

    async def text(self, parse_id: str) -> ParseTextResponse:
        return cast(
            ParseTextResponse,
            await self._client._request("GET", f"/v1/parse/{parse_id}/text"),
        )


class _AsyncRenderNamespace:
    def __init__(self, client: AsyncPptx) -> None:
        self._client = client

    async def web(
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
            await self._client._request(
                "POST",
                "/v1/render",
                query=query,
                files={"file": _file_payload(file, filename)},
            ),
        )

    async def export(
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
            await self._client._request(
                "POST",
                "/v1/render",
                query=query,
                files={"file": _file_payload(file, filename)},
            ),
        )


class _AsyncConvertNamespace:
    def __init__(self, client: AsyncPptx) -> None:
        self._client = client

    async def pptx_to_opf(
        self,
        file: PptxFileLike,
        *,
        filename: str | None = None,
    ) -> dict[str, Any]:
        return cast(
            dict[str, Any],
            await self._client._request(
                "POST",
                "/v1/convert",
                files={"file": _file_payload(file, filename)},
            ),
        )


__all__ = ["AsyncPptx"]
