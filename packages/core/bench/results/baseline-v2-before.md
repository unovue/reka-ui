> **Timings in this file: pending (machine busy).** Load average was 12 to 19 during the run. Heap, DOM, listener and update counts do not depend on load and are valid.

## Bench: v2-before

- **Build**: reka-ui 2.11.0 (perf/timing-baseline @ 7c562b8b9, source last changed in 7c562b8b9), production dist, Vue 3.5.46
- **Browser**: headless Chromium 153.0.8010.12, Node v24.19.0
- **Machine**: Apple M1 Pro, 10 cores, 16 GB, darwin 25.6.0 arm64
- **Run**: 2026-11-26T08:50:29.183Z, 463s, 1 page load(s) × 3 round(s) per family
- **Load (1 min)**: 14.53 at start (not gated), max 18.61 during the run, 12.42 at the end; caffeinate on, sleep events 0
- **Timings**: not gated on load: treat as indicative

### Mount, retained heap, interaction (per family)

| Family | N | mount ms (med / p95 / sd) | µs / inst | heap KB / inst (med / p95 / sd) | after unmount KB / inst | leaked nodes / inst | DOM nodes | components | listeners | interaction ms (med / p95 / sd) |
|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|
| Accordion | 300 | 230.40 / 255.69 / 20.12 | 768.0 | 146.58 / 148.30 / 1.11 | 0.04 | 0.00 | 53 | 38 | 21 | 1.05 / 1.91 / 0.49 |
| AlertDialog | 100 | 23.80 / 27.58 / 2.55 | 238.0 | 47.09 / 48.16 / 0.77 | 0.57 | 0.00 | 20 | 13 | 1 | 2.40 / 2.80 / 0.34 |
| AspectRatio | 500 | 18.90 / 20.34 / 0.95 | 37.8 | 6.56 / 6.96 / 0.26 | 0.03 | 0.00 | 6 | 2 | 0 | – |
| Autocomplete | 100 | 51.10 / 58.48 / 5.15 | 511.0 | 80.04 / 81.24 / 0.93 | 0.49 | 0.00 | 29 | 18 | 11 | 2.55 / 4.97 / 1.08 |
| Avatar | 500 | 59.60 / 61.94 / 4.03 | 119.2 | 16.69 / 17.22 / 0.34 | 0.06 | 0.00 | 6 | 5 | 2 | – |
| Calendar | 30 | 109.80 / 110.97 / 3.44 | 3660.0 | 706.25 / 706.45 / 0.20 | 0.52 | 0.00 | 337 | 182 | 72 | 3.80 / 5.13 / 0.70 |
| Carousel | 100 | 116.30 / 116.57 / 9.44 | 1163.0 | 138.53 / 139.91 / 0.96 | 0.26 | 0.00 | 56 | 30 | 21 | 0.60 / 0.82 / 0.16 |
| Checkbox | 500 | 69.00 / 71.61 / 2.51 | 138.0 | 23.13 / 23.70 / 0.37 | 0.06 | 0.00 | 7 | 4 | 4 | 0.65 / 0.96 / 0.20 |
| CheckboxGroup | 300 | 348.20 / 394.01 / 37.48 | 1160.7 | 140.48 / 141.84 / 0.88 | 0.17 | 0.00 | 38 | 27 | 28 | 0.80 / 1.21 / 0.22 |
| Collapsible | 500 | 82.40 / 88.43 / 3.87 | 164.8 | 30.48 / 31.46 / 0.63 | 0.03 | 0.00 | 9 | 7 | 6 | 0.45 / 0.91 / 0.21 |
| ColorArea | 300 | 42.90 / 46.77 / 2.61 | 143.0 | 23.91 / 24.39 / 0.33 | 0.11 | 0.00 | 11 | 6 | 6 | 0.25 / 0.40 / 0.11 |
| ColorField | 500 | 45.10 / 46.45 / 1.08 | 90.2 | 16.95 / 17.40 / 0.29 | 0.03 | 0.00 | 8 | 4 | 8 | 0.65 / 0.76 / 0.09 |
| ColorSlider | 500 | 190.70 / 205.01 / 11.15 | 381.4 | 60.69 / 61.80 / 0.71 | 0.04 | 0.00 | 17 | 16 | 6 | 0.90 / 1.22 / 0.21 |
| ColorSwatch | 500 | 16.20 / 17.19 / 0.91 | 32.4 | 5.86 / 6.19 / 0.22 | 0.03 | 0.00 | 3 | 2 | 0 | – |
| ColorSwatchPicker | 200 | 240.20 / 261.62 / 15.24 | 1201.0 | 194.05 / 196.32 / 1.54 | 0.22 | 0.00 | 57 | 64 | 23 | 1.50 / 2.22 / 0.36 |
| Combobox | 100 | 52.10 / 55.25 / 3.80 | 521.0 | 83.51 / 84.69 / 0.97 | 0.53 | 0.00 | 29 | 18 | 12 | 3.00 / 5.00 / 0.96 |
| ContextMenu | 100 | 31.00 / 35.95 / 3.61 | 310.0 | 55.85 / 56.05 / 0.28 | 0.85 | 0.00 | 25 | 15 | 5 | 3.35 / 5.25 / 0.93 |
| DateField | 200 | 125.70 / 135.96 / 6.67 | 628.5 | 69.17 / 70.00 / 0.64 | 0.29 | 0.00 | 41 | 14 | 25 | 1.90 / 3.73 / 0.87 |
| DatePicker | 100 | 108.50 / 114.89 / 7.35 | 1085.0 | 133.71 / 135.22 / 1.02 | 0.67 | 0.00 | 74 | 34 | 27 | 9.45 / 10.81 / 1.12 |
| DateRangeField | 100 | 72.30 / 72.30 / 1.73 | 723.0 | 116.67 / 117.71 / 0.75 | 0.31 | 0.00 | 51 | 24 | 44 | 1.50 / 2.21 / 0.33 |
| DateRangePicker | 100 | 113.10 / 116.70 / 6.77 | 1131.0 | 188.59 / 190.36 / 1.21 | 0.70 | 0.00 | 93 | 49 | 46 | 10.05 / 12.21 / 1.46 |
| Dialog | 100 | 18.10 / 18.64 / 0.92 | 181.0 | 34.01 / 35.21 / 0.78 | 0.64 | 0.00 | 16 | 9 | 1 | 2.15 / 2.81 / 0.39 |
| Drawer | 100 | 17.00 / 17.99 / 0.74 | 170.0 | 40.43 / 42.01 / 1.08 | 0.58 | 0.00 | 16 | 9 | 1 | 1.95 / 2.52 / 0.35 |
| DropdownMenu | 100 | 27.40 / 30.91 / 4.62 | 274.0 | 54.90 / 56.42 / 1.18 | 1.36 | 0.00 | 21 | 15 | 3 | 3.65 / 4.62 / 0.57 |
| Editable | 300 | 92.00 / 97.76 / 3.95 | 306.7 | 41.98 / 42.67 / 0.49 | 0.22 | 0.00 | 29 | 14 | 10 | 1.00 / 1.16 / 0.16 |
| Field | 300 | 85.70 / 91.01 / 5.90 | 285.7 | 50.11 / 50.82 / 0.55 | 0.28 | 0.00 | 17 | 11 | 6 | 0.85 / 1.05 / 0.18 |
| Form | 200 | 161.60 / 163.22 / 3.25 | 808.0 | 138.32 / 139.73 / 1.02 | 0.04 | 0.00 | 44 | 29 | 20 | 0.90 / 1.00 / 0.08 |
| HoverCard | 100 | 18.20 / 20.54 / 1.94 | 182.0 | 39.60 / 40.62 / 0.71 | 0.40 | 0.00 | 17 | 11 | 5 | 1.95 / 2.92 / 0.53 |
| Label | 500 | 13.80 / 16.86 / 2.16 | 27.6 | 5.76 / 6.10 / 0.22 | 0.03 | 0.00 | 4 | 2 | 1 | – |
| Listbox | 300 | 295.60 / 299.38 / 6.09 | 985.3 | 123.19 / 124.29 / 0.77 | 0.18 | 0.00 | 34 | 36 | 20 | 1.10 / 1.35 / 0.13 |
| Menubar | 100 | 184.20 / 188.16 / 4.55 | 1842.0 | 253.61 / 257.35 / 3.19 | 2.60 | 0.00 | 68 | 75 | 28 | 3.30 / 3.98 / 0.40 |
| MonthPicker | 50 | 58.20 / 59.73 / 1.75 | 1164.0 | 227.07 / 229.08 / 1.56 | 0.56 | 0.00 | 128 | 68 | 26 | 1.35 / 2.46 / 0.55 |
| MonthRangePicker | 50 | 73.10 / 73.28 / 0.20 | 1462.0 | 264.81 / 266.79 / 1.50 | 0.58 | 0.00 | 128 | 68 | 51 | 1.95 / 3.14 / 0.68 |
| NavigationMenu | 100 | 59.90 / 66.11 / 4.91 | 599.0 | 122.47 / 124.32 / 1.35 | 0.94 | 0.00 | 50 | 31 | 17 | 1.65 / 2.24 / 0.34 |
| NumberField | 300 | 104.60 / 109.82 / 6.41 | 348.7 | 48.51 / 49.12 / 0.43 | 0.10 | 0.00 | 16 | 8 | 18 | 1.30 / 1.60 / 0.18 |
| Pagination | 300 | 118.50 / 121.11 / 3.05 | 395.0 | 81.79 / 82.68 / 0.60 | 0.23 | 0.00 | 66 | 26 | 10 | 0.45 / 1.03 / 0.31 |
| PinInput | 300 | 131.80 / 145.48 / 9.83 | 439.3 | 61.78 / 62.85 / 0.70 | 0.08 | 0.00 | 24 | 13 | 33 | 1.40 / 2.60 / 0.57 |
| Popover | 100 | 17.90 / 20.60 / 1.93 | 179.0 | 39.31 / 40.60 / 0.88 | 0.64 | 0.00 | 17 | 11 | 1 | 2.00 / 3.15 / 0.62 |
| Progress | 500 | 24.40 / 28.90 / 2.95 | 48.8 | 13.38 / 13.83 / 0.29 | 0.02 | 0.00 | 6 | 4 | 0 | – |
| RadioGroup | 300 | 398.40 / 400.38 / 15.63 | 1328.0 | 154.13 / 155.96 / 1.18 | 0.05 | 0.00 | 35 | 38 | 31 | 0.90 / 1.27 / 0.24 |
| RangeCalendar | 30 | 117.70 / 119.05 / 1.00 | 3923.3 | 823.18 / 823.57 / 0.66 | 0.87 | 0.00 | 337 | 182 | 144 | 3.70 / 5.37 / 0.86 |
| Rating | 300 | 1130.20 / 1171.78 / 33.57 | 3767.3 | 331.10 / 333.91 / 1.85 | 0.27 | 0.00 | 78 | 83 | 60 | 0.95 / 1.26 / 0.20 |
| ScrollArea | 300 | 90.30 / 104.16 / 8.98 | 301.0 | 52.04 / 52.96 / 0.63 | 0.17 | 0.00 | 36 | 13 | 7 | – |
| Select | 100 | 144.40 / 145.57 / 6.99 | 1444.0 | 206.30 / 208.26 / 1.33 | 0.47 | 0.00 | 84 | 60 | 53 | 4.55 / 6.45 / 1.22 |
| Separator | 500 | 12.70 / 16.84 / 2.66 | 25.4 | 6.93 / 7.28 / 0.22 | 0.02 | 0.00 | 3 | 3 | 0 | – |
| Slider | 500 | 176.40 / 191.70 / 11.81 | 352.8 | 52.37 / 53.45 / 0.69 | 0.03 | 0.00 | 17 | 15 | 6 | 0.60 / 0.76 / 0.15 |
| SliderArea | 300 | 80.60 / 89.60 / 7.05 | 268.7 | 44.42 / 45.26 / 0.58 | 0.12 | 0.00 | 13 | 12 | 5 | 0.50 / 0.66 / 0.10 |
| Splitter | 300 | 132.60 / 137.55 / 5.30 | 442.0 | 49.40 / 50.73 / 0.90 | 0.10 | 0.00 | 14 | 8 | 4 | 0.60 / 0.81 / 0.16 |
| Stepper | 300 | 286.70 / 295.52 / 9.30 | 955.7 | 128.91 / 130.54 / 1.09 | 0.11 | 0.00 | 68 | 40 | 6 | 1.00 / 1.30 / 0.19 |
| Switch | 500 | 41.70 / 44.85 / 2.15 | 83.4 | 16.04 / 16.48 / 0.29 | 0.03 | 0.00 | 9 | 4 | 2 | 0.10 / 0.41 / 0.14 |
| Tabs | 300 | 301.20 / 302.82 / 1.75 | 1004.0 | 146.84 / 148.69 / 1.20 | 0.12 | 0.00 | 30 | 39 | 28 | 0.75 / 1.23 / 0.27 |
| TagGroup | 300 | 335.60 / 336.41 / 3.01 | 1118.7 | 136.65 / 138.12 / 0.95 | 0.12 | 0.00 | 41 | 40 | 28 | 0.45 / 0.71 / 0.15 |
| TagsInput | 300 | 157.40 / 161.27 / 3.01 | 524.7 | 74.35 / 75.36 / 0.68 | 0.12 | 0.00 | 33 | 22 | 12 | 0.55 / 0.70 / 0.12 |
| TimeField | 300 | 114.50 / 117.02 / 2.18 | 381.7 | 70.75 / 71.60 / 0.56 | 0.15 | 0.00 | 33 | 16 | 23 | 1.45 / 2.04 / 0.32 |
| TimeRangeField | 100 | 76.20 / 79.08 / 3.92 | 762.0 | 127.89 / 129.20 / 0.88 | 0.29 | 0.00 | 59 | 28 | 44 | 1.60 / 2.04 / 0.28 |
| Toast | 100 | 53.80 / 55.06 / 1.03 | 538.0 | 75.73 / 76.37 / 0.43 | 0.50 | 0.00 | 39 | 18 | 10 | 12.45 / 15.04 / 1.62 |
| Toggle | 500 | 27.70 / 30.67 / 2.14 | 55.4 | 9.87 / 10.29 / 0.27 | 0.03 | 0.00 | 7 | 2 | 1 | 0.20 / 0.47 / 0.15 |
| ToggleGroup | 300 | 283.20 / 284.91 / 4.18 | 944.0 | 110.47 / 111.48 / 0.66 | 0.12 | 0.00 | 33 | 31 | 19 | 0.40 / 0.67 / 0.16 |
| Toolbar | 300 | 510.40 / 511.30 / 12.42 | 1701.3 | 173.93 / 175.46 / 1.00 | 0.13 | 0.00 | 42 | 57 | 23 | 0.50 / 0.71 / 0.15 |
| Tooltip | 100 | 20.20 / 20.92 / 0.57 | 202.0 | 42.32 / 43.43 / 0.83 | 0.62 | 0.00 | 17 | 11 | 6 | 1.95 / 3.38 / 0.65 |
| Tree | 200 | 279.30 / 279.39 / 3.90 | 1396.5 | 178.44 / 180.03 / 1.04 | 0.14 | 0.00 | 35 | 49 | 41 | 0.50 / 0.71 / 0.14 |
| YearPicker | 50 | 60.80 / 61.52 / 1.39 | 1216.0 | 226.56 / 228.65 / 1.57 | 0.55 | 0.00 | 128 | 68 | 26 | 1.50 / 2.46 / 0.50 |
| YearRangePicker | 50 | 68.40 / 69.21 / 1.27 | 1368.0 | 264.34 / 266.32 / 1.47 | 0.54 | 0.00 | 128 | 68 | 51 | 1.55 / 2.50 / 0.50 |
| _RefBaseline_ | 500 | 2.40 / 2.85 / 0.36 | 4.8 | 0.43 / 0.48 / 0.05 | 0.05 | 0.00 | 2 | 0 | 0 | – |
| _RefVueComponent_ | 500 | 5.20 / 6.19 / 0.86 | 10.4 | 2.10 / 2.20 / 0.08 | 0.07 | 0.00 | 2 | 1 | 0 | – |
| _RefPrimitive_ | 500 | 6.30 / 7.38 / 0.83 | 12.6 | 2.60 / 2.75 / 0.11 | 0.04 | 0.00 | 2 | 1 | 0 | – |
| _RefPrimitiveAsChild_ | 500 | 7.60 / 9.76 / 1.42 | 15.2 | 3.75 / 3.98 / 0.15 | 0.05 | 0.00 | 2 | 2 | 0 | – |

