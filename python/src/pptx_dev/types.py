"""Request/response TypedDicts and enums mirroring the REST API surface."""

from __future__ import annotations

import sys
from typing import Any, Literal

if sys.version_info >= (3, 11):
    from typing import NotRequired, TypedDict
else:
    from typing_extensions import NotRequired, TypedDict


GenerateFormat = Literal["pptx", "pdf", "png", "svg"]
RenderFormat = Literal["web", "svg", "png"]


class ValidationIssue(TypedDict):
    path: str
    message: str


class ValidateResponse(TypedDict):
    valid: bool
    errors: list[ValidationIssue]
    warnings: list[ValidationIssue]


class ParseAcceptedResponse(TypedDict):
    parseId: str
    slideCount: int
    width: float
    height: float


class GenerateAcceptedResponse(TypedDict):
    status: str
    message: str
    format: str
    slideCount: int
    validationWarnings: list[str]
    filename: NotRequired[str]


class ApiErrorEnvelope(TypedDict, total=False):
    code: str
    message: str
    details: Any
    requestId: str


class ApiErrorResponse(TypedDict):
    error: ApiErrorEnvelope


class ValidationErrorDetails(TypedDict):
    errors: list[ValidationIssue]


class TextRun(TypedDict, total=False):
    text: str
    bold: bool
    italic: bool
    underline: bool
    fontSize: float
    fontFamily: str
    color: str
    alignment: str


class ParseSlideResponse(TypedDict):
    index: int
    slideNumber: int
    hidden: bool
    width: float
    height: float
    textRuns: list[TextRun]
    speakerNotes: NotRequired[str]


class ParseMetadataResponse(TypedDict):
    parseId: str
    core: Any
    app: Any
    custom: Any


class ParseTextResponse(TypedDict):
    parseId: str
    slides: list[Any]


class RenderWebResponse(TypedDict):
    parseId: str
    format: Literal["web"]
    dimensions: Any
    slideCount: int
    slides: Any
    metadata: Any
    viewerUrl: str


class RenderAcceptedResponse(TypedDict):
    status: str
    message: str
    parseId: str
    format: str
    slideCount: int
    viewerUrl: str


class HealthResponse(TypedDict, total=False):
    status: str
    version: str


__all__ = [
    "ApiErrorEnvelope",
    "ApiErrorResponse",
    "GenerateAcceptedResponse",
    "GenerateFormat",
    "HealthResponse",
    "ParseAcceptedResponse",
    "ParseMetadataResponse",
    "ParseSlideResponse",
    "ParseTextResponse",
    "RenderAcceptedResponse",
    "RenderFormat",
    "RenderWebResponse",
    "TextRun",
    "ValidateResponse",
    "ValidationIssue",
    "ValidationErrorDetails",
]
