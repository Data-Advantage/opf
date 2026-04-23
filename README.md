# Open Presentation Format (OPF)

Open Presentation Format is the portable, human-readable JSON document format for slide decks powering [pptx.dev](https://pptx.dev).

This repository is the canonical home for the OPF **spec**, the **JSON Schema**, and the official **client tools** that talk to the pptx.dev REST API.

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
