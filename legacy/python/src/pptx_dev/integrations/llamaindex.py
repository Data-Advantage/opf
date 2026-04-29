"""LlamaIndex tool adapters for pptx.dev.

Requires ``llama-index-core>=0.10``. Install with::

    pip install "pptx-dev[llamaindex]"

Usage::

    from pptx_dev import Pptx
    from pptx_dev.integrations.llamaindex import pptx_tool_spec

    pptx = Pptx()
    tools = pptx_tool_spec(pptx).to_tool_list()
    # pass `tools` to a LlamaIndex agent
"""

from __future__ import annotations

import json
from typing import Any

try:
    from llama_index.core.tools.tool_spec.base import BaseToolSpec
except ImportError as exc:  # pragma: no cover - import guard
    raise ImportError(
        "llama-index-core is required for pptx_dev.integrations.llamaindex. "
        'Install with `pip install "pptx-dev[llamaindex]"`.'
    ) from exc

from ..client import Pptx


def _parse_document(payload: str) -> Any:
    try:
        return json.loads(payload)
    except json.JSONDecodeError as exc:
        raise ValueError(f"document_json is not valid JSON: {exc}") from exc


class PptxToolSpec(BaseToolSpec):
    """LlamaIndex tool spec wrapping a :class:`pptx_dev.Pptx` client.

    Exposes ``pptx_opf_validate``, ``pptx_opf_generate``, and
    ``pptx_parse_slide`` as LlamaIndex tools.
    """

    spec_functions = ["pptx_opf_validate", "pptx_opf_generate", "pptx_parse_slide"]

    def __init__(self, client: Pptx) -> None:
        self._client = client

    def pptx_opf_validate(self, document_json: str) -> str:
        """Validate an OPF document. Returns JSON with valid/errors/warnings.

        :param document_json: JSON-encoded OPF document.
        """
        doc = _parse_document(document_json)
        result = self._client.opf.validate(doc)
        return json.dumps(result)

    def pptx_opf_generate(self, document_json: str, format: str = "pptx") -> str:
        """Generate a .pptx (or pdf/png/svg) file from an OPF document.

        :param document_json: JSON-encoded OPF document.
        :param format: Output format: one of 'pptx', 'pdf', 'png', 'svg'.
        """
        doc = _parse_document(document_json)
        result = self._client.opf.generate(doc, format=format)  # type: ignore[arg-type]
        return json.dumps(result)

    def pptx_parse_slide(self, parse_id: str, index: int) -> str:
        """Read a single parsed slide by index.

        :param parse_id: ID returned from uploading a .pptx to /v1/parse.
        :param index: Zero-based slide index.
        """
        result = self._client.parse.slide(parse_id, index)
        return json.dumps(result)


def pptx_tool_spec(client: Pptx) -> PptxToolSpec:
    """Return a :class:`PptxToolSpec` bound to the given client."""
    return PptxToolSpec(client)


__all__ = ["PptxToolSpec", "pptx_tool_spec"]
