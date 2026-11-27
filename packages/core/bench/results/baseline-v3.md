> **Timings in this file: pending (machine busy).** Load average was 12 to 19 during the run. Heap, DOM, listener and update counts do not depend on load and are valid.

## Bench: v3

- **Build**: reka-ui 3.0.0-alpha.0 (HEAD @ 68fee3dd8, source last changed in ce07331d2), production dist, Vue 3.5.46
- **Browser**: headless Chromium 153.0.8010.12, Node v24.19.0
- **Machine**: Apple M1 Pro, 10 cores, 16 GB, darwin 25.6.0 arm64
- **Run**: 2026-11-26T09:01:26.147Z, 101s, 1 page load(s) × 3 round(s) per family
- **Load (1 min)**: 14.63 at start (not gated), max 19.44 during the run, 13.87 at the end; caffeinate on, sleep events 0
- **Timings**: not gated on load: treat as indicative

### Mount, retained heap, interaction (per family)

| Family | N | mount ms (med / p95 / sd) | µs / inst | heap KB / inst (med / p95 / sd) | after unmount KB / inst | leaked nodes / inst | DOM nodes | components | listeners | interaction ms (med / p95 / sd) |
|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|
| Accordion | 300 | 141.70 / 150.25 / 5.73 | 472.3 | 100.35 / 102.08 / 1.12 | 0.18 | 0.00 | 53 | 25 | 12 | 1.00 / 1.53 / 0.26 |
| AlertDialog | 100 | 11.50 / 12.67 / 0.85 | 115.0 | 19.37 / 19.46 / 0.35 | 0.95 | 0.00 | 9 | 4 | 1 | 1.50 / 2.08 / 0.31 |
| AspectRatio | 500 | 13.20 / 17.43 / 2.74 | 26.4 | 4.22 / 4.44 / 0.15 | 0.03 | 0.00 | 6 | 1 | 0 | – |
| Autocomplete | 100 | 21.30 / 21.84 / 1.19 | 213.0 | 40.80 / 42.30 / 0.96 | 0.29 | 0.00 | 19 | 6 | 13 | 2.30 / 3.35 / 0.58 |
| Avatar | 500 | 41.20 / 51.64 / 6.73 | 82.4 | 12.34 / 12.86 / 0.34 | 0.02 | 0.00 | 6 | 3 | 2 | – |
| Calendar | 30 | 55.50 / 58.38 / 2.08 | 1850.0 | 331.68 / 331.83 / 0.34 | 0.47 | 0.00 | 171 | 91 | 72 | 2.20 / 2.72 / 0.28 |
| Checkbox | 500 | 22.20 / 27.60 / 4.50 | 44.4 | 9.39 / 9.75 / 0.24 | 0.04 | 0.00 | 7 | 2 | 2 | 0.50 / 0.98 / 0.29 |
| CheckboxGroup | 300 | 87.50 / 91.55 / 5.37 | 291.7 | 52.12 / 52.77 / 0.49 | 0.22 | 0.00 | 32 | 9 | 17 | 0.45 / 0.60 / 0.14 |
| Collapsible | 500 | 47.60 / 55.07 / 4.97 | 95.2 | 18.03 / 18.88 / 0.55 | 0.07 | 0.00 | 9 | 4 | 3 | 0.60 / 0.92 / 0.19 |
| ColorArea | 300 | 48.80 / 51.68 / 2.36 | 162.7 | 18.04 / 18.30 / 0.30 | 0.29 | 0.00 | 22 | 3 | 8 | 0.75 / 0.91 / 0.13 |
| ColorField | 500 | 32.00 / 36.05 / 3.04 | 64.0 | 12.91 / 13.32 / 0.28 | 0.04 | 0.00 | 8 | 2 | 8 | 0.60 / 0.80 / 0.13 |
| ColorSlider | 500 | 84.40 / 93.49 / 5.98 | 168.8 | 34.42 / 35.08 / 0.42 | 0.04 | 0.00 | 13 | 6 | 6 | 0.60 / 0.81 / 0.14 |
| ColorSwatch | 500 | 9.30 / 11.64 / 1.59 | 18.6 | 3.42 / 3.63 / 0.15 | 0.07 | 0.00 | 3 | 1 | 0 | – |
| ColorSwatchPicker | 200 | 130.10 / 138.20 / 5.71 | 650.5 | 134.77 / 135.82 / 0.82 | 0.36 | 0.00 | 57 | 35 | 20 | 0.90 / 1.21 / 0.21 |
| Combobox | 100 | 20.30 / 20.75 / 0.32 | 203.0 | 41.36 / 42.65 / 0.83 | 0.26 | 0.00 | 20 | 6 | 13 | 2.15 / 3.73 / 0.79 |
| ContextMenu | 100 | 9.40 / 9.67 / 1.31 | 94.0 | 16.25 / 16.34 / 0.20 | 0.89 | 0.00 | 9 | 4 | 5 | 2.55 / 3.56 / 0.59 |
| DateField | 200 | 110.60 / 112.94 / 4.97 | 553.0 | 39.98 / 40.26 / 0.34 | 0.30 | 0.00 | 32 | 7 | 23 | 1.60 / 1.91 / 0.18 |
| DatePicker | 100 | 85.20 / 85.65 / 4.94 | 852.0 | 87.57 / 88.43 / 0.69 | 0.46 | 0.00 | 45 | 19 | 25 | 4.45 / 6.01 / 0.91 |
| DateRangeField | 100 | 49.20 / 49.92 / 0.66 | 492.0 | 63.68 / 64.18 / 0.45 | 0.47 | 0.00 | 31 | 12 | 44 | 1.10 / 1.73 / 0.30 |
| DateRangePicker | 100 | 82.50 / 98.07 / 11.51 | 825.0 | 122.63 / 124.27 / 1.07 | 0.41 | 0.00 | 43 | 29 | 46 | 4.70 / 5.96 / 0.67 |
| Dialog | 100 | 7.80 / 9.24 / 1.22 | 78.0 | 16.64 / 16.67 / 0.24 | 1.06 | 0.00 | 7 | 3 | 1 | 1.30 / 2.38 / 0.51 |
| Drawer | 100 | 6.60 / 7.32 / 0.95 | 66.0 | 14.26 / 14.56 / 0.41 | 1.03 | 0.00 | 7 | 3 | 1 | 1.30 / 1.94 / 0.34 |
| DropdownMenu | 100 | 10.00 / 11.17 / 0.93 | 100.0 | 20.13 / 20.28 / 0.26 | 0.80 | 0.00 | 9 | 4 | 2 | 2.55 / 3.58 / 0.56 |
| Editable | 300 | 80.70 / 83.40 / 4.86 | 269.0 | 40.59 / 40.98 / 0.30 | 0.15 | 0.00 | 29 | 14 | 8 | 0.50 / 1.02 / 0.24 |
| Field | 300 | 56.60 / 56.78 / 0.53 | 188.7 | 35.89 / 36.42 / 0.41 | 0.29 | 0.00 | 17 | 7 | 6 | 0.80 / 1.00 / 0.16 |
| Form | 200 | 104.90 / 106.43 / 5.58 | 524.5 | 99.94 / 101.45 / 1.04 | 0.20 | 0.00 | 44 | 19 | 19 | 0.80 / 1.00 / 0.14 |
| HoverCard | 100 | 6.90 / 7.89 / 1.20 | 69.0 | 13.40 / 13.60 / 0.39 | 1.15 | 0.00 | 9 | 4 | 5 | 1.65 / 2.56 / 0.53 |
| Label | 500 | 11.70 / 12.78 / 1.15 | 23.4 | 4.28 / 4.44 / 0.12 | 0.07 | 0.00 | 4 | 1 | 1 | – |
| Listbox | 300 | 94.20 / 112.29 / 17.47 | 314.0 | 74.43 / 74.72 / 0.23 | 0.24 | 0.00 | 34 | 12 | 20 | 0.80 / 1.16 / 0.17 |
| Menubar | 100 | 35.90 / 36.17 / 2.40 | 359.0 | 57.87 / 58.99 / 0.83 | 0.50 | 0.00 | 32 | 13 | 23 | 2.20 / 3.48 / 0.70 |
| NavigationMenu | 100 | 33.10 / 34.00 / 2.03 | 331.0 | 63.62 / 64.89 / 1.08 | 1.04 | 0.00 | 50 | 14 | 15 | 1.25 / 2.16 / 0.51 |
| NumberField | 300 | 59.10 / 59.28 / 0.15 | 197.0 | 36.92 / 37.10 / 0.16 | 0.17 | 0.00 | 16 | 4 | 18 | 1.10 / 1.25 / 0.11 |
| Pagination | 300 | 64.00 / 68.50 / 5.15 | 213.3 | 46.04 / 46.32 / 0.29 | 0.15 | 0.00 | 66 | 13 | 10 | 0.20 / 0.47 / 0.14 |
| PinInput | 300 | 99.90 / 101.97 / 7.34 | 333.0 | 44.90 / 45.32 / 0.35 | 0.14 | 0.00 | 29 | 8 | 33 | 1.50 / 1.70 / 0.15 |
| Popover | 100 | 10.10 / 10.82 / 0.61 | 101.0 | 20.32 / 20.37 / 0.39 | 1.10 | 0.00 | 9 | 4 | 1 | 1.50 / 2.33 / 0.41 |
| Progress | 500 | 15.70 / 18.76 / 2.06 | 31.4 | 8.31 / 8.64 / 0.22 | 0.03 | 0.00 | 6 | 2 | 0 | – |
| RadioGroup | 300 | 88.40 / 93.80 / 4.29 | 294.7 | 59.29 / 60.24 / 0.64 | 0.14 | 0.00 | 35 | 11 | 17 | 0.60 / 1.06 / 0.23 |
| RangeCalendar | 30 | 54.80 / 54.89 / 0.49 | 1826.7 | 357.91 / 358.19 / 0.57 | 0.57 | 0.00 | 172 | 91 | 144 | 2.00 / 2.42 / 0.26 |
| Rating | 300 | 316.30 / 332.50 / 11.08 | 1054.3 | 173.57 / 175.10 / 1.04 | 0.25 | 0.00 | 78 | 37 | 41 | 0.40 / 0.88 / 0.23 |
| ScrollArea | 300 | 70.30 / 73.18 / 4.40 | 234.3 | 42.19 / 42.89 / 0.53 | 0.27 | 0.00 | 36 | 13 | 7 | – |
| Select | 100 | 14.80 / 15.25 / 0.50 | 148.0 | 29.53 / 30.57 / 0.69 | 0.35 | 0.00 | 17 | 6 | 6 | 2.05 / 3.08 / 0.52 |
| Separator | 500 | 7.80 / 9.24 / 1.18 | 15.6 | 3.22 / 3.44 / 0.15 | 0.05 | 0.00 | 3 | 1 | 0 | – |
| Slider | 500 | 70.70 / 73.76 / 3.15 | 141.4 | 23.34 / 23.86 / 0.34 | 0.04 | 0.00 | 13 | 4 | 6 | 0.35 / 0.60 / 0.14 |
| Splitter | 300 | 132.50 / 145.55 / 10.13 | 441.7 | 48.64 / 49.41 / 0.52 | 0.12 | 0.00 | 14 | 8 | 4 | 0.50 / 0.66 / 0.10 |
| Stepper | 300 | 152.20 / 171.91 / 13.66 | 507.3 | 91.76 / 92.66 / 0.65 | 0.09 | 0.00 | 68 | 36 | 6 | 0.60 / 0.90 / 0.16 |
| Switch | 500 | 24.80 / 27.50 / 2.16 | 49.6 | 9.98 / 10.27 / 0.20 | 0.05 | 0.00 | 9 | 2 | 2 | 0.10 / 0.31 / 0.10 |
| Tabs | 300 | 106.80 / 108.87 / 7.68 | 356.0 | 62.75 / 63.39 / 0.48 | 0.24 | 0.00 | 28 | 11 | 20 | 0.50 / 0.82 / 0.18 |
| TagGroup | 300 | 110.20 / 111.10 / 12.88 | 367.3 | 52.99 / 53.36 / 0.29 | 0.14 | 0.00 | 41 | 10 | 22 | 0.20 / 0.41 / 0.12 |
| TagsInput | 300 | 68.20 / 68.20 / 0.52 | 227.3 | 36.49 / 37.15 / 0.43 | 0.16 | 0.00 | 33 | 8 | 10 | 0.45 / 0.70 / 0.17 |
| TimeField | 300 | 106.40 / 110.54 / 11.32 | 354.7 | 41.62 / 41.79 / 0.25 | 0.30 | 0.00 | 21 | 8 | 23 | 1.40 / 1.75 / 0.24 |
| TimeRangeField | 100 | 50.80 / 51.88 / 2.44 | 508.0 | 70.30 / 71.12 / 0.59 | 0.40 | 0.00 | 35 | 14 | 44 | 1.20 / 1.41 / 0.12 |
| Toast | 100 | 23.70 / 24.78 / 0.87 | 237.0 | 44.77 / 45.17 / 0.26 | 0.41 | 0.00 | 39 | 8 | 8 | 4.85 / 7.37 / 1.10 |
| Toggle | 500 | 18.20 / 20.09 / 1.76 | 36.4 | 6.34 / 6.64 / 0.21 | 0.06 | 0.00 | 7 | 1 | 1 | 0.10 / 0.35 / 0.13 |
| ToggleGroup | 300 | 96.90 / 105.54 / 5.66 | 323.0 | 50.42 / 51.03 / 0.43 | 0.21 | 0.00 | 33 | 9 | 14 | 0.20 / 0.47 / 0.14 |
| Toolbar | 300 | 135.20 / 140.78 / 4.82 | 450.7 | 69.91 / 70.64 / 0.54 | 0.26 | 0.00 | 42 | 17 | 16 | 0.20 / 0.41 / 0.10 |
| Tooltip | 100 | 8.20 / 8.65 / 0.32 | 82.0 | 17.24 / 17.25 / 0.43 | 1.10 | 0.00 | 9 | 4 | 6 | 1.70 / 2.63 / 0.49 |
| Tree | 200 | 85.20 / 87.36 / 8.46 | 426.0 | 65.64 / 66.13 / 0.37 | 0.22 | 0.00 | 35 | 7 | 29 | 0.25 / 0.51 / 0.14 |
| _RefBaseline_ | 500 | 2.40 / 2.85 / 0.32 | 4.8 | 0.42 / 0.48 / 0.05 | 0.05 | 0.00 | 2 | 0 | 0 | – |
| _RefVueComponent_ | 500 | 4.80 / 5.88 / 0.79 | 9.6 | 2.08 / 2.19 / 0.09 | 0.07 | 0.00 | 2 | 1 | 0 | – |
| _RefPrimitive_ | 500 | 5.50 / 7.12 / 1.04 | 11.0 | 2.26 / 2.37 / 0.08 | 0.04 | 0.00 | 2 | 1 | 0 | – |
| _RefPrimitiveAsChild_ | 500 | 7.90 / 9.61 / 1.10 | 15.8 | 3.46 / 3.67 / 0.14 | 0.04 | 0.00 | 2 | 2 | 0 | – |

