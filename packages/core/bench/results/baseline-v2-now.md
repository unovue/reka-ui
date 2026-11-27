> **Timings in this file: pending (machine busy).** Load average was 12 to 19 during the run. Heap, DOM, listener and update counts do not depend on load and are valid.

## Bench: v2-now

- **Build**: reka-ui 2.11.0 (perf/gated-timing-baseline @ dfa3406d4, source last changed in dfa3406d4), production dist, Vue 3.5.46
- **Browser**: headless Chromium 153.0.8010.12, Node v24.19.0
- **Machine**: Apple M1 Pro, 10 cores, 16 GB, darwin 25.6.0 arm64
- **Run**: 2026-11-26T08:58:17.117Z, 185s, 1 page load(s) × 3 round(s) per family
- **Load (1 min)**: 11.82 at start (not gated), max 14.81 during the run, 14.34 at the end; caffeinate on, sleep events 0
- **Timings**: not gated on load: treat as indicative

### Mount, retained heap, interaction (per family)

| Family | N | mount ms (med / p95 / sd) | µs / inst | heap KB / inst (med / p95 / sd) | after unmount KB / inst | leaked nodes / inst | DOM nodes | components | listeners | interaction ms (med / p95 / sd) |
|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|
| Accordion | 300 | 183.70 / 185.41 / 2.96 | 612.3 | 113.16 / 114.25 / 0.72 | 0.06 | 0.00 | 41 | 32 | 21 | 0.85 / 1.72 / 0.43 |
| AlertDialog | 100 | 21.50 / 24.65 / 2.40 | 215.0 | 47.00 / 48.16 / 0.79 | 0.68 | 0.00 | 20 | 13 | 1 | 2.10 / 2.84 / 0.43 |
| AspectRatio | 500 | 16.70 / 19.04 / 1.66 | 33.4 | 5.98 / 6.34 / 0.23 | 0.03 | 0.00 | 6 | 2 | 0 | – |
| Autocomplete | 100 | 49.20 / 49.56 / 1.92 | 492.0 | 77.89 / 79.13 / 1.05 | 0.49 | 0.00 | 29 | 17 | 11 | 2.95 / 3.64 / 0.45 |
| Avatar | 500 | 54.80 / 56.60 / 3.00 | 109.6 | 16.13 / 16.61 / 0.31 | 0.06 | 0.00 | 6 | 5 | 2 | – |
| Calendar | 30 | 107.30 / 111.08 / 4.15 | 3576.7 | 664.42 / 664.96 / 0.36 | 0.98 | 0.00 | 337 | 182 | 72 | 3.85 / 6.11 / 1.09 |
| Carousel | 100 | 103.90 / 105.61 / 2.05 | 1039.0 | 130.09 / 131.30 / 0.83 | 0.23 | 0.00 | 56 | 30 | 21 | 0.70 / 0.80 / 0.12 |
| Checkbox | 500 | 38.60 / 41.93 / 2.23 | 77.2 | 20.85 / 21.30 / 0.30 | 0.05 | 0.00 | 7 | 4 | 4 | 0.55 / 1.06 / 0.25 |
| CheckboxGroup | 300 | 228.20 / 228.38 / 7.62 | 760.7 | 118.70 / 119.83 / 0.73 | 0.13 | 0.00 | 38 | 21 | 28 | 0.55 / 0.80 / 0.15 |
| Collapsible | 500 | 80.20 / 86.59 / 4.38 | 160.4 | 27.04 / 27.84 / 0.51 | 0.03 | 0.00 | 9 | 7 | 6 | 0.60 / 0.81 / 0.13 |
| ColorArea | 300 | 44.50 / 48.55 / 3.12 | 148.3 | 22.02 / 22.51 / 0.34 | 0.12 | 0.00 | 11 | 6 | 6 | 0.30 / 0.50 / 0.13 |
| ColorField | 500 | 40.30 / 45.43 / 3.48 | 80.6 | 15.69 / 16.09 / 0.26 | 0.03 | 0.00 | 8 | 4 | 8 | 0.70 / 0.80 / 0.06 |
| ColorSlider | 500 | 176.30 / 185.39 / 7.56 | 352.6 | 59.57 / 60.48 / 0.59 | 0.04 | 0.00 | 17 | 16 | 6 | 0.60 / 0.86 / 0.15 |
| ColorSwatch | 500 | 13.50 / 14.76 / 0.98 | 27.0 | 5.40 / 5.68 / 0.18 | 0.04 | 0.00 | 3 | 2 | 0 | – |
| ColorSwatchPicker | 200 | 220.40 / 225.08 / 8.55 | 1102.0 | 189.21 / 191.17 / 1.28 | 0.22 | 0.00 | 57 | 63 | 23 | 1.15 / 1.57 / 0.33 |
| Combobox | 100 | 50.10 / 53.07 / 2.86 | 501.0 | 81.56 / 82.84 / 0.97 | 0.55 | 0.00 | 29 | 17 | 12 | 3.05 / 4.49 / 0.82 |
| ContextMenu | 100 | 28.20 / 30.00 / 2.00 | 282.0 | 53.30 / 53.72 / 0.29 | 0.74 | 0.00 | 25 | 14 | 5 | 2.60 / 3.50 / 0.46 |
| DateField | 200 | 128.60 / 133.46 / 4.21 | 643.0 | 66.11 / 66.83 / 0.57 | 0.26 | 0.00 | 41 | 14 | 25 | 1.75 / 2.17 / 0.26 |
| DatePicker | 100 | 108.40 / 108.76 / 1.00 | 1084.0 | 128.34 / 129.73 / 0.96 | 0.71 | 0.00 | 74 | 33 | 27 | 7.65 / 9.65 / 1.21 |
| DateRangeField | 100 | 68.80 / 71.68 / 3.35 | 688.0 | 111.25 / 112.18 / 0.65 | 0.27 | 0.00 | 51 | 24 | 44 | 1.40 / 1.66 / 0.16 |
| DateRangePicker | 100 | 104.00 / 104.72 / 3.95 | 1040.0 | 180.83 / 182.44 / 1.07 | 0.57 | 0.00 | 93 | 48 | 46 | 7.75 / 10.21 / 1.27 |
| Dialog | 100 | 17.10 / 18.00 / 0.68 | 171.0 | 33.75 / 34.98 / 0.81 | 0.62 | 0.00 | 16 | 9 | 1 | 2.05 / 2.72 / 0.44 |
| Drawer | 100 | 17.70 / 19.77 / 1.65 | 177.0 | 40.03 / 41.65 / 1.08 | 0.55 | 0.00 | 16 | 9 | 1 | 1.85 / 2.65 / 0.47 |
| DropdownMenu | 100 | 24.40 / 24.94 / 2.62 | 244.0 | 52.44 / 54.35 / 1.33 | 1.02 | 0.00 | 21 | 14 | 3 | 3.40 / 4.02 / 0.40 |
| Editable | 300 | 91.20 / 93.36 / 1.55 | 304.0 | 38.89 / 39.29 / 0.30 | 0.19 | 0.00 | 29 | 14 | 10 | 1.05 / 1.35 / 0.19 |
| Field | 300 | 87.20 / 87.92 / 3.43 | 290.7 | 48.54 / 49.28 / 0.57 | 0.30 | 0.00 | 17 | 11 | 6 | 1.00 / 1.05 / 0.10 |
| Form | 200 | 142.70 / 143.15 / 1.38 | 713.5 | 134.37 / 135.87 / 1.06 | 0.03 | 0.00 | 44 | 29 | 20 | 0.85 / 1.16 / 0.18 |
| HoverCard | 100 | 17.30 / 19.19 / 1.72 | 173.0 | 37.23 / 38.38 / 0.76 | 0.48 | 0.00 | 17 | 10 | 5 | 1.90 / 2.53 / 0.39 |
| Label | 500 | 13.30 / 15.91 / 2.07 | 26.6 | 5.37 / 5.62 / 0.16 | 0.03 | 0.00 | 4 | 2 | 1 | – |
| Listbox | 300 | 247.20 / 258.27 / 7.89 | 824.0 | 121.90 / 122.59 / 0.58 | 0.18 | 0.00 | 34 | 36 | 20 | 1.10 / 1.35 / 0.17 |
| Menubar | 100 | 147.80 / 157.70 / 9.45 | 1478.0 | 222.62 / 226.83 / 3.56 | 2.86 | 0.00 | 68 | 62 | 28 | 3.10 / 3.87 / 0.39 |
| MonthPicker | 50 | 61.40 / 62.30 / 1.26 | 1228.0 | 211.29 / 212.33 / 0.90 | 0.53 | 0.00 | 128 | 68 | 26 | 1.80 / 2.38 / 0.33 |
| MonthRangePicker | 50 | 73.40 / 80.69 / 6.43 | 1468.0 | 249.23 / 250.06 / 0.82 | 0.54 | 0.00 | 128 | 68 | 51 | 1.75 / 2.48 / 0.35 |
| NavigationMenu | 100 | 60.60 / 70.77 / 6.93 | 606.0 | 116.79 / 118.48 / 1.22 | 0.91 | 0.00 | 50 | 31 | 17 | 1.80 / 2.65 / 0.49 |
| NumberField | 300 | 96.20 / 96.74 / 1.53 | 320.7 | 46.85 / 47.41 / 0.41 | 0.10 | 0.00 | 16 | 8 | 18 | 1.30 / 1.60 / 0.17 |
| Pagination | 300 | 113.90 / 118.13 / 3.23 | 379.7 | 76.46 / 76.85 / 0.30 | 0.23 | 0.00 | 66 | 26 | 10 | 0.30 / 0.56 / 0.11 |
| PinInput | 300 | 141.90 / 144.24 / 6.82 | 473.0 | 59.37 / 60.21 / 0.57 | 0.09 | 0.00 | 24 | 13 | 33 | 1.70 / 1.80 / 0.11 |
| Popover | 100 | 18.70 / 18.88 / 0.36 | 187.0 | 36.88 / 38.64 / 1.18 | 0.59 | 0.00 | 17 | 10 | 1 | 2.00 / 2.85 / 0.52 |
| Progress | 500 | 24.40 / 28.09 / 2.49 | 48.8 | 12.59 / 12.95 / 0.23 | 0.03 | 0.00 | 6 | 4 | 0 | – |
| RadioGroup | 300 | 256.70 / 264.80 / 5.38 | 855.7 | 128.35 / 129.47 / 0.75 | 0.15 | 0.00 | 35 | 28 | 31 | 0.95 / 1.32 / 0.23 |
| RangeCalendar | 30 | 126.60 / 127.41 / 5.13 | 4220.0 | 780.55 / 781.23 / 0.56 | 0.53 | 0.00 | 337 | 182 | 144 | 4.00 / 5.63 / 0.85 |
| Rating | 300 | 672.30 / 700.65 / 23.73 | 2241.0 | 277.89 / 279.26 / 0.89 | 0.20 | 0.00 | 78 | 62 | 60 | 0.90 / 1.16 / 0.18 |
| ScrollArea | 300 | 82.90 / 92.71 / 7.51 | 276.3 | 49.37 / 50.18 / 0.55 | 0.16 | 0.00 | 36 | 13 | 7 | – |
| Select | 100 | 86.80 / 91.21 / 4.17 | 868.0 | 170.23 / 171.59 / 0.89 | 0.52 | 0.00 | 84 | 54 | 53 | 3.60 / 4.55 / 0.67 |
| Separator | 500 | 12.50 / 14.21 / 1.13 | 25.0 | 6.48 / 6.78 / 0.19 | 0.02 | 0.00 | 3 | 3 | 0 | – |
| Slider | 500 | 167.40 / 176.04 / 7.51 | 334.8 | 50.77 / 51.64 / 0.57 | 0.02 | 0.00 | 17 | 15 | 6 | 0.60 / 0.80 / 0.13 |
| SliderArea | 300 | 77.20 / 78.01 / 1.05 | 257.3 | 42.55 / 43.03 / 0.38 | 0.14 | 0.00 | 13 | 12 | 5 | 0.55 / 0.77 / 0.16 |
| Splitter | 300 | 127.80 / 137.07 / 6.39 | 426.0 | 47.10 / 48.24 / 0.78 | 0.11 | 0.00 | 14 | 8 | 4 | 0.60 / 0.76 / 0.09 |
| Stepper | 300 | 255.10 / 269.86 / 9.59 | 850.3 | 119.87 / 121.15 / 0.87 | 0.12 | 0.00 | 68 | 40 | 6 | 0.90 / 1.05 / 0.19 |
| Switch | 500 | 37.30 / 40.81 / 2.51 | 74.6 | 14.72 / 15.09 / 0.24 | 0.02 | 0.00 | 9 | 4 | 2 | 0.10 / 0.41 / 0.14 |
| Tabs | 300 | 180.30 / 185.43 / 3.44 | 601.0 | 106.96 / 108.04 / 0.72 | 0.11 | 0.00 | 30 | 23 | 28 | 0.50 / 0.76 / 0.17 |
| TagGroup | 300 | 228.20 / 228.92 / 0.80 | 760.7 | 108.38 / 109.07 / 0.45 | 0.07 | 0.00 | 41 | 30 | 28 | 0.35 / 0.56 / 0.12 |
| TagsInput | 300 | 147.00 / 151.95 / 3.76 | 490.0 | 69.43 / 70.31 / 0.58 | 0.16 | 0.00 | 33 | 22 | 12 | 0.50 / 0.86 / 0.18 |
| TimeField | 300 | 114.60 / 120.27 / 4.62 | 382.0 | 67.29 / 67.94 / 0.44 | 0.14 | 0.00 | 33 | 16 | 23 | 1.50 / 2.08 / 0.31 |
| TimeRangeField | 100 | 72.40 / 72.49 / 1.47 | 724.0 | 121.72 / 122.97 / 0.88 | 0.31 | 0.00 | 59 | 28 | 44 | 1.35 / 2.05 / 0.41 |
| Toast | 100 | 47.70 / 48.60 / 1.05 | 477.0 | 69.52 / 70.12 / 3.08 | 0.53 | 0.00 | 39 | 17 | 10 | 9.95 / 12.66 / 1.31 |
| Toggle | 500 | 23.00 / 26.06 / 2.16 | 46.0 | 9.14 / 9.53 / 0.25 | 0.02 | 0.00 | 7 | 2 | 1 | 0.20 / 0.35 / 0.11 |
| ToggleGroup | 300 | 171.80 / 174.77 / 2.03 | 572.7 | 84.96 / 85.86 / 0.58 | 0.09 | 0.00 | 33 | 21 | 19 | 0.30 / 0.51 / 0.14 |
| Toolbar | 300 | 286.50 / 292.62 / 5.06 | 955.0 | 130.57 / 131.90 / 0.94 | 0.16 | 0.00 | 42 | 39 | 23 | 0.30 / 0.51 / 0.11 |
| Tooltip | 100 | 17.80 / 20.50 / 1.79 | 178.0 | 39.86 / 41.25 / 0.92 | 0.45 | 0.00 | 17 | 10 | 6 | 1.70 / 3.06 / 0.64 |
| Tree | 200 | 167.10 / 170.97 / 4.10 | 835.5 | 132.32 / 133.23 / 0.62 | 0.20 | 0.00 | 35 | 30 | 41 | 0.40 / 0.67 / 0.16 |
| YearPicker | 50 | 60.70 / 69.25 / 6.37 | 1214.0 | 210.82 / 211.89 / 0.93 | 0.51 | 0.00 | 128 | 68 | 26 | 1.50 / 2.69 / 0.56 |
| YearRangePicker | 50 | 69.50 / 71.93 / 3.48 | 1390.0 | 248.63 / 249.59 / 0.80 | 0.54 | 0.00 | 128 | 68 | 51 | 1.60 / 2.67 / 0.57 |
| _RefBaseline_ | 500 | 2.50 / 2.95 / 0.36 | 5.0 | 0.43 / 0.48 / 0.05 | 0.05 | 0.00 | 2 | 0 | 0 | – |
| _RefVueComponent_ | 500 | 5.90 / 5.99 / 0.55 | 11.8 | 2.10 / 2.20 / 0.08 | 0.07 | 0.00 | 2 | 1 | 0 | – |
| _RefPrimitive_ | 500 | 6.20 / 6.65 / 0.87 | 12.4 | 2.11 / 2.22 / 0.08 | 0.05 | 0.00 | 2 | 1 | 0 | – |
| _RefPrimitiveAsChild_ | 500 | 6.80 / 6.89 / 0.90 | 13.6 | 1.95 / 2.03 / 0.07 | 0.05 | 0.00 | 2 | 1 | 0 | – |

