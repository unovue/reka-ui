## Bench compare: v2-now → v3

- a = v2-now: reka-ui 2.11.0 @ dfa3406d4, 2026-11-26T08:58Z, load 11.82 → max 14.81, timings ungated
- b = v3: reka-ui 3.0.0-alpha.0 @ ce07331d2, 2026-11-26T09:01Z, load 14.63 → max 19.44, timings ungated
- ⚠️ at least one run was not taken on a quiet, gated machine: **ignore the timing rows**, heap and counts are still valid
- ⚠️ only in a: Carousel, MonthPicker, MonthRangePicker, SliderArea, YearPicker, YearRangePicker

Listed when: timings outside ±15% and > 2 × stddev and > 0.1 ms; heap outside ±2% and > 0.1 KB; counts differ by > 1% and ≥ 0.5. Ratios are b / a.

### Spread of b / a

| Class | metrics | geomean | median abs. change | p90 | max | listed |
|---|--:|--:|--:|--:|--:|--:|
| timings | 190 | ×0.605 | 39.7% | 94.9% | 3614.3% | 106 |
| heap | 83 | ×0.501 | 42.1% | 61.3% | 99.9% | 77 |
| counts | 247 | ×0.636 | 36.4% | 79.3% | 124937.5% | 155 |

### Changes beyond noise (339 of 704 metrics)