### Popups: open / close, and what a closed instance costs

| Family | open ms (med / p95 / sd) | open → painted ms (med / p95 / sd) | close ms (med / p95 / sd) | closed: mount µs / inst | closed: heap KB / inst | closed: components | closed: listeners |
|---|--:|--:|--:|--:|--:|--:|--:|
| AlertDialog | 1.50 / 2.08 / 0.31 | 3.35 / 5.19 / 0.92 | 1.30 / 1.77 / 0.30 | 115.0 | 19.37 | 4 | 1 |
| Autocomplete | 2.30 / 3.35 / 0.58 | 4.75 / 8.93 / 2.17 | 2.35 / 2.81 / 0.31 | 213.0 | 40.80 | 6 | 13 |
| Combobox | 2.15 / 3.73 / 0.79 | 4.35 / 7.85 / 1.66 | 2.25 / 2.92 / 0.39 | 203.0 | 41.36 | 6 | 13 |
| ContextMenu | 2.55 / 3.56 / 0.59 | 5.50 / 8.60 / 1.63 | 1.25 / 1.96 / 0.39 | 94.0 | 16.25 | 4 | 5 |
| DatePicker | 4.45 / 6.01 / 0.91 | 6.65 / 9.32 / 1.32 | 2.20 / 2.65 / 0.29 | 852.0 | 87.57 | 19 | 25 |
| DateRangePicker | 4.70 / 5.96 / 0.67 | 7.25 / 9.01 / 0.88 | 2.70 / 3.10 / 0.27 | 825.0 | 122.63 | 29 | 46 |
| Dialog | 1.30 / 2.38 / 0.51 | 2.95 / 4.24 / 0.65 | 1.10 / 1.50 / 0.21 | 78.0 | 16.64 | 3 | 1 |
| Drawer | 1.30 / 1.94 / 0.34 | 3.10 / 3.71 / 0.38 | 1.20 / 1.46 / 0.20 | 66.0 | 14.26 | 3 | 1 |
| DropdownMenu | 2.55 / 3.58 / 0.56 | 5.35 / 7.66 / 1.26 | 1.30 / 1.46 / 0.14 | 100.0 | 20.13 | 4 | 2 |
| HoverCard | 1.65 / 2.56 / 0.53 | 2.55 / 4.09 / 0.93 | 0.60 / 0.85 / 0.20 | 69.0 | 13.40 | 4 | 5 |
| Menubar | 2.20 / 3.48 / 0.70 | 4.45 / 7.09 / 1.45 | 1.70 / 2.11 / 0.20 | 359.0 | 57.87 | 13 | 23 |
| Popover | 1.50 / 2.33 / 0.41 | 3.25 / 5.48 / 1.08 | 1.10 / 1.20 / 0.07 | 101.0 | 20.32 | 4 | 1 |
| Select | 2.05 / 3.08 / 0.52 | 4.70 / 6.78 / 1.14 | 1.30 / 1.77 / 0.33 | 148.0 | 29.53 | 6 | 6 |
| Tooltip | 1.70 / 2.63 / 0.49 | 2.50 / 4.20 / 0.88 | 0.65 / 0.80 / 0.16 | 82.0 | 17.24 | 4 | 6 |