### Popups: open / close, and what a closed instance costs

| Family | open ms (med / p95 / sd) | open → painted ms (med / p95 / sd) | close ms (med / p95 / sd) | closed: mount µs / inst | closed: heap KB / inst | closed: components | closed: listeners |
|---|--:|--:|--:|--:|--:|--:|--:|
| AlertDialog | 2.10 / 2.84 / 0.43 | 3.10 / 8.81 / 2.43 | 1.75 / 1.91 / 0.21 | 215.0 | 47.00 | 13 | 1 |
| Autocomplete | 2.95 / 3.64 / 0.45 | 5.15 / 6.32 / 0.70 | 2.75 / 3.46 / 0.44 | 492.0 | 77.89 | 17 | 11 |
| Combobox | 3.05 / 4.49 / 0.82 | 5.35 / 8.13 / 1.55 | 2.70 / 3.58 / 0.53 | 501.0 | 81.56 | 17 | 12 |
| ContextMenu | 2.60 / 3.50 / 0.46 | 4.85 / 6.11 / 0.60 | 1.70 / 1.96 / 0.20 | 282.0 | 53.30 | 14 | 5 |
| DatePicker | 7.65 / 9.65 / 1.21 | 10.70 / 14.11 / 1.80 | 3.35 / 4.22 / 0.44 | 1084.0 | 128.34 | 33 | 27 |
| DateRangePicker | 7.75 / 10.21 / 1.27 | 10.85 / 14.46 / 1.99 | 3.60 / 4.07 / 0.30 | 1040.0 | 180.83 | 48 | 46 |
| Dialog | 2.05 / 2.72 / 0.44 | 3.10 / 3.88 / 0.54 | 1.65 / 2.06 / 0.28 | 171.0 | 33.75 | 9 | 1 |
| Drawer | 1.85 / 2.65 / 0.47 | 3.25 / 4.53 / 0.81 | 1.65 / 2.00 / 0.25 | 177.0 | 40.03 | 9 | 1 |
| DropdownMenu | 3.40 / 4.02 / 0.40 | 5.10 / 6.29 / 0.63 | 2.00 / 2.25 / 0.20 | 244.0 | 52.44 | 14 | 3 |
| HoverCard | 1.90 / 2.53 / 0.39 | 2.45 / 5.71 / 1.49 | 0.55 / 0.91 / 0.19 | 173.0 | 37.23 | 10 | 5 |
| Menubar | 3.10 / 3.87 / 0.39 | 5.30 / 6.26 / 0.58 | 2.75 / 3.15 / 0.27 | 1478.0 | 222.62 | 62 | 28 |
| Popover | 2.00 / 2.85 / 0.52 | 3.75 / 6.08 / 1.22 | 1.25 / 2.08 / 0.38 | 187.0 | 36.88 | 10 | 1 |
| Select | 3.60 / 4.55 / 0.67 | 5.95 / 7.26 / 0.82 | 3.10 / 3.46 / 0.22 | 868.0 | 170.23 | 54 | 53 |
| Tooltip | 1.70 / 3.06 / 0.64 | 2.20 / 4.64 / 1.17 | 0.50 / 1.01 / 0.23 | 178.0 | 39.86 | 10 | 6 |

