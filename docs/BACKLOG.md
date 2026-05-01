# OPF Backlog

Items intentionally deferred out of v1. Each entry records what was considered, why it was cut, and what would change to bring it back.

## Slide transitions

**Status:** removed from v1 spec (was `Slide.transition` and `$defs/Transition`).

**Sketch of the removed shape:**

- `Slide.transition`: optional `Transition` describing the animation used when entering the slide.
- `Transition.type`: `none | fade | slide | push | wipe | morph | zoom`.
- `Transition.duration`: number, seconds.
- `Transition.direction`: `left | right | up | down` for directional types.

**Why deferred:**

- v1 is scoped to static authoring — narrative, layout, brand, content. Animation and motion belong with builds in v2 (see `PRODUCT.md` → "What OPF models").
- A meaningful transition spec needs to compose with content-item builds, sequencing, and triggers. Shipping a standalone slide-entry enum now would lock in the small-and-wrong shape and make the v2 motion model harder to design.
- LLM authoring has no observed signal for picking transitions; it would be noise in the document and skipped by every renderer that doesn't support PowerPoint motion.
- Removes one `$defs` entry and one optional slide property from the v1 surface area to keep the freeze tight.

**What would bring it back:**

- A v2 motion model that covers slide transitions, content-item builds, and timing under one consistent design.
- Concrete renderer demand (`.pptx`, web, video export) for at least transitions, plus catalog-style presets so authors pick from named motions instead of freelancing parameters.

## Content item animations

**Status:** removed from v1 spec (was `ContentItem.animation` and `$defs/Animation`).

**Sketch of the removed shape:**

- `ContentItem.animation`: optional `Animation` describing the entry effect for the content item.
- `Animation.type`: `appear | fadeIn | slideIn | zoomIn | typewriter | custom`.
- `Animation.delay`: number, seconds before the effect starts.
- `Animation.duration`: number, seconds.
- `Animation.order`: integer, position in the slide's animation sequence (lower plays first).

**Why deferred:**

- Same v1/v2 split as transitions: v1 captures static authoring, animations and builds are v2 territory (`PRODUCT.md` → "v2 adds animations, builds, transitions").
- Per-content-item `delay` / `duration` / `order` is the wrong shape for real builds. Real builds need triggers (on click, with previous, after previous), grouped sequences, and exit/emphasis effects in addition to entry — none of which compose with a single optional object on `ContentItem`.
- Sequencing by integer `order` couples animation timing to authoring order in a brittle way; a v2 model should express sequences as first-class objects, not as scattered numbers on content items.
- Authoring-time LLMs have no reliable signal for picking entry effects, so the field is overwhelmingly noise in real documents.

**What would bring it back:**

- The same v2 motion model called out for transitions, with builds as a first-class concept that owns sequencing, triggers, and per-content-item effects together.
- Catalog-style preset motions (named, curated) so authors pick from a small set instead of freelancing types and timings.