### Large collections (one instance)

| Family | items | mount ms | heap KB / item | open ms | ms / key (med / p95 / sd) | type ms (med / p95 / sd) | select ms | updates / key | mounts / key | qSA / key | updates / type | updates / select |
|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|
| Combobox | 1000 | 1.3 | 0.09 | 123.5 | 0.10 / 0.20 / 0.12 | 13.90 / 19.18 / 3.04 | 32.60 | 7 | 0 | 0 | 968 | 4012 |
| Combobox | 5000 | 1.5 | 0.02 | 516.9 | 0.40 / 0.85 / 0.25 | 84.50 / 117.10 / 18.89 | 189.50 | 7 | 0 | 0 | 4815 | 20012 |
| DropdownMenu | 1000 | 1.1 | 0.04 | 95.5 | 0.10 / 0.26 / 1.33 | 0.80 / 1.48 / 0.38 | 25.60 | 334.7 | 0 | 0.3 | 2 | 3011 |
| DropdownMenu | 5000 | 0.9 | 0.01 | 373.5 | 0.10 / 0.42 / 6.43 | 5.50 / 6.74 / 0.80 | 119.00 | 1668 | 0 | 0.3 | 2 | 15011 |
| Listbox | 1000 | 43.1 | 10.91 | – | 0.10 / 0.26 / 0.12 | 1.00 / 1.78 / 0.48 | 1.30 | 4 | 0 | 0 | 4 | 5 |
| Listbox | 5000 | 176.9 | 10.47 | – | 0.40 / 1.16 / 0.32 | 5.40 / 6.58 / 0.78 | 3.20 | 4 | 0 | 0 | 4 | 5 |
| RadioGroup | 1000 | 77.4 | 15.34 | – | 0.10 / 0.35 / 0.29 | – | 5.50 | 4 | 0 | 0.3 | – | 12 |
| RadioGroup | 5000 | 331.7 | 14.90 | – | 0.20 / 0.62 / 1.37 | – | 24.00 | 4 | 0 | 0.3 | – | 12 |
| Select | 1000 | 1.0 | 0.06 | 67.8 | 0.25 / 0.66 / 0.19 | 1.30 / 2.04 / 0.64 | 11.60 | 6 | 0 | 0 | 6 | 19 |
| Select | 5000 | 1.0 | 0.01 | 264.3 | 1.40 / 2.20 / 0.42 | 6.50 / 8.68 / 1.25 | 59.90 | 6 | 0 | 0 | 6 | 19 |
| Tabs | 1000 | 77.1 | 15.96 | – | 0.10 / 0.26 / 0.19 | – | 25.80 | 2 | 0 | 0.3 | – | 4006 |
| Tabs | 5000 | 430.8 | 15.44 | – | 0.20 / 0.46 / 0.66 | – | 130.00 | 2 | 0 | 0.3 | – | 20006 |
| ToggleGroup | 1000 | 87.6 | 12.24 | – | 0.10 / 0.31 / 0.24 | – | 29.60 | 4 | 0 | 0.3 | – | 2001 |
| ToggleGroup | 5000 | 500.9 | 11.73 | – | 0.20 / 0.40 / 1.24 | – | 271.40 | 4 | 0 | 0.3 | – | 10001 |
| Tree | 1000 | 59.3 | 8.79 | – | 0.90 / 1.31 / 0.27 | 1.00 / 1.38 / 0.31 | 16.80 | 2 | 0 | 0.3 | 2 | 1001 |
| Tree | 5000 | 247.2 | 8.39 | – | 5.95 / 7.10 / 1.19 | 4.90 / 6.10 / 1.05 | 136.70 | 2 | 0 | 0.3 | 2 | 5001 |