### Large collections (one instance)

| Family | items | mount ms | heap KB / item | open ms | ms / key (med / p95 / sd) | type ms (med / p95 / sd) | select ms | updates / key | mounts / key | qSA / key | updates / type | updates / select |
|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|
| Combobox | 1000 | 2.0 | 0.18 | 142.3 | 0.20 / 0.46 / 0.12 | 20.80 / 25.34 / 4.82 | 41.80 | 13 | 0 | 0 | 975 | 1043 |
| Combobox | 5000 | 2.1 | 0.04 | 696.1 | 0.60 / 1.12 / 0.25 | 92.90 / 101.20 / 7.35 | 523.60 | 13 | 0 | 0 | 4822 | 5043 |
| DropdownMenu | 1000 | 1.3 | 0.11 | 126.2 | 0.30 / 0.56 / 0.15 | 0.30 / 1.02 / 0.43 | 33.70 | 3.3 | 0 | 1 | 4 | 4021 |
| DropdownMenu | 5000 | 1.4 | 0.02 | 539.5 | 1.45 / 2.20 / 0.39 | 0.40 / 3.96 / 1.97 | 198.60 | 3.3 | 0 | 1 | 4 | 20021 |
| Listbox | 1000 | 130.8 | 20.13 | – | 0.20 / 0.40 / 0.14 | 0.30 / 0.66 / 0.24 | 4.40 | 8 | 0 | 0 | 8 | 10 |
| Listbox | 5000 | 843.5 | 19.58 | – | 0.45 / 1.00 / 0.23 | 0.40 / 0.90 / 0.34 | 23.50 | 8 | 0 | 0 | 8 | 10 |
| RadioGroup | 1000 | 217.4 | 35.07 | – | 0.80 / 1.56 / 0.40 | – | 145.70 | 8 | 0 | 0.3 | – | 5009 |
| RadioGroup | 5000 | 1559.0 | 34.48 | – | 6.80 / 8.46 / 1.20 | – | 4346.90 | 8 | 0 | 0.3 | – | 25009 |
| Select | 1000 | 103.8 | 21.66 | 151.1 | 0.50 / 0.95 / 0.27 | 0.30 / 0.64 / 0.21 | 220.90 | 10 | 0 | 0.3 | 10 | 7038 |
| Select | 5000 | 400.4 | 21.23 | 665.4 | 2.60 / 3.20 / 0.65 | 0.60 / 0.88 / 0.16 | 3425.40 | 10 | 0 | 0.3 | 10 | 35038 |
| Tabs | 1000 | 191.2 | 26.79 | – | 0.40 / 0.70 / 0.18 | – | 0.70 | 11.3 | 0 | 0.3 | – | 16 |
| Tabs | 5000 | 4765.0 | 26.21 | – | 1.20 / 1.85 / 0.59 | – | 3.50 | 11.3 | 0 | 0.3 | – | 16 |
| ToggleGroup | 1000 | 162.2 | 21.14 | – | 0.20 / 0.41 / 0.21 | – | 78.00 | 8 | 0 | 0.3 | – | 5001 |
| ToggleGroup | 5000 | 1080.4 | 20.64 | – | 0.60 / 1.16 / 0.56 | – | 1183.80 | 8 | 0 | 0.3 | – | 25001 |
| Tree | 1000 | 129.2 | 18.23 | – | 0.20 / 0.46 / 0.20 | 0.30 / 0.58 / 0.18 | 62.40 | 6 | 0 | 0.3 | 6 | 4001 |
| Tree | 5000 | 535.1 | 17.75 | – | 0.50 / 1.11 / 0.68 | 0.40 / 0.76 / 0.20 | 723.40 | 6 | 0 | 0.3 | 6 | 20001 |

