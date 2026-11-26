## Bench: v3

- **Build**: reka-ui 3.0.0-alpha.0 (HEAD @ 8eecd9769, source last changed in 8eecd9769), production dist, Vue 3.5.46
- **Browser**: headless Chromium 153.0.8010.12, Node v24.19.0
- **Machine**: Apple M1 Pro, 10 cores, 16 GB, darwin 25.6.0 arm64
- **Run**: 2026-11-25T11:19:59.050Z, 92s, 1 page load(s) × 3 round(s) per family
- **Load (1 min)**: 33.62 at start (gate < 2, then < 5 per family; waited 0 min), max 39.18 during the run, 25.47 at the end; caffeinate on, sleep events 1
- **Timings**: **SUSPECT** (busy machine or sleep during the run): use heap and counts only

### Mount, retained heap, interaction (per family)

| Family | N | mount ms (med / p95 / sd) | µs / inst | heap KB / inst (med / p95 / sd) | after unmount KB / inst | leaked nodes / inst | DOM nodes | components | listeners | interaction ms (med / p95 / sd) |
|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|
| Accordion | 300 | 131.90 / 135.41 / 3.00 | 439.7 | 100.37 / 102.08 / 1.14 | 0.20 | 0.00 | 53 | 25 | 12 | 0.70 / 1.18 / 0.25 |
| AlertDialog | 100 | 9.90 / 10.98 / 0.92 | 99.0 | 19.38 / 19.44 / 0.43 | 0.95 | 0.00 | 9 | 4 | 1 | 1.30 / 1.89 / 0.34 |
| AspectRatio | 500 | 12.70 / 14.95 / 1.64 | 25.4 | 4.22 / 4.44 / 0.15 | 0.03 | 0.00 | 6 | 1 | 0 | – |
| Autocomplete | 100 | 17.50 / 20.02 / 1.85 | 175.0 | 40.83 / 42.24 / 0.90 | 0.28 | 0.00 | 19 | 6 | 13 | 1.90 / 2.84 / 0.49 |
| Avatar | 500 | 35.30 / 37.82 / 2.05 | 70.6 | 12.31 / 12.79 / 0.31 | 0.02 | 0.00 | 6 | 3 | 2 | – |
| Calendar | 30 | 46.40 / 46.49 / 0.32 | 1546.7 | 331.91 / 331.92 / 0.40 | 0.37 | 0.00 | 171 | 91 | 72 | 1.90 / 2.33 / 0.32 |
| Checkbox | 500 | 17.90 / 20.96 / 2.02 | 35.8 | 9.39 / 9.74 / 0.22 | 0.06 | 0.00 | 7 | 2 | 2 | 0.30 / 0.82 / 0.23 |
| CheckboxGroup | 300 | 76.50 / 78.57 / 5.24 | 255.0 | 52.11 / 52.78 / 0.49 | 0.22 | 0.00 | 32 | 9 | 17 | 0.40 / 0.56 / 0.14 |
| Collapsible | 500 | 43.40 / 48.80 / 3.82 | 86.8 | 18.03 / 18.87 / 0.54 | 0.08 | 0.00 | 9 | 4 | 3 | 0.40 / 0.71 / 0.14 |
| ColorArea | 300 | 43.20 / 46.71 / 2.34 | 144.0 | 18.04 / 18.30 / 0.30 | 0.28 | 0.00 | 22 | 3 | 8 | 0.60 / 0.82 / 0.14 |
| ColorField | 500 | 27.90 / 31.23 / 2.40 | 55.8 | 12.90 / 13.31 / 0.28 | 0.04 | 0.00 | 8 | 2 | 8 | 0.50 / 0.80 / 0.15 |
| ColorSlider | 500 | 80.50 / 86.71 / 5.08 | 161.0 | 34.41 / 35.09 / 0.44 | 0.04 | 0.00 | 13 | 6 | 6 | 0.50 / 1.03 / 0.27 |
| ColorSwatch | 500 | 9.20 / 10.91 / 1.27 | 18.4 | 3.41 / 3.63 / 0.15 | 0.07 | 0.00 | 3 | 1 | 0 | – |
| ColorSwatchPicker | 200 | 115.50 / 116.85 / 1.35 | 577.5 | 134.73 / 135.82 / 0.83 | 0.35 | 0.00 | 57 | 35 | 20 | 0.70 / 0.91 / 0.18 |
| Combobox | 100 | 17.60 / 18.86 / 0.84 | 176.0 | 41.33 / 42.62 / 0.83 | 0.27 | 0.00 | 20 | 6 | 13 | 2.30 / 3.90 / 0.78 |
| ContextMenu | 100 | 8.00 / 8.09 / 0.38 | 80.0 | 16.29 / 16.36 / 0.21 | 0.89 | 0.00 | 9 | 4 | 5 | 2.10 / 2.75 / 0.37 |
| DateField | 200 | 100.20 / 103.53 / 9.05 | 501.0 | 39.92 / 40.27 / 0.32 | 0.28 | 0.00 | 32 | 7 | 23 | 1.60 / 1.85 / 0.14 |
| DatePicker | 100 | 67.50 / 74.34 / 5.22 | 675.0 | 87.54 / 88.43 / 0.69 | 0.43 | 0.00 | 45 | 19 | 25 | 4.35 / 5.33 / 0.67 |
| DateRangeField | 100 | 45.90 / 47.88 / 1.47 | 459.0 | 63.61 / 64.23 / 0.47 | 0.40 | 0.00 | 31 | 12 | 44 | 1.05 / 1.47 / 0.21 |
| DateRangePicker | 100 | 73.00 / 75.88 / 2.53 | 730.0 | 122.67 / 124.24 / 1.03 | 0.41 | 0.00 | 43 | 29 | 46 | 4.15 / 5.27 / 0.60 |
| Dialog | 100 | 7.20 / 8.46 / 1.21 | 72.0 | 16.68 / 17.02 / 0.43 | 1.07 | 0.00 | 7 | 3 | 1 | 1.05 / 1.67 / 0.32 |
| Drawer | 100 | 6.40 / 6.85 / 0.71 | 64.0 | 14.25 / 14.56 / 0.41 | 1.03 | 0.00 | 7 | 3 | 1 | 1.30 / 1.80 / 0.25 |
| DropdownMenu | 100 | 9.70 / 10.24 / 0.65 | 97.0 | 20.13 / 20.28 / 0.32 | 0.81 | 0.00 | 9 | 4 | 2 | 2.15 / 3.19 / 0.53 |
| Editable | 300 | 64.50 / 66.21 / 1.70 | 215.0 | 40.55 / 40.98 / 0.30 | 0.17 | 0.00 | 29 | 14 | 8 | 0.80 / 1.12 / 0.19 |
| Field | 300 | 53.30 / 53.75 / 1.66 | 177.7 | 35.85 / 36.42 / 0.43 | 0.36 | 0.00 | 17 | 7 | 6 | 0.70 / 0.85 / 0.09 |
| Form | 200 | 98.40 / 101.01 / 6.43 | 492.0 | 99.99 / 101.38 / 0.95 | 0.19 | 0.00 | 44 | 19 | 19 | 0.60 / 0.85 / 0.13 |
| HoverCard | 100 | 6.50 / 8.03 / 1.55 | 65.0 | 13.40 / 13.61 / 0.39 | 1.07 | 0.00 | 9 | 4 | 5 | 1.50 / 2.19 / 0.40 |
| Label | 500 | 9.70 / 11.32 / 1.07 | 19.4 | 4.28 / 4.43 / 0.11 | 0.07 | 0.00 | 4 | 1 | 1 | – |
| Listbox | 300 | 91.90 / 94.06 / 7.37 | 306.3 | 74.40 / 74.70 / 0.24 | 0.26 | 0.00 | 34 | 12 | 20 | 0.65 / 0.92 / 0.16 |
| Menubar | 100 | 34.70 / 34.70 / 1.85 | 347.0 | 57.81 / 58.97 / 0.83 | 0.48 | 0.00 | 32 | 13 | 23 | 2.05 / 3.56 / 0.85 |
| NavigationMenu | 100 | 32.00 / 34.16 / 2.60 | 320.0 | 63.62 / 64.89 / 1.09 | 1.05 | 0.00 | 50 | 14 | 15 | 0.90 / 2.03 / 0.49 |
| NumberField | 300 | 53.70 / 58.38 / 3.19 | 179.0 | 36.93 / 37.10 / 0.16 | 0.18 | 0.00 | 16 | 4 | 18 | 0.90 / 1.10 / 0.10 |
| Pagination | 300 | 62.30 / 65.54 / 4.74 | 207.7 | 46.03 / 46.33 / 0.30 | 0.14 | 0.00 | 66 | 13 | 10 | 0.20 / 0.46 / 0.13 |
| PinInput | 300 | 93.00 / 95.16 / 2.81 | 310.0 | 44.93 / 45.34 / 0.36 | 0.14 | 0.00 | 29 | 8 | 33 | 1.50 / 1.75 / 0.22 |
| Popover | 100 | 8.60 / 8.96 / 0.26 | 86.0 | 20.33 / 20.40 / 0.39 | 1.09 | 0.00 | 9 | 4 | 1 | 1.35 / 2.03 / 0.39 |
| Progress | 500 | 14.30 / 17.45 / 2.08 | 28.6 | 8.31 / 8.64 / 0.22 | 0.03 | 0.00 | 6 | 2 | 0 | – |
| RadioGroup | 300 | 89.30 / 89.39 / 4.82 | 297.7 | 59.27 / 60.23 / 0.66 | 0.15 | 0.00 | 35 | 11 | 17 | 0.50 / 0.77 / 0.17 |
| RangeCalendar | 30 | 48.70 / 49.24 / 0.65 | 1623.3 | 357.87 / 358.18 / 0.58 | 0.56 | 0.00 | 172 | 91 | 144 | 1.55 / 2.33 / 0.38 |
| Rating | 300 | 313.70 / 318.20 / 15.39 | 1045.7 | 173.61 / 175.11 / 1.03 | 0.28 | 0.00 | 78 | 37 | 41 | 0.40 / 0.89 / 0.26 |
| ScrollArea | 300 | 63.00 / 67.59 / 4.28 | 210.0 | 42.17 / 42.90 / 0.55 | 0.30 | 0.00 | 36 | 13 | 7 | – |
| Select | 100 | 14.50 / 14.86 / 1.06 | 145.0 | 29.53 / 30.57 / 0.69 | 0.35 | 0.00 | 17 | 6 | 6 | 1.90 / 2.88 / 0.50 |
| Separator | 500 | 7.30 / 8.74 / 0.95 | 14.6 | 3.22 / 3.43 / 0.14 | 0.05 | 0.00 | 3 | 1 | 0 | – |
| Slider | 500 | 69.10 / 70.63 / 2.06 | 138.2 | 23.34 / 23.87 / 0.34 | 0.04 | 0.00 | 13 | 4 | 6 | 0.30 / 0.56 / 0.11 |
| Splitter | 300 | 127.20 / 139.26 / 8.96 | 424.0 | 48.63 / 49.43 / 0.54 | 0.12 | 0.00 | 14 | 8 | 4 | 0.40 / 0.56 / 0.09 |
| Stepper | 300 | 146.60 / 157.85 / 11.37 | 488.7 | 91.73 / 92.66 / 0.64 | 0.07 | 0.00 | 68 | 36 | 6 | 0.60 / 0.85 / 0.15 |
| Switch | 500 | 22.60 / 25.30 / 2.04 | 45.2 | 9.98 / 10.27 / 0.20 | 0.05 | 0.00 | 9 | 2 | 2 | 0.10 / 0.26 / 0.10 |
| Tabs | 300 | 101.10 / 102.36 / 10.13 | 337.0 | 62.73 / 63.41 / 0.50 | 0.24 | 0.00 | 28 | 11 | 20 | 0.50 / 0.81 / 0.19 |
| TagGroup | 300 | 99.00 / 102.33 / 10.19 | 330.0 | 52.99 / 53.36 / 0.29 | 0.14 | 0.00 | 41 | 10 | 22 | 0.20 / 0.35 / 0.08 |
| TagsInput | 300 | 59.80 / 61.06 / 0.84 | 199.3 | 36.49 / 37.14 / 0.43 | 0.17 | 0.00 | 33 | 8 | 10 | 0.25 / 0.56 / 0.16 |
| TimeField | 300 | 89.50 / 89.95 / 7.42 | 298.3 | 41.62 / 41.79 / 0.24 | 0.29 | 0.00 | 21 | 8 | 23 | 1.20 / 1.46 / 0.16 |
| TimeRangeField | 100 | 44.90 / 45.98 / 0.76 | 449.0 | 70.30 / 71.13 / 0.60 | 0.40 | 0.00 | 35 | 14 | 44 | 0.90 / 1.32 / 0.20 |
| Toast | 100 | 22.00 / 22.27 / 0.35 | 220.0 | 45.02 / 45.31 / 0.33 | 0.43 | 0.00 | 39 | 8 | 8 | 4.15 / 5.43 / 0.74 |
| Toggle | 500 | 16.50 / 18.66 / 1.42 | 33.0 | 6.33 / 6.65 / 0.21 | 0.06 | 0.00 | 7 | 1 | 1 | 0.10 / 0.26 / 0.08 |
| ToggleGroup | 300 | 98.20 / 98.38 / 7.16 | 327.3 | 50.41 / 50.98 / 0.40 | 0.20 | 0.00 | 33 | 9 | 14 | 0.20 / 0.31 / 0.09 |
| Toolbar | 300 | 125.30 / 130.79 / 6.20 | 417.7 | 69.91 / 70.64 / 0.53 | 0.25 | 0.00 | 42 | 17 | 16 | 0.20 / 0.51 / 0.16 |
| Tooltip | 100 | 7.70 / 7.97 / 0.40 | 77.0 | 17.22 / 17.25 / 0.44 | 0.98 | 0.00 | 9 | 4 | 6 | 1.35 / 2.21 / 0.46 |
| Tree | 200 | 76.00 / 77.62 / 6.41 | 380.0 | 65.60 / 66.13 / 0.39 | 0.22 | 0.00 | 35 | 7 | 29 | 0.25 / 0.51 / 0.15 |
| _RefBaseline_ | 500 | 2.40 / 2.85 / 0.32 | 4.8 | 0.42 / 0.48 / 0.05 | 0.05 | 0.00 | 2 | 0 | 0 | – |
| _RefVueComponent_ | 500 | 4.50 / 5.40 / 0.68 | 9.0 | 2.08 / 2.19 / 0.09 | 0.07 | 0.00 | 2 | 1 | 0 | – |
| _RefPrimitive_ | 500 | 5.10 / 6.81 / 1.13 | 10.2 | 2.26 / 2.37 / 0.08 | 0.04 | 0.00 | 2 | 1 | 0 | – |
| _RefPrimitiveAsChild_ | 500 | 7.60 / 8.68 / 0.69 | 15.2 | 3.46 / 3.68 / 0.14 | 0.04 | 0.00 | 2 | 2 | 0 | – |

