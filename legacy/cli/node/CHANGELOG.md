# Changelog

All notable changes to `@pptx/cli` are documented here. This project follows [Semantic Versioning](https://semver.org/).

## [0.1.0] - Initial release

First public release of `@pptx/cli` on npm.

### Added
- `pptx login` / `pptx logout` — manage API key in `~/.pptx/config.json` (mode `0600`).
- `pptx generate <file|prompt>` — generate a deck from an OPF JSON file. (Prompt-based input returns a "not yet supported" hint until the prompt endpoint ships.)
- `pptx validate <file.opf.json>` — validate an OPF document against the canonical schema.
- `pptx parse <file.pptx>` — parse a `.pptx` file into OPF JSON.
- `pptx render <file.opf.json> --format pptx|pdf|png|svg` — render an OPF document. Returns 202 job metadata until the rendering engine ships with DAT-1945.
- `pptx fmt <file.opf.json>` — normalize OPF JSON locally. `--write` edits in place, `--check` fails if dirty.
- `pptx add <component>` — scaffold OPF snippets: `deck`, `theme`, `slide.title`, `slide.two-column`, `slide.chart`, `slide.quote`.
- Config precedence: `--api-key` flag > `PPTX_API_KEY` env > `~/.pptx/config.json`. Base URL: `--base-url` > `PPTX_API_BASE_URL` > saved config > `https://api.pptx.dev`.

### Distribution
- Published as `@pptx/cli` on npm with npm provenance (`cli-v*` tag-driven workflow).
- `pipx install pptx-cli` (PyPI) and `brew install data-advantage/tap/pptx` (Homebrew) wrap the same npm release and ship separately. The Homebrew tap is auto-bumped on every `cli-v*` tag by the `Publish pptx (Homebrew tap)` workflow.
