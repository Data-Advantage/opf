# Changelog

All notable changes to `pptx-cli` (PyPI) are documented here. This project follows [Semantic Versioning](https://semver.org/).

## [0.1.0] - Initial release

First public release of `pptx-cli` on PyPI. Pipx-installable wrapper around [`@pptx/cli`](https://www.npmjs.com/package/@pptx/cli).

### Added
- `pipx install pptx-cli` exposes the `pptx` command.
- Bundles a self-contained build of `@pptx/cli` (every runtime dep — `commander`, `@pptx/sdk` — inlined into `cli.cjs`).
- Python shim locates `node` via `PPTX_NODE_BIN` env var, then `PATH`; prints a clear install hint if Node is missing.
- Prerequisite: Node.js 20+ on `PATH` (or `PPTX_NODE_BIN` set).

### Distribution
- Published as `pptx-cli` on PyPI via the `cli-py-v*` tag-driven workflow using PyPI Trusted Publishing (OIDC).
- Built from the same source as the npm `@pptx/cli` package; both surfaces wrap the same OPF-native CLI.
