# Content Payloads

Slide content lives either directly on a slide as a full-slide payload or inside a promoted region key such as `left`, `center+right`, or `top:left`.

The optional payload `type` can make intent explicit, but OPF should usually infer the content kind from the field present:

| Field | Inferred type | Notes |
| --- | --- | --- |
| `text` | `text` | Plain string or `TextRun[]`. |
| `bullets` | `text` | Simple text bullets, usually `string[]`. |
| `items` | `list` | Generic list payload, usually `string[]` or `ListItem[]`. |
| `image` | `image` | Single asset source string. |
| `video` | `video` | Single asset source string. |
| `chart` | `chart` | Chart object with `type` and tabular `data`. |
| `table` | `table` | Table object with optional `headers` and required `rows`. |
| `code` | `code` | Source code text; `language` is optional. |
| `shape` | `shape` | Shape identifier. |
| `value` | `metric` | Metric value; `label`, `unit`, `delta`, and `trend` are optional. |
| `quote` | `quote` | Quote text; `attribution` and `source` are optional. |
| `events` | `timeline` | Timeline event list. |

## Chart

Chart-specific fields are grouped under `chart`. Do not put loose chart data directly on a slide or region.

```json
{
  "title": "Revenue Trend",
  "chart": {
    "type": "line",
    "data": {
      "columns": ["Quarter", "Revenue", "Costs"],
      "rows": [
        ["Q1", 12, 8],
        ["Q2", 18, 11],
        ["Q3", 24, 15]
      ]
    }
  }
}
```

Inline chart data is tabular by default. Renderers convert `columns` and `rows` into series, axes, legends, and workbook data internally.

Asset-backed data is still table-oriented:

```json
{
  "chart": {
    "type": "column",
    "data": {
      "asset": "revenue-csv",
      "columns": ["Quarter", "Revenue"]
    }
  }
}
```

## Table

Table-specific fields are grouped under `table`. Do not put loose `headers` or `rows` directly on a slide or region.

```json
{
  "title": "Pipeline",
  "table": {
    "headers": ["Stage", "Count", "Value"],
    "rows": [
      ["Qualified", 42, "$1.2M"],
      ["Proposal", 18, "$840K"]
    ]
  }
}
```

## Regions

The same payload objects work inside regions:

```json
{
  "title": "Operating Snapshot",
  "left": {
    "table": {
      "headers": ["Metric", "Value"],
      "rows": [
        ["Revenue", "$4.2M"],
        ["Gross margin", "68%"]
      ]
    }
  },
  "center+right": {
    "chart": {
      "type": "line",
      "data": {
        "columns": ["Month", "Revenue"],
        "rows": [
          ["Jan", 3.4],
          ["Feb", 3.8],
          ["Mar", 4.2]
        ]
      }
    }
  }
}
```