### Popups: open / close, and what a closed instance costs

| Family | open ms (med / p95 / sd) | open → painted ms (med / p95 / sd) | close ms (med / p95 / sd) | closed: mount µs / inst | closed: heap KB / inst | closed: components | closed: listeners |
|---|--:|--:|--:|--:|--:|--:|--:|
| AlertDialog | 1.30 / 1.89 / 0.34 | 2.85 / 3.90 / 0.59 | 1.05 / 1.60 / 0.30 | 99.0 | 19.38 | 4 | 1 |
| Autocomplete | 1.90 / 2.84 / 0.49 | 3.95 / 5.97 / 0.99 | 1.85 / 2.72 / 0.44 | 175.0 | 40.83 | 6 | 13 |
| Combobox | 2.30 / 3.90 / 0.78 | 4.65 / 11.18 / 3.34 | 2.10 / 3.29 / 0.59 | 176.0 | 41.33 | 6 | 13 |
| ContextMenu | 2.10 / 2.75 / 0.37 | 4.50 / 5.47 / 0.50 | 1.15 / 1.30 / 0.14 | 80.0 | 16.29 | 4 | 5 |
| DatePicker | 4.35 / 5.33 / 0.67 | 6.20 / 8.06 / 0.96 | 2.10 / 2.46 / 0.23 | 675.0 | 87.54 | 19 | 25 |
| DateRangePicker | 4.15 / 5.27 / 0.60 | 6.00 / 7.76 / 0.78 | 2.30 / 2.46 / 0.21 | 730.0 | 122.67 | 29 | 46 |
| Dialog | 1.05 / 1.67 / 0.32 | 2.55 / 4.19 / 0.89 | 0.95 / 1.16 / 0.13 | 72.0 | 16.68 | 3 | 1 |
| Drawer | 1.30 / 1.80 / 0.25 | 2.90 / 3.51 / 0.40 | 1.05 / 1.30 / 0.16 | 64.0 | 14.25 | 3 | 1 |
| DropdownMenu | 2.15 / 3.19 / 0.53 | 4.80 / 6.30 / 0.79 | 1.25 / 1.61 / 0.21 | 97.0 | 20.13 | 4 | 2 |
| HoverCard | 1.50 / 2.19 / 0.40 | 2.20 / 3.38 / 0.68 | 0.40 / 0.71 / 0.15 | 65.0 | 13.40 | 4 | 5 |
| Menubar | 2.05 / 3.56 / 0.85 | 4.20 / 7.35 / 1.77 | 1.75 / 2.27 / 0.29 | 347.0 | 57.81 | 13 | 23 |
| Popover | 1.35 / 2.03 / 0.39 | 2.75 / 5.47 / 1.32 | 0.80 / 1.05 / 0.14 | 86.0 | 20.33 | 4 | 1 |
| Select | 1.90 / 2.88 / 0.50 | 4.10 / 6.21 / 1.04 | 1.05 / 1.41 / 0.18 | 145.0 | 29.53 | 6 | 6 |
| Tooltip | 1.35 / 2.21 / 0.46 | 2.10 / 3.61 / 0.74 | 0.50 / 0.60 / 0.13 | 77.0 | 17.22 | 4 | 6 |