### Popups: open / close, and what a closed instance costs

| Family | open ms (med / p95 / sd) | open → painted ms (med / p95 / sd) | close ms (med / p95 / sd) | closed: mount µs / inst | closed: heap KB / inst | closed: components | closed: listeners |
|---|--:|--:|--:|--:|--:|--:|--:|
| AlertDialog | 2.40 / 2.80 / 0.34 | 3.55 / 4.78 / 0.64 | 2.00 / 3.17 / 0.60 | 238.0 | 47.09 | 13 | 1 |
| Autocomplete | 2.55 / 4.97 / 1.08 | 4.75 / 8.80 / 1.97 | 2.45 / 2.96 / 0.45 | 511.0 | 80.04 | 18 | 11 |
| Combobox | 3.00 / 5.00 / 0.96 | 5.00 / 8.47 / 1.75 | 2.40 / 3.24 / 0.54 | 521.0 | 83.51 | 18 | 12 |
| ContextMenu | 3.35 / 5.25 / 0.93 | 6.05 / 10.83 / 2.17 | 1.95 / 2.17 / 0.16 | 310.0 | 55.85 | 15 | 5 |
| DatePicker | 9.45 / 10.81 / 1.12 | 14.85 / 18.73 / 2.27 | 3.60 / 5.20 / 0.87 | 1085.0 | 133.71 | 34 | 27 |
| DateRangePicker | 10.05 / 12.21 / 1.46 | 15.25 / 19.62 / 2.73 | 4.05 / 4.57 / 0.43 | 1131.0 | 188.59 | 49 | 46 |
| Dialog | 2.15 / 2.81 / 0.39 | 3.45 / 3.90 / 0.43 | 1.80 / 2.00 / 0.27 | 181.0 | 34.01 | 9 | 1 |
| Drawer | 1.95 / 2.52 / 0.35 | 3.10 / 4.28 / 0.67 | 1.70 / 2.41 / 0.38 | 170.0 | 40.43 | 9 | 1 |
| DropdownMenu | 3.65 / 4.62 / 0.57 | 6.30 / 7.30 / 0.60 | 1.95 / 2.60 / 0.38 | 274.0 | 54.90 | 15 | 3 |
| HoverCard | 1.95 / 2.92 / 0.53 | 2.55 / 4.62 / 1.02 | 0.60 / 0.70 / 0.12 | 182.0 | 39.60 | 11 | 5 |
| Menubar | 3.30 / 3.98 / 0.40 | 5.70 / 6.16 / 0.56 | 2.45 / 2.85 / 0.32 | 1842.0 | 253.61 | 75 | 28 |
| Popover | 2.00 / 3.15 / 0.62 | 4.05 / 5.75 / 1.07 | 1.30 / 1.46 / 0.17 | 179.0 | 39.31 | 11 | 1 |
| Select | 4.55 / 6.45 / 1.22 | 8.35 / 12.88 / 2.51 | 3.95 / 5.39 / 0.85 | 1444.0 | 206.30 | 60 | 53 |
| Tooltip | 1.95 / 3.38 / 0.65 | 2.45 / 5.49 / 1.34 | 0.60 / 0.85 / 0.19 | 202.0 | 42.32 | 11 | 6 |

