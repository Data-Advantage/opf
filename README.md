# Open Presentation Format (OPF)

Open Presentation Format is the portable, human-readable JSON document format for slide decks powering [pptx.dev](https://pptx.dev).

This repository is the canonical home for the OPF **spec**, the **JSON Schema**, and the official **client tools** that talk to the pptx.dev REST API.

## Why OPF

`.pptx` is a zipped bundle of XML. Humans can't diff it, LLMs can't read or write it reliably, and git can't track it meaningfully. Every change looks like a binary blob.

OPF is plain JSON. A human can open it in an editor. A model can read and write it without guessing at schema-by-example. Decks live in git like the rest of your work.

That's the shift that lets LLMs actually *author* decks. When the format stops fighting them, models can do the work that matters — narrative structure, persuasive framing, data analysis, chart recommendations, ruthless revision passes — instead of wrestling with `<p:sp>` tags.

And they don't start from a blank canvas. [pptx.gallery](https://pptx.gallery) is a growing library of decks, slides, blocks, themes, charts, and analyses. Real building blocks to compose with, not an empty file.

## Use it from anywhere

OPF is designed to meet you where you already work.

If you're a developer or technical power user, you should be able to generate, edit, validate, and render OPF decks from your current chat app, IDE, coding agent, or shell — not get funneled into yet another proprietary editor. That's why we ship first-class **Go, TypeScript, and Python SDKs**, **Node and Python CLIs**, and an **MCP server**. OPF drops straight into Claude Code, Cursor, Codex, agent frameworks, and whatever comes next.

Consumer surfaces are next. The same format is built to land inside ChatGPT, Claude, Gemini, Slack, and other everyday apps via plugins, connectors, and MCP. Pick your surface — OPF travels with you.

Underneath it all: **one REST API** (`https://api.pptx.dev/v1`), **one schema**, many clients. That's the contract.

## Layout

| Path | Contents |
|---|---|
| [`spec/openapi.yaml`](./spec/openapi.yaml) | Canonical OpenAPI 3.1 spec for `https://api.pptx.dev/v1`. |
| [`spec/opf.schema.json`](./spec/opf.schema.json) | JSON Schema for OPF documents (served at `https://pptx.dev/schema/opf/v1`). |
| [`go/`](./go) | Go SDK, module `pptx.dev/go`. `go get pptx.dev/go`. |
| [`typescript/`](./typescript) | TypeScript SDK, published to npm as `@pptx/sdk`. |
| [`python/`](./python) | Python SDK, published to PyPI as `pptx-dev`. |
| [`cli/node/`](./cli/node) | TypeScript CLI, published to npm as `@pptx/cli`. |
| [`cli/python/`](./cli/python) | Python CLI. |
| [`mcp/`](./mcp) | MCP server for pptx.dev. |

## REST API

The OPF REST API is served from `https://api.pptx.dev/v1`. Its implementation lives in the [pptx-dev](https://github.com/Data-Advantage/pptx-dev) Next.js app — this repo holds the spec and client tooling only.

## License

MIT. See [LICENSE](./LICENSE).
