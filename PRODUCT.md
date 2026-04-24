# Product Strategy: OPF — Open Presentation Format

## Tier in the presentation stack

**Tier 1 — open-source primitive (MIT).** OPF is the foundation of Data Advantage's three-tier presentation stack. See the canonical strategy: [plans/2026-04-24-presentation-stack-strategy.md](https://github.com/Data-Advantage/dataadvantage-workspace/blob/master/plans/2026-04-24-presentation-stack-strategy.md).

```
Top:    STORYD2 (+ DeckChat)        — commercial consumer wrappers (Tier 3)
Middle: pptx.dev                    — hosted engine / metered pay-per-use API (Tier 2)
Bottom: OPF + pptx.gallery + SDKs   — open-source primitives, MIT (Tier 1)  ← you are here
```

- **Role in Tier 1:** OPF is the interchange format. It defines the JSON contract between LLM intent and rendered presentations so every agent in the ecosystem — ours or a third party's — can produce interoperable deck documents.
- **Siblings in Tier 1:** [pptx.gallery](https://pptx.gallery) provides the shared vocabulary (named layouts, color schemes, narratives, themes). The SDKs, CLIs, and MCP server in this repo are thin clients over the Tier-2 REST API.
- **Relationship to Tier 2 (pptx.dev):** OPF documents flow into `https://api.pptx.dev/v1` for rendering, parsing, and export. The hosted engine is the only paid surface; everything in this repo is free to use, vendor, and fork.
- **Relationship to Tier 3 (STORYD2, DeckChat):** Commercial wrappers produce OPF and hand it to pptx.dev. Keeping OPF MIT makes STORYD2 and DeckChat *more* valuable, not less — the format is open so every AI tool standardizes on it, and the consumer products compete on UX and agent strategy.

## Vision

**The portable, LLM-native document format for slide decks.** `.pptx` is a zipped XML bundle that humans can't diff, LLMs can't reliably write, and git can't track. OPF is plain JSON — a real document format that models can *author*, not just decorate. Every agent, IDE, chat surface, or shell can read and write OPF, and one hosted engine (pptx.dev) renders it to `.pptx`, PDF, SVG, or PNG.

## Target Users

1. **AI agent developers** building tools that generate or edit presentations programmatically (Claude Code, Cursor, Codex, LangChain, LlamaIndex, custom agents).
2. **Developers** embedding presentation workflows in SaaS, notebooks, CI/CD, or content pipelines.
3. **LLM application vendors** who want their product to emit durable, versionable deck artifacts without shipping their own OOXML generator.

## Positioning

"A JSON document format for slide decks — write it by hand, generate it with an agent, render it with one API call." OPF is the shared format; pptx.dev is the shared engine; gallery is the shared vocabulary.

## Distribution surfaces

One format, every runtime:

| Surface | Package | Audience |
|---|---|---|
| JSON Schema | `https://pptx.dev/schema/opf/v1` | Any JSON Schema validator, MCP, OpenAPI tooling |
| OpenAPI spec | `spec/openapi.yaml` | REST clients, code generators |
| TypeScript SDK | `@pptx/sdk` (npm) | Node, Next.js, Bun, browser agents |
| Python SDK | `pptx-dev` (PyPI) | Data teams, LangChain, LlamaIndex, notebooks |
| Go SDK | `pptx.dev/go` | Backend services, Go agents |
| CLI | `@pptx/cli` (npm), `pptx` (PyPI / pipx / Homebrew) | DevOps, CI/CD, content pipelines |
| MCP server | `pptx-mcp` | Claude Code, Claude Desktop, any MCP-aware agent |

All SDKs, CLIs, and the MCP server are thin clients over `https://api.pptx.dev/v1`. The REST API is the substrate; this repo is the client + spec surface.

## Monetization

**None in Tier 1.** OPF, the JSON schema, the SDKs, the CLIs, and the MCP server are MIT-licensed public goods. Revenue flows to Tier 2 (metered pay-per-use on the hosted engine) and Tier 3 (subscriptions on STORYD2 and DeckChat). The more widely OPF is adopted, the more valuable the Tier-2 engine becomes as the default renderer.

## Current Priorities

1. **v1 spec freeze** — finalize the OPF JSON Schema, OpenAPI contract, and TS/Python/Go type surfaces so downstream SDKs can ship stable releases.
2. **SDK parity** — TypeScript, Python, Go SDKs at feature parity with the REST API surface.
3. **CLI + MCP server** — single-binary CLI (`pptx`) and `pptx-mcp` discoverable by agent runtimes.
4. **Gallery integration** — OPF documents reference [pptx.gallery](https://pptx.gallery) items by slug; the SDK resolves names to concrete layouts/themes/schemes.
5. **Ecosystem adoption** — inbound partnerships with agent frameworks (Claude Code, Cursor, Codex, LangChain, LlamaIndex) so OPF is the default deck format.

## Key Decisions

- **MIT license, always.** The format and client tools must stay open so every AI tool (including competitors) can produce OPF. Format lock-in is not the moat — ecosystem adoption is.
- **Spec + clients live together, service lives separately.** This repo owns the OPF spec, the JSON Schema, and every client SDK/CLI/MCP. The hosted engine (Next.js app, REST API implementation, Studio, marketing site) lives in `Data-Advantage/pptx-dev`.
- **Vanity URLs are stable.** `pptx.dev/go`, `@pptx/*`, `pptx-dev` (PyPI), and `https://pptx.dev/schema/opf/v1` do not move even as source repos move. Existing users do not need to update import paths.
- **REST is the substrate.** Every SDK, the CLI, and the MCP server are thin clients over `https://api.pptx.dev/v1`. Anyone can skip the SDKs and call the API directly with `curl`.

## What OPF models

OPF v1 captures the dimensions a real presentation needs:

- **Narrative arc** — Minto pyramid, situation-complication-question-answer, problem-solution-impact, timeline, comparison
- **Information density** — executive summary vs. data appendix vs. discussion slide
- **Visual hierarchy** — headline, support, citation
- **Brand system** — colors, fonts, logo, master slides, footers, templates
- **Layout intent** — title, two-column, image-left, full-bleed, chart-with-callout, quote
- **Chart semantics** — what data, what comparison, where the eye lands
- **Speaker notes** — separate from the slide
- **Accessibility** — alt text, reading order, contrast
- **Audience register** — board deck vs. internal review vs. sales pitch

v2 adds animations, builds, transitions. Gallery names cover the high-level choices so the LLM picks from a curated set instead of freelancing pixel coordinates.