### Large collections (one instance)

| Family | items | mount ms | heap KB / item | open ms | ms / key (med / p95 / sd) | type ms (med / p95 / sd) | select ms | updates / key | mounts / key | qSA / key | updates / type | updates / select |
|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|
| Combobox | 1000 | 2.5 | 0.18 | 149.1 | 1.70 / 2.40 / 0.47 | 24.20 / 25.62 / 2.12 | 41.20 | 13 | 0 | 1 | 1287 | 1047 |
| Combobox | 5000 | 2.3 | 0.04 | 740.7 | 11.15 / 12.70 / 1.04 | 164.60 / 218.58 / 32.24 | 609.10 | 13 | 0 | 1 | 6358 | 5047 |
| DropdownMenu | 1000 | 1.2 | 0.10 | 261.9 | 0.75 / 1.70 / 0.42 | 2.90 / 3.34 / 0.72 | 52.30 | 3.3 | 0 | 1 | 4 | 6024 |
| DropdownMenu | 5000 | 1.3 | 0.02 | 2106.2 | 7.50 / 9.10 / 0.99 | 12.30 / 13.44 / 0.79 | 280.50 | 3.3 | 0 | 1 | 4 | 30024 |
| Listbox | 1000 | 169.5 | 20.85 | – | 53.00 / 56.45 / 2.05 | 49.40 / 51.32 / 1.00 | 106.20 | 6002 | 0 | 1 | 6002 | 6007 |
| Listbox | 5000 | 1671.4 | 20.25 | – | 805.50 / 811.85 / 5.06 | 823.05 / 843.38 / 24.94 | 2709.50 | 30002 | 0 | 1 | 30002 | 30007 |
| RadioGroup | 1000 | 396.3 | 43.35 | – | 3.70 / 4.75 / 0.85 | – | 288.50 | 10 | 0 | 1 | – | 8009 |
| RadioGroup | 5000 | 4832.8 | 42.71 | – | 23.45 / 26.77 / 2.27 | – | 14824.00 | 10 | 0 | 1 | – | 40009 |
| Select | 1000 | 312.9 | 28.34 | 443.8 | 1.50 / 2.35 / 0.47 | 1.20 / 1.70 / 0.31 | 493.70 | 12 | 0 | 1 | 12 | 16040 |
| Select | 5000 | 4113.1 | 27.76 | 6189.7 | 7.55 / 8.86 / 0.88 | 6.80 / 9.12 / 1.50 | 9245.60 | 12 | 0 | 1 | 12 | 80040 |
| Tabs | 1000 | 387.5 | 40.29 | – | 321.85 / 330.99 / 5.83 | – | 309.20 | 10008 | 0 | 1 | – | 10012 |
| Tabs | 5000 | 7423.7 | 39.74 | – | 13991.10 / 14035.29 / 154.98 | – | 14199.20 | 50008 | 0 | 1 | – | 50012 |
| ToggleGroup | 1000 | 299.2 | 29.42 | – | 2.75 / 3.90 / 0.68 | – | 177.90 | 10 | 0 | 1 | – | 8001 |
| ToggleGroup | 5000 | 4311.6 | 28.89 | – | 13.80 / 16.30 / 1.29 | – | 4471.30 | 10 | 0 | 1 | – | 40001 |
| Tree | 1000 | 239.8 | 25.97 | – | 2.40 / 3.48 / 0.62 | 1.50 / 3.26 / 0.99 | 165.40 | 8 | 0 | 1 | 8 | 7001 |
| Tree | 5000 | 2726.6 | 25.49 | – | 13.55 / 16.04 / 1.37 | 11.00 / 11.40 / 0.29 | 4275.00 | 8 | 0 | 1 | 8 | 35001 |

