# Legacy PPTX.dev Code

This folder holds previous PPTX.dev-specific clients and tools for review or migration later.

These packages are not the canonical OPF format packages. They call or wrap PPTX.dev service behavior such as hosted validation, generation, parsing, rendering, API clients, CLI commands, and MCP tools.

Current contents:

| Path | Previous role |
|---|---|
| `typescript/` | Previous TypeScript PPTX.dev SDK (`@pptx/sdk`). |
| `python/` | Previous Python PPTX.dev SDK (`pptx-dev`). |
| `go/` | Previous Go PPTX.dev API client. |
| `cli/` | Previous PPTX.dev CLI packages. |
| `mcp/` | Previous PPTX.dev MCP server. |
| `workflows/` | Previous publish/release GitHub Actions, moved here so they are preserved but inactive. |

Review guidance:

- Move useful OPF-only schema/type/catalog ideas into `packages/javascript` or future local-only Python/Go OPF packages.
- Move hosted generation/rendering/parsing/API behavior to PPTX.dev-owned repositories or packages.
- Do not publish from this folder without first deciding the new PPTX.dev package ownership model.
- Do not move files from `workflows/` back into `.github/workflows/` without reviewing their package names, tag triggers, publish targets, and secrets.
