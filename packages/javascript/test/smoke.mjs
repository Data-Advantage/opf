import assert from "node:assert/strict";
import { createRequire } from "node:module";

import {
  audience,
  audiences,
  catalogEntries,
  catalogs,
  presentation,
  validateCatalogRecord,
  validatePresentation,
} from "../dist/index.js";
import { tones } from "../dist/catalogs.js";
import { validate, assertValid } from "../dist/validator.js";

assert.equal(presentation.$id, "https://pptx.dev/schema/opf/v1");
assert.equal(audience.$id, "https://pptx.dev/schema/opf-audience/v1");
assert.ok(audiences.length > 0);
assert.ok(tones.length > 0);
assert.equal(catalogs.audiences.length, audiences.length);

const doc = {
  name: "Smoke Test",
  slides: [{ title: "Smoke Test", items: ["First", "Second"] }],
};

const docResult = validatePresentation(doc);
assert.equal(docResult.valid, true, JSON.stringify(docResult.errors, null, 2));
assert.equal(validate(doc, "presentation").valid, true);
assert.doesNotThrow(() => assertValid(doc));

function assertPresentationValid(value) {
  const result = validatePresentation(value);
  assert.equal(result.valid, true, JSON.stringify(result.errors, null, 2));
}

function assertPresentationInvalid(value, messageIncludes) {
  const result = validatePresentation(value);
  assert.equal(result.valid, false, "expected presentation to be invalid");
  if (messageIncludes) {
    assert.ok(
      result.errors.some((error) => error.message.includes(messageIncludes)),
      JSON.stringify(result.errors, null, 2),
    );
  }
}

assertPresentationValid({
  name: "Root Payload",
  slides: [{ section: "Overview", title: "Summary", items: ["First", "Second", "Third"] }],
});

assertPresentationValid({
  name: "Columns",
  slides: [{
    title: "Market Shift",
    left: { text: "Signal" },
    "center+right": { items: ["Demand moved upmarket", "Procurement cycles shortened"] },
  }],
});

assertPresentationValid({
  name: "Rows",
  slides: [{
    title: "Performance",
    "top+middle": {
      type: "chart",
      chartType: "line",
      data: {
        labels: ["Q1", "Q2"],
        datasets: [{ label: "Latency", values: [10, 6] }],
      },
    },
    bottom: { text: "Latency improved quarter over quarter." },
  }],
});

assertPresentationValid({
  name: "Grid",
  slides: [{
    title: "Operating Model",
    "top:left": { text: "Inputs" },
    "top:center+right": { text: "Processing" },
    "middle+bottom:left+center+right": { items: ["Queue", "Route", "Resolve"] },
  }],
});

assertPresentationInvalid({
  name: "Overlap",
  slides: [{ left: { text: "A" }, "left+center": { text: "B" } }],
}, "overlap");

assertPresentationInvalid({
  name: "Bad Span",
  slides: [{ "left+right": { text: "A" } }],
}, "must NOT have additional properties");

assertPresentationInvalid({
  name: "Mixed Root And Regions",
  slides: [{ items: ["Root"], left: { text: "Region" } }],
}, "cannot be mixed");

assertPresentationInvalid({
  name: "Missing List Items",
  slides: [{ type: "list" }],
}, "requires 'items'");

assertPresentationInvalid({
  name: "Mixed Payload Kinds",
  slides: [{ text: "A", items: ["B"] }],
}, "incompatible");

assertPresentationInvalid({
  title: "Old Root Title",
  slides: [{ title: "Slide Title" }],
}, "Presentation.title has been renamed to Presentation.name");

assertPresentationInvalid({
  name: "Old Root Subtitle",
  subtitle: "Old root subtitle",
  slides: [{ title: "Slide Title" }],
}, "Presentation.subtitle has been removed");

assertPresentationInvalid({
  name: "Old Slide Group",
  slides: [{ group: "Old group", title: "Slide Title" }],
}, "slides[].group has been removed");

for (const entry of catalogEntries) {
  assert.ok(entry.records.length > 0, `${entry.kind} should have records`);
  const result = validateCatalogRecord(entry.kind, entry.records[0]);
  assert.equal(result.valid, true, `${entry.kind}: ${JSON.stringify(result.errors, null, 2)}`);
}

const require = createRequire(import.meta.url);
const rawPresentation = require("../dist/spec/presentation.schema.json");
assert.equal(rawPresentation.$id, presentation.$id);
