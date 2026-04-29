# @pptx/cli

Official CLI for [pptx.dev](https://www.pptx.dev) — generate, parse, validate, render, and format presentations from the terminal using **OPF** (Open Presentation Format).

Binary name: `pptx`.

## Install

```bash
# npm
npm install -g @pptx/cli

# pnpm
pnpm add -g @pptx/cli

# one-off
npx @pptx/cli --help

# pipx (Python-first workflows — requires Node.js on PATH)
pipx install pptx-cli

# Homebrew (macOS / Linuxbrew — pulls Node as a dependency)
brew tap data-advantage/tap
brew install pptx
```

The PyPI package [`pptx-cli`](https://pypi.org/project/pptx-cli/) is a thin
Python wrapper that ships a self-contained bundle of this CLI and shells
out to Node. Its source lives in [`sdk/cli-python`](../cli-python) and is
published via the [`Publish pptx-cli (PyPI)`](../../.github/workflows/publish-cli-pypi.yml)
workflow on `cli-py-v*` tags. The Homebrew tap
[`data-advantage/homebrew-tap`](https://github.com/data-advantage/homebrew-tap)
is auto-bumped on every `cli-v*` tag by the
[`Publish pptx (Homebrew tap)`](../../.github/workflows/publish-cli-homebrew.yml)
workflow — formula source lives in [`homebrew/Formula/pptx.rb`](../../homebrew/Formula/pptx.rb).

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

You can also drive the CLI via environment variable (`PPTX_API_KEY`) — the `--api-key` flag overrides both, and `pptx login` is the fallback. The same precedence applies to the base URL (`--base-url` > `PPTX_API_BASE_URL` > saved config > `https://api.pptx.dev`).

## Commands

| Command | What it does |
|---|---|
| `pptx login` | Save your API key to `~/.pptx/config.json` (0600). |
| `pptx logout` | Remove the saved API key. |
| `pptx generate <file\|prompt>` | Generate a deck from an OPF JSON file. (Prompt input returns a clear "not yet supported" hint until the prompt endpoint ships.) |
| `pptx validate <file.opf.json>` | Validate an OPF document against the canonical schema. |
| `pptx parse <file.pptx>` | Parse a `.pptx` file into OPF JSON. |
| `pptx render <file.opf.json> --format pptx\|pdf\|png\|svg` | Render an OPF document to a target format. |
| `pptx fmt <file.opf.json>` | Normalize OPF JSON locally (no API call). `--write` edits in place, `--check` fails if dirty. |
| `pptx add <component>` | Scaffold OPF snippets: `deck`, `theme`, `slide.title`, `slide.two-column`, `slide.chart`, `slide.quote`. |

Run `pptx <command> --help` for full flag docs.

## Auth

- `pptx login` writes JSON to `~/.pptx/config.json` with permissions `0600`. No native keychain dependency — keeps the CLI zero-binary and cross-platform.
- The `PPTX_API_KEY` environment variable always wins over the saved config, so CI can pass creds without running `login`.
- `pptx logout` deletes the file.

## Exit codes

| Code | Meaning |
|---|---|
| `0` | Success |
| `1` | Generic failure (API error, validation failed) |
| `2` | Bad input (missing key, invalid args, unreadable file) |
| `3` | Feature not yet available (e.g. prompt-based generate) |

## Releases

Published to npm as [`@pptx/cli`](https://www.npmjs.com/package/@pptx/cli) with [npm provenance](https://docs.npmjs.com/generating-provenance-statements). Releases are tag-driven via GitHub Actions:

1. Bump `version` in `sdk/cli/package.json` (follow semver).
2. Commit + push to `master`.
3. Tag the commit with `cli-v<version>` (e.g. `cli-v0.1.0`) and push the tag:
   ```bash
   git tag cli-v0.1.0
   git push origin cli-v0.1.0
   ```
4. The [`Publish @pptx/cli`](../../.github/workflows/publish-cli-npm.yml) workflow:
   - Verifies the tag matches `package.json` version.
   - Builds the bundled `@pptx/sdk` dependency, typechecks, and builds the CLI.
   - Publishes to npm with `--provenance --access public`.
   - Smoke-tests `npm i -g @pptx/cli@<version>` + `pptx --version` on Linux and macOS runners.

The workflow also supports a manual `workflow_dispatch` run with a `dry_run` input for testing the publish path without actually shipping.

Required repo secret: `NPM_TOKEN` (automation token scoped to the `@pptx` npm org, publish rights).

## License

MIT. See [LICENSE](./LICENSE).
