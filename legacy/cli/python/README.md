# pptx-cli

Official CLI for [pptx.dev](https://www.pptx.dev), packaged for `pipx`. Generate, parse, validate, render, and format presentations from the terminal using **OPF** (Open Presentation Format).

This package is a thin Python wrapper around the Node-based [`@pptx/cli`](https://www.npmjs.com/package/@pptx/cli). It bundles the compiled JavaScript CLI inside the wheel and shells out to `node` on invocation.

Binary name: `pptx`.

## Install

```bash
# Recommended: isolated per-user install
pipx install pptx-cli

# Or plain pip (prefer pipx for CLIs)
pip install pptx-cli
```

### Prerequisite: Node.js 20+

`pptx-cli` shells out to Node. You need Node.js 20 or newer on your `PATH`:

```bash
# macOS (Homebrew)
brew install node

# Debian / Ubuntu
sudo apt install nodejs

# Fedora / RHEL
sudo dnf install nodejs

# Windows (winget)
winget install OpenJS.NodeJS.LTS

# Any platform
# https://nodejs.org/
```

To pin a specific Node binary, set `PPTX_NODE_BIN`:

```bash
export PPTX_NODE_BIN=/opt/homebrew/opt/node@20/bin/node
```

If you already live in the Node ecosystem, installing [`@pptx/cli`](https://www.npmjs.com/package/@pptx/cli) directly from npm is equivalent and lighter:

```bash
npm install -g @pptx/cli
```

## Quick start

```bash
# 1. Authenticate once (stores at ~/.pptx/config.json, mode 0600)
pptx login

# 2. Scaffold an OPF deck
pptx add deck -o deck.opf.json

# 3. Validate it
pptx validate deck.opf.json

# 4. Render a .pptx (returns 202 job metadata today — engine ships with DAT-1945)
pptx render deck.opf.json --format pptx
```

See [the CLI reference](https://www.pptx.dev/docs/cli) for the full command surface.

## How it works

`pipx install pptx-cli` drops a `pptx` entry point that runs
`node <site-packages>/pptx_cli/vendor/cli.cjs <args>`. The bundled `cli.cjs`
is a fully self-contained build of `@pptx/cli` — every runtime dependency
(including `commander` and `@pptx/sdk`) is inlined. There is no `npm install`
at runtime, no global Node package state, and no network access at install
time beyond the wheel download itself.

If you already have `@pptx/cli` installed globally via npm, the two binaries
coexist — `pipx` installs into its own isolated environment.

## Exit codes

| Code | Meaning                                                         |
|------|-----------------------------------------------------------------|
| `0`  | Success                                                         |
| `1`  | Generic failure (API error, validation failed)                  |
| `2`  | Bad input (missing key, invalid args, missing Node, broken install) |
| `3`  | Feature not yet available (e.g. prompt-based generate)          |

## Releases

Published to PyPI as [`pptx-cli`](https://pypi.org/project/pptx-cli/). Releases are tag-driven via GitHub Actions:

1. Bump `version` in `sdk/cli-python/pyproject.toml` (follow semver).
2. Commit + push to `master`.
3. Tag the commit with `cli-py-v<version>` (e.g. `cli-py-v0.1.0`) and push the tag:

   ```bash
   git tag cli-py-v0.1.0
   git push origin cli-py-v0.1.0
   ```

4. The [`Publish pptx-cli (PyPI)`](../../.github/workflows/publish-cli-pypi.yml) workflow:
   - Verifies the tag matches `pyproject.toml` version.
   - Builds `@pptx/sdk` and the self-contained `@pptx/cli` bundle.
   - Copies the bundled `cli.cjs` into the wheel vendor dir.
   - Builds sdist + wheel and publishes via PyPI Trusted Publishing.
   - Smoke-tests `pipx install pptx-cli==<version>` + `pptx --version` on Linux and macOS.

The workflow supports a manual `workflow_dispatch` run with `dry_run` for testing without publishing.

## License

MIT. See [LICENSE](./LICENSE).