| Scenario | Family | Metric | a | b | b / a |  |
|---|---|---|--:|--:|--:|--:|
| collection | DropdownMenu@1000 | querySelectorAll calls / typed char | 1.00 | 0.00 | ×0.000 | **lower** |
| collection | DropdownMenu@5000 | querySelectorAll calls / typed char | 1.00 | 0.00 | ×0.000 | **lower** |
| collection | Select@5000 | component mounts / selection | 35010.00 | 1.00 | ×0.000 | **lower** |
| collection | Select@1000 | component mounts / selection | 7010.00 | 1.00 | ×0.000 | **lower** |
| collection | RadioGroup@5000 | component updates / selection | 25009.00 | 12.00 | ×0.000 | **lower** |
| collection | Select@5000 | heap KB/item | 21.23 | 0.01 | ×0.001 | **lower** |
| collection | Select@5000 | component updates / selection | 35038.00 | 19.00 | ×0.001 | **lower** |
| collection | Tabs@5000 | component updates / selection | 16.00 | 20006.00 | ×1250.38 | **higher** |
| collection | DropdownMenu@5000 | component updates / key | 3.33 | 1668.00 | ×500.40 | **higher** |
| collection | RadioGroup@1000 | component updates / selection | 5009.00 | 12.00 | ×0.002 | **lower** |
| collection | Select@5000 | mount ms | 400.40 | 1.00 | ×0.002 | **lower** |
| collection | Select@1000 | heap KB/item | 21.66 | 0.06 | ×0.003 | **lower** |
| collection | Select@1000 | component updates / selection | 7038.00 | 19.00 | ×0.003 | **lower** |
| collection | Tabs@1000 | component updates / selection | 16.00 | 4006.00 | ×250.38 | **higher** |
| collection | RadioGroup@5000 | select ms | 4346.90 | 24.00 | ×0.006 | **lower** |
| collection | Select@1000 | mount ms | 103.80 | 1.00 | ×0.010 | **lower** |
| collection | DropdownMenu@1000 | component updates / key | 3.33 | 334.67 | ×100.40 | **higher** |
| collection | Select@5000 | select ms | 3425.40 | 59.90 | ×0.017 | **lower** |
| collection | Tabs@5000 | select ms | 3.50 | 130.00 | ×37.14 | **higher** |
| collection | Tabs@1000 | select ms | 0.70 | 25.80 | ×36.86 | **higher** |
| collection | RadioGroup@5000 | ms/key | 6.80 | 0.20 | ×0.029 | **lower** |
| collection | RadioGroup@1000 | select ms | 145.70 | 5.50 | ×0.038 | **lower** |
| collection | Select@1000 | select ms | 220.90 | 11.60 | ×0.053 | **lower** |
| collection | DropdownMenu@5000 | type ms | 0.40 | 5.50 | ×13.75 | **higher** |
| collection | Listbox@5000 | type ms | 0.40 | 5.40 | ×13.50 | **higher** |
| collection | Tree@5000 | type ms | 0.40 | 4.90 | ×12.25 | **higher** |
| collection | Tree@5000 | ms/key | 0.50 | 5.95 | ×11.90 | **higher** |
| collection | Tabs@5000 | mount ms | 4765.00 | 430.80 | ×0.090 | **lower** |
| collection | Select@5000 | type ms | 0.60 | 6.50 | ×10.83 | **higher** |
| mount | Select | components/inst | 54.01 | 6.01 | ×0.11 | **lower** |
| mount | Select | listeners/inst | 53.00 | 6.00 | ×0.11 | **lower** |
| collection | Listbox@5000 | select ms | 23.50 | 3.20 | ×0.14 | **lower** |
| mount | Select | mount ms | 86.80 | 14.80 | ×0.17 | **lower** |
| mount | Select | heap KB/inst | 170.23 | 29.53 | ×0.17 | **lower** |
| mount | Menubar | after-unmount KB/inst | 2.86 | 0.50 | ×0.18 | **lower** |
| collection | Tabs@1000 | component updates / key | 11.33 | 2.00 | ×0.18 | **lower** |
| collection | Tabs@5000 | component updates / key | 11.33 | 2.00 | ×0.18 | **lower** |
| collection | Tree@5000 | select ms | 723.40 | 136.70 | ×0.19 | **lower** |
| mount | Select | DOM nodes/inst | 84.02 | 17.02 | ×0.20 | **lower** |
| collection | Listbox@5000 | mount ms | 843.50 | 176.90 | ×0.21 | **lower** |
| mount | Menubar | components/inst | 62.01 | 13.01 | ×0.21 | **lower** |
| collection | RadioGroup@5000 | mount ms | 1559.00 | 331.70 | ×0.21 | **lower** |
| collection | Tree@1000 | ms/key | 0.20 | 0.90 | ×4.50 | **higher** |
| collection | ToggleGroup@5000 | select ms | 1183.80 | 271.40 | ×0.23 | **lower** |
| mount | Tree | components/inst | 30.00 | 7.00 | ×0.23 | **lower** |
| mount | Menubar | mount ms | 147.80 | 35.90 | ×0.24 | **lower** |
| collection | Tree@5000 | component updates / selection | 20001.00 | 5001.00 | ×0.25 | **lower** |
| collection | Tree@1000 | component updates / selection | 4001.00 | 1001.00 | ×0.25 | **lower** |
| collection | Combobox@5000 | component updates / selection | 5043.00 | 20012.00 | ×3.97 | **higher** |
| mount | Menubar | heap KB/inst | 222.62 | 57.87 | ×0.26 | **lower** |
| collection | Combobox@1000 | component updates / selection | 1043.00 | 4012.00 | ×3.85 | **higher** |
| mount | Slider | components/inst | 15.00 | 4.00 | ×0.27 | **lower** |
| collection | Tree@1000 | select ms | 62.40 | 16.80 | ×0.27 | **lower** |
| mount | ContextMenu | components/inst | 14.01 | 4.01 | ×0.29 | **lower** |
| mount | DropdownMenu | components/inst | 14.01 | 4.01 | ×0.29 | **lower** |
| collection | Listbox@1000 | select ms | 4.40 | 1.30 | ×0.30 | **lower** |
| collection | Tree@1000 | type ms | 0.30 | 1.00 | ×3.33 | **higher** |
| mount | ContextMenu | heap KB/inst | 53.30 | 16.25 | ×0.30 | **lower** |
| mount | AlertDialog | components/inst | 13.01 | 4.01 | ×0.31 | **lower** |
| collection | Listbox@1000 | mount ms | 130.80 | 43.10 | ×0.33 | **lower** |
| collection | DropdownMenu@1000 | querySelectorAll calls / key | 1.00 | 0.33 | ×0.33 | **lower** |
| collection | DropdownMenu@5000 | querySelectorAll calls / key | 1.00 | 0.33 | ×0.33 | **lower** |
| collection | Tree@1000 | component updates / key | 6.00 | 2.00 | ×0.33 | **lower** |
| collection | Tree@1000 | component updates / typed char | 6.00 | 2.00 | ×0.33 | **lower** |
| collection | Tree@5000 | component updates / key | 6.00 | 2.00 | ×0.33 | **lower** |
| collection | Tree@5000 | component updates / typed char | 6.00 | 2.00 | ×0.33 | **lower** |
| mount | ContextMenu | mount ms | 28.20 | 9.40 | ×0.33 | **lower** |
| mount | Listbox | components/inst | 36.00 | 12.00 | ×0.33 | **lower** |
| mount | TagGroup | components/inst | 30.00 | 10.00 | ×0.33 | **lower** |
| mount | Separator | components/inst | 3.00 | 1.00 | ×0.33 | **lower** |
| mount | Dialog | components/inst | 9.01 | 3.01 | ×0.33 | **lower** |
| mount | Drawer | components/inst | 9.01 | 3.01 | ×0.33 | **lower** |
| mount | RadioGroup | mount ms | 256.70 | 88.40 | ×0.34 | **lower** |
| mount | Autocomplete | components/inst | 17.01 | 6.01 | ×0.35 | **lower** |
| mount | Combobox | components/inst | 17.01 | 6.01 | ×0.35 | **lower** |
| collection | RadioGroup@1000 | mount ms | 217.40 | 77.40 | ×0.36 | **lower** |
| mount | Drawer | heap KB/inst | 40.03 | 14.26 | ×0.36 | **lower** |
| mount | HoverCard | heap KB/inst | 37.23 | 13.40 | ×0.36 | **lower** |
| mount | ContextMenu | DOM nodes/inst | 25.02 | 9.02 | ×0.36 | **lower** |
| collection | Combobox@5000 | select ms | 523.60 | 189.50 | ×0.36 | **lower** |
| mount | TagsInput | components/inst | 22.00 | 8.00 | ×0.36 | **lower** |
| mount | Drawer | mount ms | 17.70 | 6.60 | ×0.37 | **lower** |
| mount | ColorSlider | components/inst | 16.00 | 6.00 | ×0.38 | **lower** |
| collection | ToggleGroup@1000 | select ms | 78.00 | 29.60 | ×0.38 | **lower** |
| mount | Listbox | mount ms | 247.20 | 94.20 | ×0.38 | **lower** |
| mount | CheckboxGroup | mount ms | 228.20 | 87.50 | ×0.38 | **lower** |
| mount | DropdownMenu | heap KB/inst | 52.44 | 20.13 | ×0.38 | **lower** |
| mount | RadioGroup | components/inst | 28.00 | 11.00 | ×0.39 | **lower** |
| collection | Select@5000 | open ms | 665.40 | 264.30 | ×0.40 | **lower** |
| mount | HoverCard | mount ms | 17.30 | 6.90 | ×0.40 | **lower** |
| mount | ColorArea | interaction ms | 0.30 | 0.75 | ×2.50 | **higher** |
| collection | ToggleGroup@5000 | component updates / selection | 25001.00 | 10001.00 | ×0.40 | **lower** |
| collection | ToggleGroup@1000 | component updates / selection | 5001.00 | 2001.00 | ×0.40 | **lower** |
| mount | HoverCard | components/inst | 10.01 | 4.01 | ×0.40 | **lower** |
| mount | Popover | components/inst | 10.01 | 4.01 | ×0.40 | **lower** |
| mount | Tooltip | components/inst | 10.02 | 4.02 | ×0.40 | **lower** |
| collection | Tabs@1000 | mount ms | 191.20 | 77.10 | ×0.40 | **lower** |
| mount | Combobox | mount ms | 50.10 | 20.30 | ×0.41 | **lower** |
| mount | DropdownMenu | mount ms | 24.40 | 10.00 | ×0.41 | **lower** |
| mount | AlertDialog | heap KB/inst | 47.00 | 19.37 | ×0.41 | **lower** |
| mount | Select | close ms | 3.10 | 1.30 | ×0.42 | **lower** |
| mount | Slider | mount ms | 167.40 | 70.70 | ×0.42 | **lower** |
| mount | CheckboxGroup | components/inst | 21.00 | 9.00 | ×0.43 | **lower** |
| mount | ToggleGroup | components/inst | 21.00 | 9.00 | ×0.43 | **lower** |
| mount | DropdownMenu | DOM nodes/inst | 21.02 | 9.02 | ×0.43 | **lower** |
| collection | RadioGroup@5000 | heap KB/item | 34.48 | 14.90 | ×0.43 | **lower** |
| mount | Tooltip | heap KB/inst | 39.86 | 17.24 | ×0.43 | **lower** |
| mount | RangeCalendar | mount ms | 126.60 | 54.80 | ×0.43 | **lower** |
| mount | Autocomplete | mount ms | 49.20 | 21.30 | ×0.43 | **lower** |
| mount | Toolbar | components/inst | 39.00 | 17.00 | ×0.44 | **lower** |
| collection | RadioGroup@1000 | heap KB/item | 35.07 | 15.34 | ×0.44 | **lower** |
| mount | Dialog | DOM nodes/inst | 16.02 | 7.02 | ×0.44 | **lower** |
| mount | Drawer | DOM nodes/inst | 16.02 | 7.02 | ×0.44 | **lower** |
| mount | CheckboxGroup | heap KB/inst | 118.70 | 52.12 | ×0.44 | **lower** |
| mount | Rating | interaction ms | 0.90 | 0.40 | ×0.44 | **lower** |
| collection | Select@1000 | open ms | 151.10 | 67.80 | ×0.45 | **lower** |
| mount | Checkbox | heap KB/inst | 20.85 | 9.39 | ×0.45 | **lower** |
| mount | AlertDialog | DOM nodes/inst | 20.02 | 9.02 | ×0.45 | **lower** |
| mount | NavigationMenu | components/inst | 31.01 | 14.01 | ×0.45 | **lower** |
| mount | Dialog | mount ms | 17.10 | 7.80 | ×0.46 | **lower** |
| mount | RangeCalendar | heap KB/inst | 780.55 | 357.91 | ×0.46 | **lower** |
| collection | Tree@1000 | mount ms | 129.20 | 59.30 | ×0.46 | **lower** |
| mount | Slider | heap KB/inst | 50.77 | 23.34 | ×0.46 | **lower** |
| mount | Tooltip | mount ms | 17.80 | 8.20 | ×0.46 | **lower** |
| mount | RadioGroup | heap KB/inst | 128.35 | 59.29 | ×0.46 | **lower** |
| collection | Tree@5000 | mount ms | 535.10 | 247.20 | ×0.46 | **lower** |
| mount | DateRangePicker | DOM nodes/inst | 93.02 | 43.02 | ×0.46 | **lower** |
| collection | ToggleGroup@5000 | mount ms | 1080.40 | 500.90 | ×0.46 | **lower** |
| mount | TagsInput | mount ms | 147.00 | 68.20 | ×0.46 | **lower** |
| mount | Rating | mount ms | 672.30 | 316.30 | ×0.47 | **lower** |
| mount | Menubar | DOM nodes/inst | 68.02 | 32.02 | ×0.47 | **lower** |
| mount | Toast | components/inst | 17.14 | 8.08 | ×0.47 | **lower** |
| mount | Toolbar | mount ms | 286.50 | 135.20 | ×0.47 | **lower** |
| collection | Tree@5000 | heap KB/item | 17.75 | 8.39 | ×0.47 | **lower** |
| mount | Editable | interaction ms | 1.05 | 0.50 | ×0.48 | **lower** |
| mount | Tabs | components/inst | 23.00 | 11.00 | ×0.48 | **lower** |
| mount | ColorSlider | mount ms | 176.30 | 84.40 | ×0.48 | **lower** |
| collection | Tree@1000 | heap KB/item | 18.23 | 8.79 | ×0.48 | **lower** |
| mount | TagGroup | mount ms | 228.20 | 110.20 | ×0.48 | **lower** |
| mount | Toast | interaction ms | 9.95 | 4.85 | ×0.49 | **lower** |
| mount | TagGroup | heap KB/inst | 108.38 | 52.99 | ×0.49 | **lower** |
| mount | Dialog | heap KB/inst | 33.75 | 16.64 | ×0.49 | **lower** |
| mount | Tree | heap KB/inst | 132.32 | 65.64 | ×0.50 | **lower** |
| mount | Toast | mount ms | 47.70 | 23.70 | ×0.50 | **lower** |
| mount | Separator | heap KB/inst | 6.48 | 3.22 | ×0.50 | **lower** |
| mount | Calendar | heap KB/inst | 664.42 | 331.68 | ×0.50 | **lower** |
| mount | Checkbox | listeners/inst | 4.00 | 2.00 | ×0.50 | **lower** |
| mount | Collapsible | listeners/inst | 6.00 | 3.00 | ×0.50 | **lower** |
| mount | RangeCalendar | interaction ms | 4.00 | 2.00 | ×0.50 | **lower** |
| collection | Combobox@1000 | querySelectorAll calls / selection | 1.00 | 2.00 | ×2.00 | **higher** |
| collection | Combobox@5000 | querySelectorAll calls / selection | 1.00 | 2.00 | ×2.00 | **higher** |
| collection | DropdownMenu@1000 | component updates / typed char | 4.00 | 2.00 | ×0.50 | **lower** |
| collection | DropdownMenu@5000 | component updates / typed char | 4.00 | 2.00 | ×0.50 | **lower** |
| collection | Listbox@1000 | component updates / key | 8.00 | 4.00 | ×0.50 | **lower** |
| collection | Listbox@1000 | component updates / typed char | 8.00 | 4.00 | ×0.50 | **lower** |
| collection | Listbox@1000 | component updates / selection | 10.00 | 5.00 | ×0.50 | **lower** |
| collection | Listbox@5000 | component updates / key | 8.00 | 4.00 | ×0.50 | **lower** |
| collection | Listbox@5000 | component updates / typed char | 8.00 | 4.00 | ×0.50 | **lower** |
| collection | Listbox@5000 | component updates / selection | 10.00 | 5.00 | ×0.50 | **lower** |
| collection | RadioGroup@1000 | component updates / key | 8.00 | 4.00 | ×0.50 | **lower** |
| collection | RadioGroup@5000 | component updates / key | 8.00 | 4.00 | ×0.50 | **lower** |
| collection | ToggleGroup@1000 | component updates / key | 8.00 | 4.00 | ×0.50 | **lower** |
| collection | ToggleGroup@5000 | component updates / key | 8.00 | 4.00 | ×0.50 | **lower** |
| mount | Pagination | components/inst | 26.00 | 13.00 | ×0.50 | **lower** |
| mount | Calendar | components/inst | 182.03 | 91.03 | ×0.50 | **lower** |
| mount | RangeCalendar | components/inst | 182.03 | 91.03 | ×0.50 | **lower** |
| mount | TimeField | components/inst | 16.00 | 8.00 | ×0.50 | **lower** |
| mount | ColorArea | DOM nodes/inst | 11.01 | 22.01 | ×2.00 | **higher** |
| mount | DateField | components/inst | 14.01 | 7.00 | ×0.50 | **lower** |
| mount | TimeRangeField | components/inst | 28.01 | 14.01 | ×0.50 | **lower** |
| mount | NumberField | components/inst | 8.00 | 4.00 | ×0.50 | **lower** |
| mount | DateRangeField | components/inst | 24.01 | 12.01 | ×0.50 | **lower** |
| mount | Checkbox | components/inst | 4.00 | 2.00 | ×0.50 | **lower** |
| mount | ColorField | components/inst | 4.00 | 2.00 | ×0.50 | **lower** |
| mount | Progress | components/inst | 4.00 | 2.00 | ×0.50 | **lower** |
| mount | Switch | components/inst | 4.00 | 2.00 | ×0.50 | **lower** |
| mount | ColorArea | components/inst | 6.00 | 3.00 | ×0.50 | **lower** |
| mount | AspectRatio | components/inst | 2.00 | 1.00 | ×0.50 | **lower** |
| mount | ColorSwatch | components/inst | 2.00 | 1.00 | ×0.50 | **lower** |
| mount | Label | components/inst | 2.00 | 1.00 | ×0.50 | **lower** |
| mount | Toggle | components/inst | 2.00 | 1.00 | ×0.50 | **lower** |
| mount | RefPrimitiveAsChild | components/inst | 1.00 | 2.00 | ×2.00 | **higher** |
| mount | Combobox | heap KB/inst | 81.56 | 41.36 | ×0.51 | **lower** |
| mount | Calendar | DOM nodes/inst | 337.07 | 171.07 | ×0.51 | **lower** |
| mount | Tree | mount ms | 167.10 | 85.20 | ×0.51 | **lower** |
| mount | RangeCalendar | DOM nodes/inst | 337.07 | 172.07 | ×0.51 | **lower** |
| mount | Calendar | mount ms | 107.30 | 55.50 | ×0.52 | **lower** |
| mount | Autocomplete | heap KB/inst | 77.89 | 40.80 | ×0.52 | **lower** |
| mount | TagsInput | heap KB/inst | 69.43 | 36.49 | ×0.53 | **lower** |
| mount | HoverCard | DOM nodes/inst | 17.02 | 9.02 | ×0.53 | **lower** |
| mount | Popover | DOM nodes/inst | 17.02 | 9.02 | ×0.53 | **lower** |
| mount | Tooltip | DOM nodes/inst | 17.04 | 9.04 | ×0.53 | **lower** |
| mount | AlertDialog | mount ms | 21.50 | 11.50 | ×0.53 | **lower** |
| collection | Listbox@5000 | heap KB/item | 19.58 | 10.47 | ×0.53 | **lower** |
| mount | Toolbar | heap KB/inst | 130.57 | 69.91 | ×0.54 | **lower** |
| collection | Combobox@1000 | component updates / key | 13.00 | 7.00 | ×0.54 | **lower** |
| collection | Combobox@5000 | component updates / key | 13.00 | 7.00 | ×0.54 | **lower** |
| collection | ToggleGroup@1000 | mount ms | 162.20 | 87.60 | ×0.54 | **lower** |
| mount | Popover | mount ms | 18.70 | 10.10 | ×0.54 | **lower** |
| collection | Listbox@1000 | heap KB/item | 20.13 | 10.91 | ×0.54 | **lower** |
| mount | NavigationMenu | heap KB/inst | 116.79 | 63.62 | ×0.54 | **lower** |
| mount | NavigationMenu | mount ms | 60.60 | 33.10 | ×0.55 | **lower** |
| mount | RadioGroup | listeners/inst | 31.00 | 17.01 | ×0.55 | **lower** |
| mount | Popover | heap KB/inst | 36.88 | 20.32 | ×0.55 | **lower** |
| mount | ColorSwatchPicker | components/inst | 63.01 | 35.01 | ×0.56 | **lower** |
| mount | Pagination | mount ms | 113.90 | 64.00 | ×0.56 | **lower** |
| mount | RefPrimitiveAsChild | heap KB/inst | 1.95 | 3.46 | ×1.78 | **higher** |
| mount | ToggleGroup | mount ms | 171.80 | 96.90 | ×0.56 | **lower** |
| collection | ToggleGroup@5000 | heap KB/item | 20.64 | 11.73 | ×0.57 | **lower** |
| mount | Select | interaction ms | 3.60 | 2.05 | ×0.57 | **lower** |
| mount | Accordion | listeners/inst | 21.00 | 12.00 | ×0.57 | **lower** |
| mount | Collapsible | components/inst | 7.00 | 4.00 | ×0.57 | **lower** |
| mount | DateRangeField | heap KB/inst | 111.25 | 63.68 | ×0.57 | **lower** |
| mount | Checkbox | mount ms | 38.60 | 22.20 | ×0.58 | **lower** |
| mount | DatePicker | components/inst | 33.01 | 19.01 | ×0.58 | **lower** |
| mount | TimeRangeField | heap KB/inst | 121.72 | 70.30 | ×0.58 | **lower** |
| mount | ColorSlider | heap KB/inst | 59.57 | 34.42 | ×0.58 | **lower** |
| collection | ToggleGroup@1000 | heap KB/item | 21.14 | 12.24 | ×0.58 | **lower** |
| mount | DatePicker | interaction ms | 7.65 | 4.45 | ×0.58 | **lower** |
| mount | Tabs | heap KB/inst | 106.96 | 62.75 | ×0.59 | **lower** |
| collection | Tabs@5000 | heap KB/item | 26.21 | 15.44 | ×0.59 | **lower** |
| mount | ColorSwatchPicker | mount ms | 220.40 | 130.10 | ×0.59 | **lower** |
| collection | Combobox@5000 | heap open KB/item | 25.94 | 15.33 | ×0.59 | **lower** |
| mount | Tabs | mount ms | 180.30 | 106.80 | ×0.59 | **lower** |
| mount | TimeRangeField | DOM nodes/inst | 59.02 | 35.02 | ×0.59 | **lower** |
| mount | ToggleGroup | heap KB/inst | 84.96 | 50.42 | ×0.59 | **lower** |
| mount | Collapsible | mount ms | 80.20 | 47.60 | ×0.59 | **lower** |
| collection | Tabs@1000 | heap KB/item | 26.79 | 15.96 | ×0.60 | **lower** |
| mount | Stepper | mount ms | 255.10 | 152.20 | ×0.60 | **lower** |
| mount | Rating | components/inst | 62.00 | 37.00 | ×0.60 | **lower** |
| collection | Combobox@1000 | heap open KB/item | 26.53 | 15.87 | ×0.60 | **lower** |
| collection | DropdownMenu@5000 | select ms | 198.60 | 119.00 | ×0.60 | **lower** |
| collection | Select@1000 | component updates / key | 10.00 | 6.00 | ×0.60 | **lower** |
| collection | Select@1000 | component updates / typed char | 10.00 | 6.00 | ×0.60 | **lower** |
| collection | Select@5000 | component updates / key | 10.00 | 6.00 | ×0.60 | **lower** |
| collection | Select@5000 | component updates / typed char | 10.00 | 6.00 | ×0.60 | **lower** |
| mount | Avatar | components/inst | 5.00 | 3.00 | ×0.60 | **lower** |
| mount | Pagination | heap KB/inst | 76.46 | 46.04 | ×0.60 | **lower** |
| mount | DateRangePicker | components/inst | 48.01 | 29.01 | ×0.60 | **lower** |
| mount | DateField | heap KB/inst | 66.11 | 39.98 | ×0.60 | **lower** |
| mount | DateRangePicker | interaction ms | 7.75 | 4.70 | ×0.61 | **lower** |
| mount | CheckboxGroup | listeners/inst | 28.00 | 17.00 | ×0.61 | **lower** |
| mount | DateRangeField | DOM nodes/inst | 51.02 | 31.02 | ×0.61 | **lower** |
| collection | Select@5000 | heap open KB/item | 21.64 | 13.16 | ×0.61 | **lower** |
| mount | DatePicker | DOM nodes/inst | 74.02 | 45.02 | ×0.61 | **lower** |
| collection | Select@1000 | heap open KB/item | 22.34 | 13.63 | ×0.61 | **lower** |
| mount | Listbox | heap KB/inst | 121.90 | 74.43 | ×0.61 | **lower** |
| mount | NumberField | mount ms | 96.20 | 59.10 | ×0.61 | **lower** |
| mount | PinInput | components/inst | 13.00 | 8.00 | ×0.62 | **lower** |
| mount | Menubar | close ms | 2.75 | 1.70 | ×0.62 | **lower** |
| mount | TimeField | heap KB/inst | 67.29 | 41.62 | ×0.62 | **lower** |
| mount | Separator | mount ms | 12.50 | 7.80 | ×0.62 | **lower** |
| mount | Rating | heap KB/inst | 277.89 | 173.57 | ×0.62 | **lower** |
| mount | ColorSwatch | heap KB/inst | 5.40 | 3.42 | ×0.63 | **lower** |
| mount | TimeField | DOM nodes/inst | 33.01 | 21.01 | ×0.64 | **lower** |
| mount | Field | components/inst | 11.00 | 7.00 | ×0.64 | **lower** |
| collection | DropdownMenu@5000 | mount ms | 1.40 | 0.90 | ×0.64 | **lower** |
| mount | Progress | mount ms | 24.40 | 15.70 | ×0.64 | **lower** |
| mount | Toast | heap KB/inst | 69.52 | 44.77 | ×0.64 | **lower** |
| mount | Field | mount ms | 87.20 | 56.60 | ×0.65 | **lower** |
| mount | DropdownMenu | close ms | 2.00 | 1.30 | ×0.65 | **lower** |
| collection | Combobox@1000 | mount ms | 2.00 | 1.30 | ×0.65 | **lower** |
| mount | Form | components/inst | 29.00 | 19.00 | ×0.66 | **lower** |
| mount | Autocomplete | DOM nodes/inst | 29.02 | 19.02 | ×0.66 | **lower** |
| mount | DatePicker | close ms | 3.35 | 2.20 | ×0.66 | **lower** |
| mount | Progress | heap KB/inst | 12.59 | 8.31 | ×0.66 | **lower** |
| mount | Switch | mount ms | 37.30 | 24.80 | ×0.66 | **lower** |
| mount | Collapsible | heap KB/inst | 27.04 | 18.03 | ×0.67 | **lower** |
| mount | DropdownMenu | listeners/inst | 3.03 | 2.03 | ×0.67 | **lower** |
| mount | Switch | heap KB/inst | 14.72 | 9.98 | ×0.68 | **lower** |
| mount | DateRangePicker | heap KB/inst | 180.83 | 122.63 | ×0.68 | **lower** |
| mount | DatePicker | heap KB/inst | 128.34 | 87.57 | ×0.68 | **lower** |
| mount | Rating | listeners/inst | 60.00 | 41.01 | ×0.68 | **lower** |
| mount | ColorSwatch | mount ms | 13.50 | 9.30 | ×0.69 | **lower** |
| mount | Combobox | DOM nodes/inst | 29.02 | 20.02 | ×0.69 | **lower** |
| collection | DropdownMenu@5000 | open ms | 539.50 | 373.50 | ×0.69 | **lower** |
| collection | DropdownMenu@5000 | heap open KB/item | 15.81 | 10.96 | ×0.69 | **lower** |
| mount | Toggle | heap KB/inst | 9.14 | 6.34 | ×0.69 | **lower** |
| mount | Toolbar | listeners/inst | 23.00 | 16.00 | ×0.70 | **lower** |
| mount | TimeRangeField | mount ms | 72.40 | 50.80 | ×0.70 | **lower** |
| mount | PinInput | mount ms | 141.90 | 99.90 | ×0.70 | **lower** |
| mount | AspectRatio | heap KB/inst | 5.98 | 4.22 | ×0.71 | **lower** |
| mount | Tree | listeners/inst | 41.00 | 29.00 | ×0.71 | **lower** |
| collection | DropdownMenu@1000 | heap open KB/item | 16.29 | 11.58 | ×0.71 | **lower** |
| mount | ColorSwatchPicker | heap KB/inst | 189.21 | 134.77 | ×0.71 | **lower** |
| mount | Tabs | listeners/inst | 28.00 | 20.00 | ×0.71 | **lower** |
| collection | Combobox@5000 | mount ms | 2.10 | 1.50 | ×0.71 | **lower** |
| mount | DateRangeField | mount ms | 68.80 | 49.20 | ×0.72 | **lower** |
| mount | Form | mount ms | 142.70 | 104.90 | ×0.74 | **lower** |
| mount | ToggleGroup | listeners/inst | 19.00 | 14.00 | ×0.74 | **lower** |
| mount | Field | heap KB/inst | 48.54 | 35.89 | ×0.74 | **lower** |
| collection | Combobox@5000 | open ms | 696.10 | 516.90 | ×0.74 | **lower** |
| mount | Form | heap KB/inst | 134.37 | 99.94 | ×0.74 | **lower** |
| collection | DropdownMenu@1000 | component updates / selection | 4021.00 | 3011.00 | ×0.75 | **lower** |
| collection | DropdownMenu@5000 | component updates / selection | 20021.00 | 15011.00 | ×0.75 | **lower** |
| mount | DateRangePicker | close ms | 3.60 | 2.70 | ×0.75 | **lower** |
| mount | ColorArea | listeners/inst | 6.00 | 8.00 | ×1.33 | **higher** |
| mount | Avatar | mount ms | 54.80 | 41.20 | ×0.75 | **lower** |
| mount | PinInput | heap KB/inst | 59.37 | 44.90 | ×0.76 | **lower** |
| collection | DropdownMenu@1000 | open ms | 126.20 | 95.50 | ×0.76 | **lower** |
| collection | DropdownMenu@1000 | select ms | 33.70 | 25.60 | ×0.76 | **lower** |
| mount | ColorSlider | DOM nodes/inst | 17.00 | 13.00 | ×0.76 | **lower** |
| mount | Slider | DOM nodes/inst | 17.00 | 13.00 | ×0.76 | **lower** |
| mount | Avatar | heap KB/inst | 16.13 | 12.34 | ×0.77 | **lower** |
| mount | Stepper | heap KB/inst | 119.87 | 91.76 | ×0.77 | **lower** |
| mount | Accordion | mount ms | 183.70 | 141.70 | ×0.77 | **lower** |
| mount | Accordion | DOM nodes/inst | 41.01 | 53.01 | ×1.29 | **higher** |
| collection | Combobox@1000 | select ms | 41.80 | 32.60 | ×0.78 | **lower** |
| mount | DateField | DOM nodes/inst | 41.01 | 32.01 | ×0.78 | **lower** |
| mount | Accordion | components/inst | 32.00 | 25.00 | ×0.78 | **lower** |
| mount | TagGroup | listeners/inst | 28.00 | 22.00 | ×0.79 | **lower** |
| mount | DatePicker | mount ms | 108.40 | 85.20 | ×0.79 | **lower** |
| mount | NumberField | heap KB/inst | 46.85 | 36.92 | ×0.79 | **lower** |
| mount | Toggle | mount ms | 23.00 | 18.20 | ×0.79 | **lower** |
| mount | ColorField | mount ms | 40.30 | 32.00 | ×0.79 | **lower** |
| mount | Label | heap KB/inst | 5.37 | 4.28 | ×0.80 | **lower** |
| mount | Toast | listeners/inst | 10.15 | 8.12 | ×0.80 | **lower** |
| mount | Editable | listeners/inst | 10.00 | 8.00 | ×0.80 | **lower** |
| mount | ColorArea | heap KB/inst | 22.02 | 18.04 | ×0.82 | **lower** |
| mount | Menubar | listeners/inst | 28.03 | 23.03 | ×0.82 | **lower** |
| mount | ColorField | heap KB/inst | 15.69 | 12.91 | ×0.82 | **lower** |
| mount | PinInput | DOM nodes/inst | 24.01 | 29.01 | ×1.21 | **higher** |
| mount | TagsInput | listeners/inst | 12.00 | 10.00 | ×0.83 | **lower** |
| mount | CheckboxGroup | DOM nodes/inst | 38.01 | 32.01 | ×0.84 | **lower** |
| mount | Autocomplete | listeners/inst | 11.00 | 13.00 | ×1.18 | **higher** |
| collection | DropdownMenu@1000 | mount ms | 1.30 | 1.10 | ×0.85 | **lower** |
| mount | ScrollArea | heap KB/inst | 49.37 | 42.19 | ×0.85 | **lower** |
| mount | ColorSwatchPicker | listeners/inst | 23.00 | 20.00 | ×0.87 | **lower** |
| mount | NavigationMenu | listeners/inst | 17.00 | 15.00 | ×0.88 | **lower** |
| mount | Accordion | heap KB/inst | 113.16 | 100.35 | ×0.89 | **lower** |
| mount | Stepper | components/inst | 40.00 | 36.00 | ×0.90 | **lower** |
| mount | DateField | listeners/inst | 25.00 | 23.00 | ×0.92 | **lower** |
| mount | Combobox | listeners/inst | 12.00 | 13.00 | ×1.08 | **higher** |
| mount | DatePicker | listeners/inst | 27.00 | 25.00 | ×0.93 | **lower** |
| mount | Tabs | DOM nodes/inst | 30.01 | 28.01 | ×0.93 | **lower** |
| mount | RefPrimitive | heap KB/inst | 2.11 | 2.26 | ×1.07 | **higher** |
| mount | Form | listeners/inst | 20.00 | 19.00 | ×0.95 | **lower** |
| mount | Editable | heap KB/inst | 38.89 | 40.59 | ×1.04 | **higher** |
| mount | Splitter | heap KB/inst | 47.10 | 48.64 | ×1.03 | **higher** |

