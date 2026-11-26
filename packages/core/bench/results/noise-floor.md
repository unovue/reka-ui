## Bench compare: v2 → v2-rerun

- a = v2: reka-ui 2.11.0 @ 9025f41a9, 2026-11-25T11:12Z, load 97.4 → max 97.4, timings suspect
- b = v2-rerun: reka-ui 2.11.0 @ 9025f41a9, 2026-11-25T11:21Z, load 24.95 → max 41.31, timings suspect
- ⚠️ at least one run was not taken on a quiet, gated machine: **ignore the timing rows**, heap and counts are still valid
- ⚠️ only in a: Combobox@1000, Combobox@5000, DropdownMenu@1000, DropdownMenu@5000, Listbox@1000, Listbox@5000, RadioGroup@1000, RadioGroup@5000, Select@1000, Select@5000, Tabs@1000, Tabs@5000, ToggleGroup@1000, ToggleGroup@5000, Tree@1000, Tree@5000

Listed when: timings outside ±15% and > 2 × stddev and > 0.1 ms; heap outside ±2% and > 0.1 KB; counts differ by > 1% and ≥ 0.5. Ratios are b / a.

### Spread of b / a

| Class | metrics | geomean | median abs. change | p90 | max | listed |
|---|--:|--:|--:|--:|--:|--:|
| timings | 138 | ×0.972 | 6.4% | 24.6% | 50.0% | 4 |
| heap | 67 | ×1.000 | 0.0% | 0.1% | 0.2% | 0 |
| counts | 194 | ×1.000 | 0.0% | 0.0% | 0.0% | 0 |

### Changes beyond noise (4 of 540 metrics)

| Scenario | Family | Metric | a | b | b / a |  |
|---|---|---|--:|--:|--:|--:|
| mount | Slider | interaction ms | 0.70 | 0.40 | ×0.57 | **lower** |
| mount | SliderArea | interaction ms | 0.60 | 0.35 | ×0.58 | **lower** |
| mount | Field | interaction ms | 0.70 | 0.95 | ×1.36 | **higher** |
| mount | HoverCard | mount ms | 15.50 | 18.10 | ×1.17 | **higher** |