### Large collections (one instance)

| Family | items | mount ms | heap KB / item | open ms | ms / key (med / p95 / sd) | type ms (med / p95 / sd) | select ms | updates / key | mounts / key | qSA / key | updates / type | updates / select |
|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|
| Combobox | 1000 | 1.3 | 0.09 | 111.5 | 0.10 / 0.20 / 0.09 | 11.00 / 13.36 / 1.33 | 29.70 | 7 | 0 | 0 | 968 | 4012 |
| Combobox | 5000 | 1.2 | 0.02 | 471.5 | 0.30 / 0.60 / 0.15 | 65.50 / 77.52 / 6.68 | 167.80 | 7 | 0 | 0 | 4815 | 20012 |
| DropdownMenu | 1000 | 0.8 | 0.04 | 89.1 | 0.10 / 0.10 / 1.21 | 0.70 / 1.44 / 0.41 | 24.40 | 334.7 | 0 | 0.3 | 2 | 3011 |
| DropdownMenu | 5000 | 0.8 | 0.01 | 359.2 | 0.15 / 0.46 / 6.24 | 4.10 / 5.50 / 0.82 | 109.10 | 1668 | 0 | 0.3 | 2 | 15011 |
| Listbox | 1000 | 38.1 | 10.91 | – | 0.10 / 0.26 / 0.08 | 0.80 / 1.56 / 0.39 | 1.20 | 4 | 0 | 0 | 4 | 5 |
| Listbox | 5000 | 168.5 | 10.45 | – | 0.40 / 0.76 / 0.15 | 6.30 / 6.66 / 0.23 | 3.40 | 4 | 0 | 0 | 4 | 5 |
| RadioGroup | 1000 | 72.5 | 15.35 | – | 0.10 / 0.20 / 0.21 | – | 4.80 | 4 | 0 | 0.3 | – | 12 |
| RadioGroup | 5000 | 314.3 | 14.90 | – | 0.20 / 0.41 / 1.16 | – | 23.40 | 4 | 0 | 0.3 | – | 12 |
| Select | 1000 | 1.0 | 0.06 | 62.7 | 0.25 / 0.50 / 0.17 | 0.90 / 1.48 / 0.38 | 9.60 | 6 | 0 | 0 | 6 | 19 |
| Select | 5000 | 1.0 | 0.01 | 250.5 | 0.20 / 1.50 / 0.59 | 5.90 / 6.38 / 0.33 | 59.60 | 6 | 0 | 0 | 6 | 19 |
| Tabs | 1000 | 72.6 | 15.96 | – | 0.10 / 0.20 / 0.16 | – | 24.40 | 2 | 0 | 0.3 | – | 4006 |
| Tabs | 5000 | 420.6 | 15.44 | – | 0.20 / 0.52 / 0.71 | – | 118.10 | 2 | 0 | 0.3 | – | 20006 |
| ToggleGroup | 1000 | 78.5 | 12.24 | – | 0.10 / 0.26 / 0.20 | – | 29.20 | 4 | 0 | 0.3 | – | 2001 |
| ToggleGroup | 5000 | 484.0 | 11.73 | – | 0.20 / 0.46 / 1.33 | – | 269.30 | 4 | 0 | 0.3 | – | 10001 |
| Tree | 1000 | 61.5 | 8.77 | – | 0.80 / 1.20 / 0.26 | 0.80 / 1.30 / 0.29 | 17.30 | 2 | 0 | 0.3 | 2 | 1001 |
| Tree | 5000 | 248.8 | 8.39 | – | 6.95 / 7.46 / 0.89 | 6.60 / 9.14 / 1.54 | 145.20 | 2 | 0 | 0.3 | 2 | 5001 |

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