Component updates by component (top 4):

| Family | items | per key press | per typed character | per selection |
|---|--:|--:|--:|--:|
| Combobox | 1000 | Primitive 3, PrimitiveSlot 2, ComboboxItemIndicator 2, ListboxItemIndicator 2 | ComboboxItem 1000, Primitive 43, PrimitiveSlot 40, ComboboxItemIndicator 40 | ComboboxItem 1000, Primitive 13, PrimitiveSlot 7, Presence 5 |
| Combobox | 5000 | Primitive 3, PrimitiveSlot 2, ComboboxItemIndicator 2, ListboxItemIndicator 2 | ComboboxItem 5000, Primitive 196, PrimitiveSlot 193, ComboboxItemIndicator 193 | ComboboxItem 5000, Primitive 13, PrimitiveSlot 7, Presence 5 |
| DropdownMenu | 1000 | PrimitiveSlot 1.7, Primitive 1.7 | PrimitiveSlot 2, Primitive 2 | PrimitiveSlot 1005, Primitive 1005, DropdownMenuItem 1000, MenuItem 1000 |
| DropdownMenu | 5000 | PrimitiveSlot 1.7, Primitive 1.7 | PrimitiveSlot 2, Primitive 2 | PrimitiveSlot 5005, Primitive 5005, DropdownMenuItem 5000, MenuItem 5000 |
| Listbox | 1000 | PrimitiveSlot 1001, Primitive 1001, ListboxItem 1000, CollectionItem 1000 | PrimitiveSlot 1001, Primitive 1001, ListboxItem 1000, CollectionItem 1000 | Primitive 1003, PrimitiveSlot 1001, Presence 1001, ListboxItem 1000 |
| Listbox | 5000 | PrimitiveSlot 5001, Primitive 5001, ListboxItem 5000, CollectionItem 5000 | PrimitiveSlot 5001, Primitive 5001, ListboxItem 5000, CollectionItem 5000 | Primitive 5003, PrimitiveSlot 5001, Presence 5001, ListboxItem 5000 |
| RadioGroup | 1000 | PrimitiveSlot 4, Primitive 4, Radio 2 | – | Primitive 2003, PrimitiveSlot 2000, RadioGroupItem 1000, RovingFocusItem 1000 |
| RadioGroup | 5000 | PrimitiveSlot 4, Primitive 4, Radio 2 | – | Primitive 10003, PrimitiveSlot 10000, RadioGroupItem 5000, RovingFocusItem 5000 |
| Select | 1000 | Primitive 4, PrimitiveSlot 2, SelectItemText 2, SelectItemIndicator 2 | Primitive 4, PrimitiveSlot 2, SelectItemText 2, SelectItemIndicator 2 | Primitive 4013, PrimitiveSlot 2006, Presence 2003, SelectItemText 2002 |
| Select | 5000 | Primitive 4, PrimitiveSlot 2, SelectItemText 2, SelectItemIndicator 2 | Primitive 4, PrimitiveSlot 2, SelectItemText 2, SelectItemIndicator 2 | Primitive 20013, PrimitiveSlot 10006, Presence 10003, SelectItemText 10002 |
| Tabs | 1000 | Primitive 3003, PrimitiveSlot 2002, TabsTrigger 1000, RovingFocusItem 1000 | – | Primitive 3005, PrimitiveSlot 2002, Presence 1002, TabsTrigger 1000 |
| Tabs | 5000 | Primitive 15003, PrimitiveSlot 10002, TabsTrigger 5000, RovingFocusItem 5000 | – | Primitive 15005, PrimitiveSlot 10002, Presence 5002, TabsTrigger 5000 |
| ToggleGroup | 1000 | PrimitiveSlot 4, Primitive 4, Toggle 2 | – | Primitive 2001, PrimitiveSlot 2000, ToggleGroupItem 1000, RovingFocusItem 1000 |
| ToggleGroup | 5000 | PrimitiveSlot 4, Primitive 4, Toggle 2 | – | Primitive 10001, PrimitiveSlot 10000, ToggleGroupItem 5000, RovingFocusItem 5000 |
| Tree | 1000 | PrimitiveSlot 4, Primitive 4 | PrimitiveSlot 4, Primitive 4 | Primitive 2001, PrimitiveSlot 2000, TreeItem 1000, RovingFocusItem 1000 |
| Tree | 5000 | PrimitiveSlot 4, Primitive 4 | PrimitiveSlot 4, Primitive 4 | Primitive 10001, PrimitiveSlot 10000, TreeItem 5000, RovingFocusItem 5000 |