Component updates by component (top 4):

| Family | items | per key press | per typed character | per selection |
|---|--:|--:|--:|--:|
| Combobox | 1000 | ListboxItem 2, ComboboxItemIndicator 2, ListboxItemIndicator 2, ComboboxInput 1 | ListboxItem 962, ComboboxInput 3, ComboboxEmpty 1, ComboboxItemIndicator 1 | ComboboxItem 1000, ListboxItem 1000, ComboboxItemIndicator 1000, ListboxItemIndicator 1000 |
| Combobox | 5000 | ListboxItem 2, ComboboxItemIndicator 2, ListboxItemIndicator 2, ComboboxInput 1 | ListboxItem 4809, ComboboxInput 3, ComboboxEmpty 1, ComboboxItemIndicator 1 | ComboboxItem 5000, ListboxItem 5000, ComboboxItemIndicator 5000, ListboxItemIndicator 5000 |
| DropdownMenu | 1000 | MenuItemImpl 334.7 | MenuItemImpl 2 | DropdownMenuItem 1000, MenuItem 1000, MenuItemImpl 1000, Presence 3 |
| DropdownMenu | 5000 | MenuItemImpl 1668 | MenuItemImpl 2 | DropdownMenuItem 5000, MenuItem 5000, MenuItemImpl 5000, Presence 3 |
| Listbox | 1000 | ListboxItem 2, ListboxItemIndicator 2 | ListboxItem 2, ListboxItemIndicator 2 | ListboxItem 2, ListboxItemIndicator 2, ListboxRoot 1 |
| Listbox | 5000 | ListboxItem 2, ListboxItemIndicator 2 | ListboxItem 2, ListboxItemIndicator 2 | ListboxItem 2, ListboxItemIndicator 2, ListboxRoot 1 |
| RadioGroup | 1000 | RadioGroupItem 2, Radio 2 | – | RadioGroupItem 3, Radio 3, RadioGroupIndicator 3, Presence 2 |
| RadioGroup | 5000 | RadioGroupItem 2, Radio 2 | – | RadioGroupItem 3, Radio 3, RadioGroupIndicator 3, Presence 2 |
| Select | 1000 | SelectItem 2, SelectItemText 2, SelectItemIndicator 2 | SelectItem 2, SelectItemText 2, SelectItemIndicator 2 | SelectItem 3, SelectItemText 3, SelectItemIndicator 3, Presence 3 |
| Select | 5000 | SelectItem 2, SelectItemText 2, SelectItemIndicator 2 | SelectItem 2, SelectItemText 2, SelectItemIndicator 2 | SelectItem 3, SelectItemText 3, SelectItemIndicator 3, Presence 3 |
| Tabs | 1000 | TabsTrigger 2 | – | TabsTrigger 2003, Presence 1002, TabsContent 1000, TabsRoot 1 |
| Tabs | 5000 | TabsTrigger 2 | – | TabsTrigger 10003, Presence 5002, TabsContent 5000, TabsRoot 1 |
| ToggleGroup | 1000 | ToggleGroupItem 2, Toggle 2 | – | ToggleGroupItem 1000, Toggle 1000, PrimitiveSlot 1 |
| ToggleGroup | 5000 | ToggleGroupItem 2, Toggle 2 | – | ToggleGroupItem 5000, Toggle 5000, PrimitiveSlot 1 |
| Tree | 1000 | TreeItem 2 | TreeItem 2 | TreeItem 1000, TreeRoot 1 |
| Tree | 5000 | TreeItem 2 | TreeItem 2 | TreeItem 5000, TreeRoot 1 |

Not in this build: Carousel (CarouselContent, CarouselIndicator, CarouselItem, …); MonthPicker (MonthPickerCell, MonthPickerCellTrigger, MonthPickerGrid, …); MonthRangePicker (MonthRangePickerCell, MonthRangePickerCellTrigger, MonthRangePickerGrid, …); SliderArea (SliderAreaArea, SliderAreaRegion, SliderAreaRoot, …); YearPicker (YearPickerCell, YearPickerCellTrigger, YearPickerGrid, …); YearRangePicker (YearRangePickerCell, YearRangePickerCellTrigger, YearRangePickerGrid, …)

