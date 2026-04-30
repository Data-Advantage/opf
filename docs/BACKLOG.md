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
- A meaningful transition spec needs to compose with element-level builds, sequencing, and triggers. Shipping a standalone slide-entry enum now would lock in the small-and-wrong shape and make the v2 motion model harder to design.
- LLM authoring has no observed signal for picking transitions; it would be noise in the document and skipped by every renderer that doesn't support PowerPoint motion.
- Removes one `$defs` entry and one optional slide property from the v1 surface area to keep the freeze tight.

**What would bring it back:**

- A v2 motion model that covers slide transitions, element builds, and timing under one consistent design.
- Concrete renderer demand (`.pptx`, web, video export) for at least transitions, plus catalog-style presets so authors pick from named motions instead of freelancing parameters.
