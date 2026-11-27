## Bench compare: v2-before → v2-now

- a = v2-before: reka-ui 2.11.0 @ 7c562b8b9, 2026-11-26T08:50Z, load 14.53 → max 18.61, timings ungated
- b = v2-now: reka-ui 2.11.0 @ dfa3406d4, 2026-11-26T08:58Z, load 11.82 → max 14.81, timings ungated
- ⚠️ at least one run was not taken on a quiet, gated machine: **ignore the timing rows**, heap and counts are still valid

Listed when: timings outside ±15% and > 2 × stddev and > 0.1 ms; heap outside ±2% and > 0.1 KB; counts differ by > 1% and ≥ 0.5. Ratios are b / a.

### Spread of b / a

| Class | metrics | geomean | median abs. change | p90 | max | listed |
|---|--:|--:|--:|--:|--:|--:|
| timings | 202 | ×0.493 | 12.8% | 89.1% | 100.0% | 69 |
| heap | 89 | ×0.891 | 6.2% | 25.1% | 48.1% | 78 |
| counts | 275 | ×0.691 | 0.0% | 66.7% | 100.0% | 84 |

### Changes beyond noise (231 of 752 metrics)

| Scenario | Family | Metric | a | b | b / a |  |
|---|---|---|--:|--:|--:|--:|
| collection | Combobox@1000 | querySelectorAll calls / key | 1.00 | 0.00 | ×0.000 | **lower** |
| collection | Combobox@5000 | querySelectorAll calls / key | 1.00 | 0.00 | ×0.000 | **lower** |
| collection | Listbox@1000 | querySelectorAll calls / key | 1.00 | 0.00 | ×0.000 | **lower** |
| collection | Listbox@1000 | querySelectorAll calls / typed char | 1.00 | 0.00 | ×0.000 | **lower** |
| collection | Listbox@5000 | querySelectorAll calls / key | 1.00 | 0.00 | ×0.000 | **lower** |
| collection | Listbox@5000 | querySelectorAll calls / typed char | 1.00 | 0.00 | ×0.000 | **lower** |
| collection | Select@1000 | querySelectorAll calls / typed char | 1.00 | 0.00 | ×0.000 | **lower** |
| collection | Select@5000 | querySelectorAll calls / typed char | 1.00 | 0.00 | ×0.000 | **lower** |
| collection | Tree@1000 | querySelectorAll calls / typed char | 1.00 | 0.00 | ×0.000 | **lower** |
| collection | Tree@5000 | querySelectorAll calls / typed char | 1.00 | 0.00 | ×0.000 | **lower** |
| collection | Tabs@5000 | ms/key | 13991.10 | 1.20 | ×0.000 | **lower** |
| collection | Tabs@5000 | component updates / key | 50008.00 | 11.33 | ×0.000 | **lower** |
| collection | Tabs@5000 | select ms | 14199.20 | 3.50 | ×0.000 | **lower** |
| collection | Listbox@5000 | component updates / key | 30002.00 | 8.00 | ×0.000 | **lower** |
| collection | Listbox@5000 | component updates / typed char | 30002.00 | 8.00 | ×0.000 | **lower** |
| collection | Tabs@5000 | component updates / selection | 50012.00 | 16.00 | ×0.000 | **lower** |
| collection | Listbox@5000 | component updates / selection | 30007.00 | 10.00 | ×0.000 | **lower** |
| collection | Listbox@5000 | type ms | 823.05 | 0.40 | ×0.000 | **lower** |
| collection | Listbox@5000 | ms/key | 805.50 | 0.45 | ×0.001 | **lower** |
| collection | Tabs@1000 | component updates / key | 10008.00 | 11.33 | ×0.001 | **lower** |
| collection | Tabs@1000 | ms/key | 321.85 | 0.40 | ×0.001 | **lower** |
| collection | Listbox@1000 | component updates / key | 6002.00 | 8.00 | ×0.001 | **lower** |
| collection | Listbox@1000 | component updates / typed char | 6002.00 | 8.00 | ×0.001 | **lower** |
| collection | Tabs@1000 | component updates / selection | 10012.00 | 16.00 | ×0.002 | **lower** |
| collection | Listbox@1000 | component updates / selection | 6007.00 | 10.00 | ×0.002 | **lower** |
| collection | Tabs@1000 | select ms | 309.20 | 0.70 | ×0.002 | **lower** |
| collection | Listbox@1000 | ms/key | 53.00 | 0.20 | ×0.004 | **lower** |
| collection | Listbox@1000 | type ms | 49.40 | 0.30 | ×0.006 | **lower** |
| collection | Listbox@5000 | select ms | 2709.50 | 23.50 | ×0.009 | **lower** |
| collection | DropdownMenu@5000 | type ms | 12.30 | 0.40 | ×0.033 | **lower** |
| collection | Tree@5000 | type ms | 11.00 | 0.40 | ×0.036 | **lower** |
| collection | Tree@5000 | ms/key | 13.55 | 0.50 | ×0.037 | **lower** |
| collection | Listbox@1000 | select ms | 106.20 | 4.40 | ×0.041 | **lower** |
| collection | ToggleGroup@5000 | ms/key | 13.80 | 0.60 | ×0.043 | **lower** |
| collection | Combobox@5000 | ms/key | 11.15 | 0.60 | ×0.054 | **lower** |
| collection | ToggleGroup@1000 | ms/key | 2.75 | 0.20 | ×0.073 | **lower** |
| collection | Tree@1000 | ms/key | 2.40 | 0.20 | ×0.083 | **lower** |
| collection | Select@5000 | type ms | 6.80 | 0.60 | ×0.088 | **lower** |
| collection | Select@5000 | mount ms | 4113.10 | 400.40 | ×0.097 | **lower** |
| collection | DropdownMenu@1000 | type ms | 2.90 | 0.30 | ×0.10 | **lower** |
| collection | Select@5000 | open ms | 6189.70 | 665.40 | ×0.11 | **lower** |
| collection | Combobox@1000 | ms/key | 1.70 | 0.20 | ×0.12 | **lower** |
| collection | Tree@5000 | select ms | 4275.00 | 723.40 | ×0.17 | **lower** |
| collection | DropdownMenu@5000 | ms/key | 7.50 | 1.45 | ×0.19 | **lower** |
| collection | Tree@5000 | mount ms | 2726.60 | 535.10 | ×0.20 | **lower** |
| collection | RadioGroup@1000 | ms/key | 3.70 | 0.80 | ×0.22 | **lower** |
| collection | Select@1000 | type ms | 1.20 | 0.30 | ×0.25 | **lower** |
| collection | ToggleGroup@5000 | mount ms | 4311.60 | 1080.40 | ×0.25 | **lower** |
| collection | DropdownMenu@5000 | open ms | 2106.20 | 539.50 | ×0.26 | **lower** |
| collection | ToggleGroup@5000 | select ms | 4471.30 | 1183.80 | ×0.26 | **lower** |
| collection | RadioGroup@5000 | ms/key | 23.45 | 6.80 | ×0.29 | **lower** |
| collection | RadioGroup@5000 | select ms | 14824.00 | 4346.90 | ×0.29 | **lower** |
| collection | RadioGroup@5000 | mount ms | 4832.80 | 1559.00 | ×0.32 | **lower** |
| collection | Select@1000 | mount ms | 312.90 | 103.80 | ×0.33 | **lower** |
| collection | RadioGroup@1000 | querySelectorAll calls / key | 1.00 | 0.33 | ×0.33 | **lower** |
| collection | RadioGroup@5000 | querySelectorAll calls / key | 1.00 | 0.33 | ×0.33 | **lower** |
| collection | Select@1000 | ms/key | 1.50 | 0.50 | ×0.33 | **lower** |
| collection | Select@1000 | querySelectorAll calls / key | 1.00 | 0.33 | ×0.33 | **lower** |
| collection | Select@5000 | querySelectorAll calls / key | 1.00 | 0.33 | ×0.33 | **lower** |
| collection | Tabs@1000 | querySelectorAll calls / key | 1.00 | 0.33 | ×0.33 | **lower** |
| collection | Tabs@5000 | querySelectorAll calls / key | 1.00 | 0.33 | ×0.33 | **lower** |
| collection | ToggleGroup@1000 | querySelectorAll calls / key | 1.00 | 0.33 | ×0.33 | **lower** |
| collection | ToggleGroup@5000 | querySelectorAll calls / key | 1.00 | 0.33 | ×0.33 | **lower** |
| collection | Tree@1000 | querySelectorAll calls / key | 1.00 | 0.33 | ×0.33 | **lower** |
| collection | Tree@5000 | querySelectorAll calls / key | 1.00 | 0.33 | ×0.33 | **lower** |
| collection | Select@1000 | open ms | 443.80 | 151.10 | ×0.34 | **lower** |
| collection | Select@5000 | ms/key | 7.55 | 2.60 | ×0.34 | **lower** |
| collection | Select@5000 | select ms | 9245.60 | 3425.40 | ×0.37 | **lower** |
| collection | Tree@1000 | select ms | 165.40 | 62.40 | ×0.38 | **lower** |
| collection | Select@5000 | component updates / selection | 80040.00 | 35038.00 | ×0.44 | **lower** |
| collection | ToggleGroup@1000 | select ms | 177.90 | 78.00 | ×0.44 | **lower** |
| collection | Select@1000 | component updates / selection | 16040.00 | 7038.00 | ×0.44 | **lower** |
| collection | Select@1000 | select ms | 493.70 | 220.90 | ×0.45 | **lower** |
| collection | DropdownMenu@1000 | open ms | 261.90 | 126.20 | ×0.48 | **lower** |
| collection | Tabs@1000 | mount ms | 387.50 | 191.20 | ×0.49 | **lower** |
| collection | Combobox@1000 | querySelectorAll calls / selection | 2.00 | 1.00 | ×0.50 | **lower** |
| collection | Combobox@5000 | querySelectorAll calls / selection | 2.00 | 1.00 | ×0.50 | **lower** |
| collection | DropdownMenu@1000 | querySelectorAll calls / typed char | 2.00 | 1.00 | ×0.50 | **lower** |
| collection | DropdownMenu@5000 | querySelectorAll calls / typed char | 2.00 | 1.00 | ×0.50 | **lower** |
| mount | RefPrimitiveAsChild | components/inst | 2.00 | 1.00 | ×0.50 | **lower** |
| collection | Listbox@5000 | mount ms | 1671.40 | 843.50 | ×0.50 | **lower** |
| collection | RadioGroup@1000 | select ms | 288.50 | 145.70 | ×0.51 | **lower** |
| mount | RefPrimitiveAsChild | heap KB/inst | 3.75 | 1.95 | ×0.52 | **lower** |
| collection | Tree@1000 | mount ms | 239.80 | 129.20 | ×0.54 | **lower** |
| collection | ToggleGroup@1000 | mount ms | 299.20 | 162.20 | ×0.54 | **lower** |
| collection | RadioGroup@1000 | mount ms | 396.30 | 217.40 | ×0.55 | **lower** |
| mount | Checkbox | mount ms | 69.00 | 38.60 | ×0.56 | **lower** |
| mount | Toolbar | mount ms | 510.40 | 286.50 | ×0.56 | **lower** |
| collection | Combobox@5000 | type ms | 164.60 | 92.90 | ×0.56 | **lower** |
| collection | Tree@5000 | component updates / selection | 35001.00 | 20001.00 | ×0.57 | **lower** |
| collection | Tree@1000 | component updates / selection | 7001.00 | 4001.00 | ×0.57 | **lower** |
| mount | Tabs | components/inst | 39.00 | 23.00 | ×0.59 | **lower** |
| mount | Rating | mount ms | 1130.20 | 672.30 | ×0.59 | **lower** |
| mount | Tree | mount ms | 279.30 | 167.10 | ×0.60 | **lower** |
| mount | Tabs | mount ms | 301.20 | 180.30 | ×0.60 | **lower** |
| mount | Select | mount ms | 144.40 | 86.80 | ×0.60 | **lower** |
| mount | ToggleGroup | mount ms | 283.20 | 171.80 | ×0.61 | **lower** |
| mount | Tree | components/inst | 49.01 | 30.00 | ×0.61 | **lower** |
| collection | ToggleGroup@5000 | component updates / selection | 40001.00 | 25001.00 | ×0.63 | **lower** |
| collection | ToggleGroup@1000 | component updates / selection | 8001.00 | 5001.00 | ×0.63 | **lower** |
| collection | RadioGroup@5000 | component updates / selection | 40009.00 | 25009.00 | ×0.63 | **lower** |
| collection | RadioGroup@1000 | component updates / selection | 8009.00 | 5009.00 | ×0.63 | **lower** |
| collection | Tabs@5000 | mount ms | 7423.70 | 4765.00 | ×0.64 | **lower** |
| mount | RadioGroup | mount ms | 398.40 | 256.70 | ×0.64 | **lower** |
| collection | DropdownMenu@1000 | select ms | 52.30 | 33.70 | ×0.64 | **lower** |
| mount | CheckboxGroup | mount ms | 348.20 | 228.20 | ×0.66 | **lower** |
| collection | Tabs@5000 | heap KB/item | 39.74 | 26.21 | ×0.66 | **lower** |
| collection | Tabs@1000 | heap KB/item | 40.29 | 26.79 | ×0.67 | **lower** |
| collection | DropdownMenu@5000 | component updates / selection | 30024.00 | 20021.00 | ×0.67 | **lower** |
| collection | DropdownMenu@1000 | component updates / selection | 6024.00 | 4021.00 | ×0.67 | **lower** |
| mount | ToggleGroup | components/inst | 31.00 | 21.00 | ×0.68 | **lower** |
| mount | TagGroup | mount ms | 335.60 | 228.20 | ×0.68 | **lower** |
| mount | Toolbar | components/inst | 57.00 | 39.00 | ×0.68 | **lower** |
| collection | Tree@5000 | heap KB/item | 25.49 | 17.75 | ×0.70 | **lower** |
| collection | Tree@1000 | heap KB/item | 25.97 | 18.23 | ×0.70 | **lower** |
| collection | DropdownMenu@5000 | select ms | 280.50 | 198.60 | ×0.71 | **lower** |
| collection | ToggleGroup@5000 | heap KB/item | 28.89 | 20.64 | ×0.71 | **lower** |
| collection | ToggleGroup@1000 | heap KB/item | 29.42 | 21.14 | ×0.72 | **lower** |
| mount | Tabs | heap KB/inst | 146.84 | 106.96 | ×0.73 | **lower** |
| mount | RadioGroup | components/inst | 38.00 | 28.00 | ×0.74 | **lower** |
| mount | Tree | heap KB/inst | 178.44 | 132.32 | ×0.74 | **lower** |
| mount | Rating | components/inst | 83.00 | 62.00 | ×0.75 | **lower** |
| collection | Tree@1000 | component updates / key | 8.00 | 6.00 | ×0.75 | **lower** |
| collection | Tree@1000 | component updates / typed char | 8.00 | 6.00 | ×0.75 | **lower** |
| collection | Tree@5000 | component updates / key | 8.00 | 6.00 | ×0.75 | **lower** |
| collection | Tree@5000 | component updates / typed char | 8.00 | 6.00 | ×0.75 | **lower** |
| mount | TagGroup | components/inst | 40.00 | 30.00 | ×0.75 | **lower** |
| mount | Toolbar | heap KB/inst | 173.93 | 130.57 | ×0.75 | **lower** |
| collection | Combobox@1000 | component updates / typed char | 1287.00 | 975.00 | ×0.76 | **lower** |
| collection | Combobox@5000 | component updates / typed char | 6358.00 | 4822.00 | ×0.76 | **lower** |
| collection | Select@1000 | heap KB/item | 28.34 | 21.66 | ×0.76 | **lower** |
| collection | Select@5000 | heap KB/item | 27.76 | 21.23 | ×0.76 | **lower** |
| collection | Select@5000 | heap open KB/item | 28.20 | 21.64 | ×0.77 | **lower** |
| collection | Select@1000 | heap open KB/item | 29.07 | 22.34 | ×0.77 | **lower** |
| mount | ToggleGroup | heap KB/inst | 110.47 | 84.96 | ×0.77 | **lower** |
| collection | Listbox@1000 | mount ms | 169.50 | 130.80 | ×0.77 | **lower** |
| mount | Accordion | heap KB/inst | 146.58 | 113.16 | ×0.77 | **lower** |
| mount | Accordion | DOM nodes/inst | 53.01 | 41.01 | ×0.77 | **lower** |
| mount | CheckboxGroup | components/inst | 27.00 | 21.00 | ×0.78 | **lower** |
| mount | TagGroup | heap KB/inst | 136.65 | 108.38 | ×0.79 | **lower** |
| collection | DropdownMenu@1000 | heap open KB/item | 20.47 | 16.29 | ×0.80 | **lower** |
| mount | Accordion | mount ms | 230.40 | 183.70 | ×0.80 | **lower** |
| collection | DropdownMenu@5000 | heap open KB/item | 19.82 | 15.81 | ×0.80 | **lower** |
| collection | Combobox@1000 | mount ms | 2.50 | 2.00 | ×0.80 | **lower** |
| collection | RadioGroup@1000 | component updates / key | 10.00 | 8.00 | ×0.80 | **lower** |
| collection | RadioGroup@5000 | component updates / key | 10.00 | 8.00 | ×0.80 | **lower** |
| collection | ToggleGroup@1000 | component updates / key | 10.00 | 8.00 | ×0.80 | **lower** |
| collection | ToggleGroup@5000 | component updates / key | 10.00 | 8.00 | ×0.80 | **lower** |
| mount | Menubar | mount ms | 184.20 | 147.80 | ×0.80 | **lower** |
| collection | RadioGroup@5000 | heap KB/item | 42.71 | 34.48 | ×0.81 | **lower** |
| collection | RadioGroup@1000 | heap KB/item | 43.35 | 35.07 | ×0.81 | **lower** |
| mount | RefPrimitive | heap KB/inst | 2.60 | 2.11 | ×0.81 | **lower** |
| mount | Select | heap KB/inst | 206.30 | 170.23 | ×0.83 | **lower** |
| mount | Menubar | components/inst | 75.01 | 62.01 | ×0.83 | **lower** |
| mount | Toggle | mount ms | 27.70 | 23.00 | ×0.83 | **lower** |
| mount | RadioGroup | heap KB/inst | 154.13 | 128.35 | ×0.83 | **lower** |
| mount | ColorSwatch | mount ms | 16.20 | 13.50 | ×0.83 | **lower** |
| collection | Select@1000 | component updates / key | 12.00 | 10.00 | ×0.83 | **lower** |
| collection | Select@1000 | component updates / typed char | 12.00 | 10.00 | ×0.83 | **lower** |
| collection | Select@5000 | component updates / key | 12.00 | 10.00 | ×0.83 | **lower** |
| collection | Select@5000 | component updates / typed char | 12.00 | 10.00 | ×0.83 | **lower** |
| mount | Listbox | mount ms | 295.60 | 247.20 | ×0.84 | **lower** |
| mount | Rating | heap KB/inst | 331.10 | 277.89 | ×0.84 | **lower** |
| mount | Accordion | components/inst | 38.00 | 32.00 | ×0.84 | **lower** |
| mount | CheckboxGroup | heap KB/inst | 140.48 | 118.70 | ×0.84 | **lower** |
| collection | Select@5000 | component mounts / selection | 40008.00 | 35010.00 | ×0.88 | **lower** |
| collection | Select@1000 | component mounts / selection | 8008.00 | 7010.00 | ×0.88 | **lower** |
| mount | Menubar | heap KB/inst | 253.61 | 222.62 | ×0.88 | **lower** |
| mount | Collapsible | heap KB/inst | 30.48 | 27.04 | ×0.89 | **lower** |
| mount | Select | components/inst | 60.01 | 54.01 | ×0.90 | **lower** |
| mount | Checkbox | heap KB/inst | 23.13 | 20.85 | ×0.90 | **lower** |
| mount | HoverCard | components/inst | 11.01 | 10.01 | ×0.91 | **lower** |
| mount | Popover | components/inst | 11.01 | 10.01 | ×0.91 | **lower** |
| mount | Tooltip | components/inst | 11.02 | 10.02 | ×0.91 | **lower** |
| mount | AspectRatio | heap KB/inst | 6.56 | 5.98 | ×0.91 | **lower** |
| mount | Switch | heap KB/inst | 16.04 | 14.72 | ×0.92 | **lower** |
| mount | Toast | heap KB/inst | 75.73 | 69.52 | ×0.92 | **lower** |
| mount | ColorArea | heap KB/inst | 23.91 | 22.02 | ×0.92 | **lower** |
| mount | ColorSwatch | heap KB/inst | 5.86 | 5.40 | ×0.92 | **lower** |
| mount | ColorField | heap KB/inst | 16.95 | 15.69 | ×0.93 | **lower** |
| mount | Toggle | heap KB/inst | 9.87 | 9.14 | ×0.93 | **lower** |
| mount | Editable | heap KB/inst | 41.98 | 38.89 | ×0.93 | **lower** |
| mount | Stepper | heap KB/inst | 128.91 | 119.87 | ×0.93 | **lower** |
| mount | MonthPicker | heap KB/inst | 227.07 | 211.29 | ×0.93 | **lower** |
| mount | YearPicker | heap KB/inst | 226.56 | 210.82 | ×0.93 | **lower** |
| mount | Label | heap KB/inst | 5.76 | 5.37 | ×0.93 | **lower** |
| mount | ContextMenu | components/inst | 15.01 | 14.01 | ×0.93 | **lower** |
| mount | DropdownMenu | components/inst | 15.01 | 14.01 | ×0.93 | **lower** |
| mount | TagsInput | heap KB/inst | 74.35 | 69.43 | ×0.93 | **lower** |
| mount | Separator | heap KB/inst | 6.93 | 6.48 | ×0.93 | **lower** |
| mount | Pagination | heap KB/inst | 81.79 | 76.46 | ×0.93 | **lower** |
| mount | Popover | heap KB/inst | 39.31 | 36.88 | ×0.94 | **lower** |
| mount | Carousel | heap KB/inst | 138.53 | 130.09 | ×0.94 | **lower** |
| mount | HoverCard | heap KB/inst | 39.60 | 37.23 | ×0.94 | **lower** |
| mount | YearRangePicker | heap KB/inst | 264.34 | 248.63 | ×0.94 | **lower** |
| mount | Calendar | heap KB/inst | 706.25 | 664.42 | ×0.94 | **lower** |
| mount | MonthRangePicker | heap KB/inst | 264.81 | 249.23 | ×0.94 | **lower** |
| mount | Progress | heap KB/inst | 13.38 | 12.59 | ×0.94 | **lower** |
| mount | Tooltip | heap KB/inst | 42.32 | 39.86 | ×0.94 | **lower** |
| mount | Autocomplete | components/inst | 18.01 | 17.01 | ×0.94 | **lower** |
| mount | Combobox | components/inst | 18.01 | 17.01 | ×0.94 | **lower** |
| mount | Toast | components/inst | 18.14 | 17.14 | ×0.94 | **lower** |
| mount | RangeCalendar | heap KB/inst | 823.18 | 780.55 | ×0.95 | **lower** |
| mount | ScrollArea | heap KB/inst | 52.04 | 49.37 | ×0.95 | **lower** |
| mount | TimeField | heap KB/inst | 70.75 | 67.29 | ×0.95 | **lower** |
| mount | TimeRangeField | heap KB/inst | 127.89 | 121.72 | ×0.95 | **lower** |
| mount | Splitter | heap KB/inst | 49.40 | 47.10 | ×0.95 | **lower** |
| mount | DateRangeField | heap KB/inst | 116.67 | 111.25 | ×0.95 | **lower** |
| mount | NavigationMenu | heap KB/inst | 122.47 | 116.79 | ×0.95 | **lower** |
| mount | ContextMenu | heap KB/inst | 55.85 | 53.30 | ×0.95 | **lower** |
| mount | DropdownMenu | heap KB/inst | 54.90 | 52.44 | ×0.96 | **lower** |
| mount | DateField | heap KB/inst | 69.17 | 66.11 | ×0.96 | **lower** |
| mount | SliderArea | heap KB/inst | 44.42 | 42.55 | ×0.96 | **lower** |
| mount | DateRangePicker | heap KB/inst | 188.59 | 180.83 | ×0.96 | **lower** |
| mount | DatePicker | heap KB/inst | 133.71 | 128.34 | ×0.96 | **lower** |
| mount | PinInput | heap KB/inst | 61.78 | 59.37 | ×0.96 | **lower** |
| collection | Listbox@1000 | heap KB/item | 20.85 | 20.13 | ×0.97 | **lower** |
| mount | NumberField | heap KB/inst | 48.51 | 46.85 | ×0.97 | **lower** |
| mount | Avatar | heap KB/inst | 16.69 | 16.13 | ×0.97 | **lower** |
| collection | Listbox@5000 | heap KB/item | 20.25 | 19.58 | ×0.97 | **lower** |
| collection | Combobox@1000 | heap open KB/item | 27.44 | 26.53 | ×0.97 | **lower** |
| mount | Field | heap KB/inst | 50.11 | 48.54 | ×0.97 | **lower** |
| mount | Slider | heap KB/inst | 52.37 | 50.77 | ×0.97 | **lower** |
| mount | DatePicker | components/inst | 34.01 | 33.01 | ×0.97 | **lower** |
| mount | Form | heap KB/inst | 138.32 | 134.37 | ×0.97 | **lower** |
| collection | Combobox@5000 | heap open KB/item | 26.68 | 25.94 | ×0.97 | **lower** |
| mount | Autocomplete | heap KB/inst | 80.04 | 77.89 | ×0.97 | **lower** |
| mount | ColorSwatchPicker | heap KB/inst | 194.05 | 189.21 | ×0.98 | **lower** |
| mount | Combobox | heap KB/inst | 83.51 | 81.56 | ×0.98 | **lower** |
| mount | DateRangePicker | components/inst | 49.01 | 48.01 | ×0.98 | **lower** |
| mount | ColorSwatchPicker | components/inst | 64.00 | 63.01 | ×0.98 | **lower** |