Component updates by component (top 4):

| Family | items | per key press | per typed character | per selection |
|---|--:|--:|--:|--:|
| Combobox | 1000 | Primitive 3, PrimitiveSlot 2, ComboboxItemIndicator 2, ListboxItemIndicator 2 | ComboboxItem 961, Primitive 4, ComboboxInput 3, ListboxFilter 3 | ComboboxItem 1000, Primitive 13, Presence 5, PrimitiveSlot 3 |
| Combobox | 5000 | Primitive 3, PrimitiveSlot 2, ComboboxItemIndicator 2, ListboxItemIndicator 2 | ComboboxItem 4808, Primitive 4, ComboboxInput 3, ListboxFilter 3 | ComboboxItem 5000, Primitive 13, Presence 5, PrimitiveSlot 3 |
| DropdownMenu | 1000 | MenuItemImpl 1.7, Primitive 1.7 | MenuItemImpl 2, Primitive 2 | Primitive 1006, DropdownMenuItem 1000, MenuItem 1000, MenuItemImpl 1000 |
| DropdownMenu | 5000 | MenuItemImpl 1.7, Primitive 1.7 | MenuItemImpl 2, Primitive 2 | Primitive 5006, DropdownMenuItem 5000, MenuItem 5000, MenuItemImpl 5000 |
| Listbox | 1000 | PrimitiveSlot 2, Primitive 2, ListboxItemIndicator 2, Presence 2 | PrimitiveSlot 2, Primitive 2, ListboxItemIndicator 2, Presence 2 | Primitive 3, Presence 3, PrimitiveSlot 2, ListboxItemIndicator 2 |
| Listbox | 5000 | PrimitiveSlot 2, Primitive 2, ListboxItemIndicator 2, Presence 2 | PrimitiveSlot 2, Primitive 2, ListboxItemIndicator 2, Presence 2 | Primitive 3, Presence 3, PrimitiveSlot 2, ListboxItemIndicator 2 |
| RadioGroup | 1000 | Primitive 4, RovingFocusItem 2, Radio 2 | – | Primitive 2003, RadioGroupItem 1000, RovingFocusItem 1000, Radio 1000 |
| RadioGroup | 5000 | Primitive 4, RovingFocusItem 2, Radio 2 | – | Primitive 10003, RadioGroupItem 5000, RovingFocusItem 5000, Radio 5000 |
| Select | 1000 | Primitive 4, PrimitiveSlot 2, SelectItemText 2, SelectItemIndicator 2 | Primitive 4, PrimitiveSlot 2, SelectItemText 2, SelectItemIndicator 2 | Primitive 2014, PrimitiveSlot 1003, SelectItemText 1002, SelectItemIndicator 1002 |
| Select | 5000 | Primitive 4, PrimitiveSlot 2, SelectItemText 2, SelectItemIndicator 2 | Primitive 4, PrimitiveSlot 2, SelectItemText 2, SelectItemIndicator 2 | Primitive 10014, PrimitiveSlot 5003, SelectItemText 5002, SelectItemIndicator 5002 |
| Tabs | 1000 | Primitive 4.7, Presence 2.7, TabsTrigger 2, TabsContent 2 | – | Primitive 7, Presence 5, TabsTrigger 2, TabsContent 2 |
| Tabs | 5000 | Primitive 4.7, Presence 2.7, TabsTrigger 2, TabsContent 2 | – | Primitive 7, Presence 5, TabsTrigger 2, TabsContent 2 |
| ToggleGroup | 1000 | Primitive 4, RovingFocusItem 2, Toggle 2 | – | Primitive 2001, ToggleGroupItem 1000, RovingFocusItem 1000, Toggle 1000 |
| ToggleGroup | 5000 | Primitive 4, RovingFocusItem 2, Toggle 2 | – | Primitive 10001, ToggleGroupItem 5000, RovingFocusItem 5000, Toggle 5000 |
| Tree | 1000 | Primitive 4, RovingFocusItem 2 | Primitive 4, RovingFocusItem 2 | Primitive 2001, TreeItem 1000, RovingFocusItem 1000 |
| Tree | 5000 | Primitive 4, RovingFocusItem 2 | Primitive 4, RovingFocusItem 2 | Primitive 10001, TreeItem 5000, RovingFocusItem 5000 |

