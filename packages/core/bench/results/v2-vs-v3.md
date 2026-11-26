## Bench compare: v2 → v3

- a = v2: reka-ui 2.11.0 @ 9025f41a9, 2026-11-25T11:12Z, load 97.4 → max 97.4, timings suspect
- b = v3: reka-ui 3.0.0-alpha.0 @ 8eecd9769, 2026-11-25T11:19Z, load 33.62 → max 39.18, timings suspect
- ⚠️ at least one run was not taken on a quiet, gated machine: **ignore the timing rows**, heap and counts are still valid
- ⚠️ only in a: Carousel, MonthPicker, MonthRangePicker, SliderArea, YearPicker, YearRangePicker

Listed when: timings outside ±15% and > 2 × stddev and > 0.1 ms; heap outside ±2% and > 0.1 KB; counts differ by > 1% and ≥ 0.5. Ratios are b / a.

### Spread of b / a

| Class | metrics | geomean | median abs. change | p90 | max | listed |
|---|--:|--:|--:|--:|--:|--:|
| timings | 190 | ×0.284 | 46.6% | 97.3% | 200.0% | 129 |
| heap | 83 | ×0.446 | 48.2% | 65.0% | 100.0% | 75 |
| counts | 258 | ×0.444 | 45.7% | 100.0% | 49940.0% | 174 |

### Changes beyond noise (380 of 704 metrics)

| Scenario | Family | Metric | a | b | b / a |  |
|---|---|---|--:|--:|--:|--:|
| mount | Toast | leaked nodes/inst | 39.16 | 0.00 | ×0.000 | **lower** |
| collection | Combobox@1000 | querySelectorAll calls / key | 1.00 | 0.00 | ×0.000 | **lower** |
| collection | Combobox@5000 | querySelectorAll calls / key | 1.00 | 0.00 | ×0.000 | **lower** |
| collection | DropdownMenu@1000 | querySelectorAll calls / typed char | 2.00 | 0.00 | ×0.000 | **lower** |
| collection | DropdownMenu@5000 | querySelectorAll calls / typed char | 2.00 | 0.00 | ×0.000 | **lower** |
| collection | Listbox@1000 | querySelectorAll calls / key | 1.00 | 0.00 | ×0.000 | **lower** |
| collection | Listbox@1000 | querySelectorAll calls / typed char | 1.00 | 0.00 | ×0.000 | **lower** |
| collection | Listbox@5000 | querySelectorAll calls / key | 1.00 | 0.00 | ×0.000 | **lower** |
| collection | Listbox@5000 | querySelectorAll calls / typed char | 1.00 | 0.00 | ×0.000 | **lower** |
| collection | Select@1000 | querySelectorAll calls / key | 1.00 | 0.00 | ×0.000 | **lower** |
| collection | Select@1000 | querySelectorAll calls / typed char | 1.00 | 0.00 | ×0.000 | **lower** |
| collection | Select@5000 | querySelectorAll calls / key | 1.00 | 0.00 | ×0.000 | **lower** |
| collection | Select@5000 | querySelectorAll calls / typed char | 1.00 | 0.00 | ×0.000 | **lower** |
| collection | Tree@1000 | querySelectorAll calls / typed char | 1.00 | 0.00 | ×0.000 | **lower** |
| collection | Tree@5000 | querySelectorAll calls / typed char | 1.00 | 0.00 | ×0.000 | **lower** |
| collection | Tabs@5000 | ms/key | 17988.60 | 0.20 | ×0.000 | **lower** |
| collection | Select@5000 | component mounts / selection | 40008.00 | 1.00 | ×0.000 | **lower** |
| collection | Tabs@5000 | component updates / key | 50008.00 | 2.00 | ×0.000 | **lower** |
| collection | Select@1000 | component mounts / selection | 8008.00 | 1.00 | ×0.000 | **lower** |
| collection | Listbox@5000 | component updates / key | 30002.00 | 4.00 | ×0.000 | **lower** |
| collection | Listbox@5000 | component updates / typed char | 30002.00 | 4.00 | ×0.000 | **lower** |
| collection | Listbox@5000 | component updates / selection | 30007.00 | 5.00 | ×0.000 | **lower** |
| collection | Tabs@1000 | component updates / key | 10008.00 | 2.00 | ×0.000 | **lower** |
| collection | Select@5000 | component updates / selection | 80040.00 | 19.00 | ×0.000 | **lower** |
| collection | Select@5000 | mount ms | 3988.50 | 1.00 | ×0.000 | **lower** |
| collection | RadioGroup@5000 | component updates / selection | 40009.00 | 12.00 | ×0.000 | **lower** |
| collection | Tabs@1000 | ms/key | 303.80 | 0.10 | ×0.000 | **lower** |
| collection | Select@5000 | heap KB/item | 27.75 | 0.01 | ×0.000 | **lower** |
| collection | Listbox@5000 | ms/key | 786.55 | 0.40 | ×0.001 | **lower** |
| collection | Listbox@1000 | component updates / key | 6002.00 | 4.00 | ×0.001 | **lower** |
| collection | Listbox@1000 | component updates / typed char | 6002.00 | 4.00 | ×0.001 | **lower** |
| collection | Listbox@1000 | component updates / selection | 6007.00 | 5.00 | ×0.001 | **lower** |
| collection | Select@1000 | component updates / selection | 16040.00 | 19.00 | ×0.001 | **lower** |
| collection | Listbox@5000 | select ms | 2460.40 | 3.40 | ×0.001 | **lower** |
| collection | RadioGroup@1000 | component updates / selection | 8009.00 | 12.00 | ×0.001 | **lower** |
| collection | RadioGroup@5000 | select ms | 14273.20 | 23.40 | ×0.002 | **lower** |
| collection | Listbox@1000 | ms/key | 52.30 | 0.10 | ×0.002 | **lower** |
| collection | Select@1000 | heap KB/item | 28.31 | 0.06 | ×0.002 | **lower** |
| collection | DropdownMenu@5000 | component updates / key | 3.33 | 1668.00 | ×500.40 | **higher** |
| collection | Select@1000 | mount ms | 279.10 | 1.00 | ×0.004 | **lower** |
| collection | Tabs@5000 | select ms | 17823.40 | 118.10 | ×0.007 | **lower** |
| collection | Select@5000 | select ms | 8382.20 | 59.60 | ×0.007 | **lower** |
| collection | Listbox@5000 | type ms | 773.95 | 6.30 | ×0.008 | **lower** |
| mount | Toast | after-unmount KB/inst | 48.50 | 0.43 | ×0.009 | **lower** |
| collection | RadioGroup@5000 | ms/key | 22.05 | 0.20 | ×0.009 | **lower** |
| collection | DropdownMenu@1000 | component updates / key | 3.33 | 334.67 | ×100.40 | **higher** |
| collection | Listbox@1000 | select ms | 104.70 | 1.20 | ×0.011 | **lower** |
| collection | Listbox@1000 | type ms | 50.80 | 0.80 | ×0.016 | **lower** |
| collection | ToggleGroup@5000 | ms/key | 12.10 | 0.20 | ×0.017 | **lower** |
| collection | RadioGroup@1000 | select ms | 275.70 | 4.80 | ×0.017 | **lower** |
| collection | Select@1000 | select ms | 467.20 | 9.60 | ×0.021 | **lower** |
| collection | RadioGroup@1000 | ms/key | 3.65 | 0.10 | ×0.027 | **lower** |
| collection | Combobox@5000 | ms/key | 10.90 | 0.30 | ×0.028 | **lower** |
| collection | Select@5000 | ms/key | 6.60 | 0.20 | ×0.030 | **lower** |
| collection | Select@5000 | open ms | 6026.70 | 250.50 | ×0.042 | **lower** |
| collection | Tree@5000 | select ms | 3413.90 | 145.20 | ×0.043 | **lower** |
| collection | Combobox@1000 | ms/key | 1.60 | 0.10 | ×0.063 | **lower** |
| collection | ToggleGroup@5000 | select ms | 4045.50 | 269.30 | ×0.067 | **lower** |
| collection | ToggleGroup@1000 | ms/key | 1.50 | 0.10 | ×0.067 | **lower** |
| collection | RadioGroup@5000 | mount ms | 4710.50 | 314.30 | ×0.067 | **lower** |
| collection | Tabs@5000 | mount ms | 6134.60 | 420.60 | ×0.069 | **lower** |
| collection | Tabs@1000 | select ms | 299.40 | 24.40 | ×0.081 | **lower** |
| mount | Select | components/inst | 60.01 | 6.01 | ×0.10 | **lower** |
| collection | Listbox@5000 | mount ms | 1654.00 | 168.50 | ×0.10 | **lower** |
| collection | Tree@5000 | mount ms | 2432.10 | 248.80 | ×0.10 | **lower** |
| collection | Tree@1000 | select ms | 154.60 | 17.30 | ×0.11 | **lower** |
| mount | Select | listeners/inst | 53.00 | 6.00 | ×0.11 | **lower** |
| mount | Select | mount ms | 120.10 | 14.50 | ×0.12 | **lower** |
| collection | ToggleGroup@5000 | mount ms | 3640.90 | 484.00 | ×0.13 | **lower** |
| collection | Tree@5000 | component updates / selection | 35001.00 | 5001.00 | ×0.14 | **lower** |
| mount | Tree | components/inst | 49.01 | 7.00 | ×0.14 | **lower** |
| collection | Tree@1000 | component updates / selection | 7001.00 | 1001.00 | ×0.14 | **lower** |
| mount | Select | heap KB/inst | 206.15 | 29.53 | ×0.14 | **lower** |
| collection | Select@1000 | open ms | 401.10 | 62.70 | ×0.16 | **lower** |
| collection | DropdownMenu@5000 | open ms | 2140.90 | 359.20 | ×0.17 | **lower** |
| mount | Menubar | components/inst | 75.01 | 13.01 | ×0.17 | **lower** |
| collection | ToggleGroup@1000 | select ms | 165.40 | 29.20 | ×0.18 | **lower** |
| collection | RadioGroup@1000 | mount ms | 401.30 | 72.50 | ×0.18 | **lower** |
| mount | Menubar | after-unmount KB/inst | 2.48 | 0.48 | ×0.19 | **lower** |
| collection | Select@1000 | ms/key | 1.25 | 0.25 | ×0.20 | **lower** |
| mount | Menubar | mount ms | 171.90 | 34.70 | ×0.20 | **lower** |
| mount | Select | DOM nodes/inst | 84.02 | 17.02 | ×0.20 | **lower** |
| collection | Tabs@1000 | mount ms | 335.00 | 72.60 | ×0.22 | **lower** |
| collection | Listbox@1000 | mount ms | 170.40 | 38.10 | ×0.22 | **lower** |
| mount | Menubar | heap KB/inst | 253.45 | 57.81 | ×0.23 | **lower** |
| collection | Tree@1000 | component updates / key | 8.00 | 2.00 | ×0.25 | **lower** |
| collection | Tree@1000 | component updates / typed char | 8.00 | 2.00 | ×0.25 | **lower** |
| collection | Tree@5000 | component updates / key | 8.00 | 2.00 | ×0.25 | **lower** |
| collection | Tree@5000 | component updates / typed char | 8.00 | 2.00 | ×0.25 | **lower** |
| collection | ToggleGroup@5000 | component updates / selection | 40001.00 | 10001.00 | ×0.25 | **lower** |
| mount | TagGroup | components/inst | 40.00 | 10.00 | ×0.25 | **lower** |
| collection | ToggleGroup@1000 | component updates / selection | 8001.00 | 2001.00 | ×0.25 | **lower** |
| collection | Combobox@5000 | component updates / selection | 5047.00 | 20012.00 | ×3.97 | **higher** |
| mount | RadioGroup | mount ms | 353.60 | 89.30 | ×0.25 | **lower** |
| mount | Toolbar | mount ms | 481.90 | 125.30 | ×0.26 | **lower** |
| collection | Combobox@1000 | component updates / selection | 1047.00 | 4012.00 | ×3.83 | **higher** |
| mount | Slider | components/inst | 15.00 | 4.00 | ×0.27 | **lower** |
| mount | CheckboxGroup | mount ms | 286.60 | 76.50 | ×0.27 | **lower** |
| mount | ContextMenu | components/inst | 15.01 | 4.01 | ×0.27 | **lower** |
| mount | DropdownMenu | components/inst | 15.01 | 4.01 | ×0.27 | **lower** |
| collection | Tree@1000 | mount ms | 222.60 | 61.50 | ×0.28 | **lower** |
| mount | Tree | mount ms | 272.70 | 76.00 | ×0.28 | **lower** |
| mount | TagGroup | mount ms | 353.90 | 99.00 | ×0.28 | **lower** |
| mount | Tabs | components/inst | 39.00 | 11.00 | ×0.28 | **lower** |
| collection | ToggleGroup@1000 | mount ms | 274.40 | 78.50 | ×0.29 | **lower** |
| mount | RadioGroup | components/inst | 38.00 | 11.00 | ×0.29 | **lower** |
| mount | ToggleGroup | components/inst | 31.00 | 9.00 | ×0.29 | **lower** |
| mount | ContextMenu | mount ms | 27.40 | 8.00 | ×0.29 | **lower** |
| mount | Rating | mount ms | 1074.10 | 313.70 | ×0.29 | **lower** |
| mount | ContextMenu | heap KB/inst | 55.78 | 16.29 | ×0.29 | **lower** |
| collection | Combobox@5000 | select ms | 568.90 | 167.80 | ×0.29 | **lower** |
| collection | DropdownMenu@5000 | type ms | 13.90 | 4.10 | ×0.29 | **lower** |
| mount | Checkbox | mount ms | 60.30 | 17.90 | ×0.30 | **lower** |
| mount | Toolbar | components/inst | 57.00 | 17.00 | ×0.30 | **lower** |
| mount | Select | close ms | 3.45 | 1.05 | ×0.30 | **lower** |
| mount | AlertDialog | components/inst | 13.01 | 4.01 | ×0.31 | **lower** |
| collection | Tree@5000 | heap KB/item | 25.49 | 8.39 | ×0.33 | **lower** |
| mount | Tabs | mount ms | 306.00 | 101.10 | ×0.33 | **lower** |
| collection | DropdownMenu@1000 | querySelectorAll calls / key | 1.00 | 0.33 | ×0.33 | **lower** |
| collection | DropdownMenu@5000 | querySelectorAll calls / key | 1.00 | 0.33 | ×0.33 | **lower** |
| collection | RadioGroup@1000 | querySelectorAll calls / key | 1.00 | 0.33 | ×0.33 | **lower** |
| collection | RadioGroup@5000 | querySelectorAll calls / key | 1.00 | 0.33 | ×0.33 | **lower** |
| collection | Tabs@1000 | querySelectorAll calls / key | 1.00 | 0.33 | ×0.33 | **lower** |
| collection | Tabs@5000 | querySelectorAll calls / key | 1.00 | 0.33 | ×0.33 | **lower** |
| collection | ToggleGroup@1000 | querySelectorAll calls / key | 1.00 | 0.33 | ×0.33 | **lower** |
| collection | ToggleGroup@5000 | querySelectorAll calls / key | 1.00 | 0.33 | ×0.33 | **lower** |
| collection | Tree@1000 | querySelectorAll calls / key | 1.00 | 0.33 | ×0.33 | **lower** |
| collection | Tree@5000 | querySelectorAll calls / key | 1.00 | 0.33 | ×0.33 | **lower** |
| mount | ColorArea | interaction ms | 0.20 | 0.60 | ×3.00 | **higher** |
| mount | Listbox | components/inst | 36.00 | 12.00 | ×0.33 | **lower** |
| mount | CheckboxGroup | components/inst | 27.00 | 9.00 | ×0.33 | **lower** |
| mount | Autocomplete | components/inst | 18.01 | 6.01 | ×0.33 | **lower** |
| mount | Combobox | components/inst | 18.01 | 6.01 | ×0.33 | **lower** |
| mount | Separator | components/inst | 3.00 | 1.00 | ×0.33 | **lower** |
| mount | Dialog | components/inst | 9.01 | 3.01 | ×0.33 | **lower** |
| mount | Drawer | components/inst | 9.01 | 3.01 | ×0.33 | **lower** |
| collection | Tree@1000 | heap KB/item | 25.95 | 8.77 | ×0.34 | **lower** |
| mount | HoverCard | heap KB/inst | 39.60 | 13.40 | ×0.34 | **lower** |
| mount | Listbox | mount ms | 265.90 | 91.90 | ×0.35 | **lower** |
| mount | Toast | interaction ms | 11.95 | 4.15 | ×0.35 | **lower** |
| collection | RadioGroup@5000 | heap KB/item | 42.70 | 14.90 | ×0.35 | **lower** |
| mount | Drawer | heap KB/inst | 40.35 | 14.25 | ×0.35 | **lower** |
| collection | RadioGroup@1000 | heap KB/item | 43.31 | 15.35 | ×0.35 | **lower** |
| collection | DropdownMenu@1000 | open ms | 251.40 | 89.10 | ×0.35 | **lower** |
| mount | ContextMenu | DOM nodes/inst | 25.02 | 9.02 | ×0.36 | **lower** |
| mount | TagsInput | components/inst | 22.00 | 8.00 | ×0.36 | **lower** |
| mount | HoverCard | components/inst | 11.01 | 4.01 | ×0.36 | **lower** |
| mount | Popover | components/inst | 11.01 | 4.01 | ×0.36 | **lower** |
| mount | Tooltip | components/inst | 11.02 | 4.02 | ×0.36 | **lower** |
| mount | DropdownMenu | heap KB/inst | 54.75 | 20.13 | ×0.37 | **lower** |
| mount | Tree | heap KB/inst | 178.39 | 65.60 | ×0.37 | **lower** |
| mount | TagsInput | mount ms | 161.20 | 59.80 | ×0.37 | **lower** |
| mount | CheckboxGroup | heap KB/inst | 140.36 | 52.11 | ×0.37 | **lower** |
| mount | ToggleGroup | mount ms | 262.20 | 98.20 | ×0.37 | **lower** |
| mount | ColorSlider | components/inst | 16.00 | 6.00 | ×0.38 | **lower** |
| mount | RadioGroup | heap KB/inst | 154.03 | 59.27 | ×0.38 | **lower** |
| mount | TagGroup | heap KB/inst | 136.51 | 52.99 | ×0.39 | **lower** |
| collection | Tabs@5000 | heap KB/item | 39.73 | 15.44 | ×0.39 | **lower** |
| mount | Combobox | mount ms | 45.30 | 17.60 | ×0.39 | **lower** |
| collection | Tabs@1000 | heap KB/item | 40.26 | 15.96 | ×0.40 | **lower** |
| collection | DropdownMenu@5000 | select ms | 275.10 | 109.10 | ×0.40 | **lower** |
| mount | Tooltip | mount ms | 19.30 | 7.70 | ×0.40 | **lower** |
| collection | RadioGroup@1000 | component updates / key | 10.00 | 4.00 | ×0.40 | **lower** |
| collection | RadioGroup@5000 | component updates / key | 10.00 | 4.00 | ×0.40 | **lower** |
| collection | ToggleGroup@1000 | component updates / key | 10.00 | 4.00 | ×0.40 | **lower** |
| collection | ToggleGroup@5000 | component updates / key | 10.00 | 4.00 | ×0.40 | **lower** |
| collection | Tabs@5000 | component updates / selection | 50012.00 | 20006.00 | ×0.40 | **lower** |
| collection | Tabs@1000 | component updates / selection | 10012.00 | 4006.00 | ×0.40 | **lower** |
| mount | Toolbar | heap KB/inst | 173.74 | 69.91 | ×0.40 | **lower** |
| mount | RangeCalendar | interaction ms | 3.85 | 1.55 | ×0.40 | **lower** |
| mount | Autocomplete | mount ms | 43.30 | 17.50 | ×0.40 | **lower** |
| collection | ToggleGroup@5000 | heap KB/item | 28.88 | 11.73 | ×0.41 | **lower** |
| mount | Tooltip | heap KB/inst | 42.39 | 17.22 | ×0.41 | **lower** |
| mount | Checkbox | heap KB/inst | 23.11 | 9.39 | ×0.41 | **lower** |
| mount | Drawer | mount ms | 15.70 | 6.40 | ×0.41 | **lower** |
| mount | AlertDialog | heap KB/inst | 47.01 | 19.38 | ×0.41 | **lower** |
| collection | ToggleGroup@1000 | heap KB/item | 29.39 | 12.24 | ×0.42 | **lower** |
| mount | TagsInput | interaction ms | 0.60 | 0.25 | ×0.42 | **lower** |
| mount | Slider | mount ms | 165.60 | 69.10 | ×0.42 | **lower** |
| mount | HoverCard | mount ms | 15.50 | 6.50 | ×0.42 | **lower** |
| mount | RangeCalendar | mount ms | 114.50 | 48.70 | ×0.43 | **lower** |
| mount | Tabs | heap KB/inst | 146.76 | 62.73 | ×0.43 | **lower** |
| mount | Slider | interaction ms | 0.70 | 0.30 | ×0.43 | **lower** |
| mount | DropdownMenu | DOM nodes/inst | 21.02 | 9.02 | ×0.43 | **lower** |
| collection | Combobox@5000 | type ms | 151.90 | 65.50 | ×0.43 | **lower** |
| mount | RangeCalendar | heap KB/inst | 822.61 | 357.87 | ×0.44 | **lower** |
| mount | Dialog | DOM nodes/inst | 16.02 | 7.02 | ×0.44 | **lower** |
| mount | Drawer | DOM nodes/inst | 16.02 | 7.02 | ×0.44 | **lower** |
| mount | Toast | components/inst | 18.14 | 8.08 | ×0.45 | **lower** |
| mount | Rating | components/inst | 83.00 | 37.00 | ×0.45 | **lower** |
| mount | Slider | heap KB/inst | 52.32 | 23.34 | ×0.45 | **lower** |
| mount | AlertDialog | DOM nodes/inst | 20.02 | 9.02 | ×0.45 | **lower** |
| mount | NavigationMenu | components/inst | 31.01 | 14.01 | ×0.45 | **lower** |
| mount | ToggleGroup | heap KB/inst | 110.41 | 50.41 | ×0.46 | **lower** |
| mount | DateRangePicker | DOM nodes/inst | 93.02 | 43.02 | ×0.46 | **lower** |
| mount | Separator | heap KB/inst | 6.93 | 3.22 | ×0.46 | **lower** |
| collection | Select@5000 | heap open KB/item | 28.20 | 13.16 | ×0.47 | **lower** |
| collection | Select@1000 | heap open KB/item | 29.04 | 13.62 | ×0.47 | **lower** |
| mount | Calendar | heap KB/inst | 706.09 | 331.91 | ×0.47 | **lower** |
| collection | DropdownMenu@1000 | select ms | 51.90 | 24.40 | ×0.47 | **lower** |
| mount | Menubar | DOM nodes/inst | 68.02 | 32.02 | ×0.47 | **lower** |
| mount | Select | interaction ms | 3.95 | 1.90 | ×0.48 | **lower** |
| mount | Dialog | mount ms | 14.80 | 7.20 | ×0.49 | **lower** |
| mount | DropdownMenu | mount ms | 19.80 | 9.70 | ×0.49 | **lower** |
| mount | Dialog | heap KB/inst | 33.96 | 16.68 | ×0.49 | **lower** |
| mount | TagsInput | heap KB/inst | 74.27 | 36.49 | ×0.49 | **lower** |
| mount | Calendar | mount ms | 94.30 | 46.40 | ×0.49 | **lower** |
| mount | ColorSlider | mount ms | 163.00 | 80.50 | ×0.49 | **lower** |
| mount | Combobox | heap KB/inst | 83.45 | 41.33 | ×0.50 | **lower** |
| collection | DropdownMenu@1000 | component updates / selection | 6024.00 | 3011.00 | ×0.50 | **lower** |
| collection | DropdownMenu@5000 | component updates / selection | 30024.00 | 15011.00 | ×0.50 | **lower** |
| mount | Checkbox | listeners/inst | 4.00 | 2.00 | ×0.50 | **lower** |
| mount | Collapsible | listeners/inst | 6.00 | 3.00 | ×0.50 | **lower** |
| mount | ColorArea | listeners/inst | 4.00 | 8.00 | ×2.00 | **higher** |
| collection | DropdownMenu@1000 | component updates / typed char | 4.00 | 2.00 | ×0.50 | **lower** |
| collection | DropdownMenu@5000 | component updates / typed char | 4.00 | 2.00 | ×0.50 | **lower** |
| collection | Select@1000 | component updates / key | 12.00 | 6.00 | ×0.50 | **lower** |
| collection | Select@1000 | component updates / typed char | 12.00 | 6.00 | ×0.50 | **lower** |
| collection | Select@5000 | component updates / key | 12.00 | 6.00 | ×0.50 | **lower** |
| collection | Select@5000 | component updates / typed char | 12.00 | 6.00 | ×0.50 | **lower** |
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
| mount | Popover | mount ms | 17.10 | 8.60 | ×0.50 | **lower** |
| collection | Combobox@1000 | type ms | 21.80 | 11.00 | ×0.50 | **lower** |
| mount | AlertDialog | mount ms | 19.60 | 9.90 | ×0.51 | **lower** |
| mount | Calendar | DOM nodes/inst | 337.07 | 171.07 | ×0.51 | **lower** |
| mount | Stepper | mount ms | 287.90 | 146.60 | ×0.51 | **lower** |
| mount | RangeCalendar | DOM nodes/inst | 337.07 | 172.07 | ×0.51 | **lower** |
| mount | Autocomplete | heap KB/inst | 79.88 | 40.83 | ×0.51 | **lower** |
| mount | DateRangePicker | interaction ms | 8.10 | 4.15 | ×0.51 | **lower** |
| mount | Toast | mount ms | 42.70 | 22.00 | ×0.52 | **lower** |
| collection | Listbox@5000 | heap KB/item | 20.24 | 10.45 | ×0.52 | **lower** |
| mount | Popover | heap KB/inst | 39.28 | 20.33 | ×0.52 | **lower** |
| mount | NavigationMenu | heap KB/inst | 122.30 | 63.62 | ×0.52 | **lower** |
| mount | NavigationMenu | close ms | 1.15 | 0.60 | ×0.52 | **lower** |
| collection | Listbox@1000 | heap KB/item | 20.83 | 10.91 | ×0.52 | **lower** |
| mount | Rating | heap KB/inst | 330.92 | 173.61 | ×0.52 | **lower** |
| mount | DatePicker | interaction ms | 8.25 | 4.35 | ×0.53 | **lower** |
| mount | HoverCard | DOM nodes/inst | 17.02 | 9.02 | ×0.53 | **lower** |
| mount | Popover | DOM nodes/inst | 17.02 | 9.02 | ×0.53 | **lower** |
| mount | Tooltip | DOM nodes/inst | 17.04 | 9.04 | ×0.53 | **lower** |
| collection | Combobox@1000 | component updates / key | 13.00 | 7.00 | ×0.54 | **lower** |
| collection | Combobox@5000 | component updates / key | 13.00 | 7.00 | ×0.54 | **lower** |
| mount | Listbox | interaction ms | 1.20 | 0.65 | ×0.54 | **lower** |
| mount | DateRangeField | heap KB/inst | 116.53 | 63.61 | ×0.55 | **lower** |
| mount | ColorSwatchPicker | components/inst | 64.00 | 35.01 | ×0.55 | **lower** |
| mount | Collapsible | mount ms | 79.30 | 43.40 | ×0.55 | **lower** |
| mount | RadioGroup | listeners/inst | 31.00 | 17.01 | ×0.55 | **lower** |
| mount | TimeRangeField | heap KB/inst | 127.77 | 70.30 | ×0.55 | **lower** |
| collection | DropdownMenu@5000 | heap open KB/item | 19.82 | 10.96 | ×0.55 | **lower** |
| mount | Tabs | interaction ms | 0.90 | 0.50 | ×0.56 | **lower** |
| mount | DatePicker | components/inst | 34.01 | 19.01 | ×0.56 | **lower** |
| mount | Switch | mount ms | 40.40 | 22.60 | ×0.56 | **lower** |
| mount | ColorSwatchPicker | mount ms | 204.50 | 115.50 | ×0.56 | **lower** |
| collection | DropdownMenu@1000 | heap open KB/item | 20.44 | 11.59 | ×0.57 | **lower** |
| mount | ColorSlider | heap KB/inst | 60.66 | 34.41 | ×0.57 | **lower** |
| mount | Accordion | listeners/inst | 21.00 | 12.00 | ×0.57 | **lower** |
| collection | Combobox@5000 | mount ms | 2.10 | 1.20 | ×0.57 | **lower** |
| mount | Collapsible | components/inst | 7.00 | 4.00 | ×0.57 | **lower** |
| collection | Combobox@5000 | heap open KB/item | 26.69 | 15.31 | ×0.57 | **lower** |
| mount | DateField | heap KB/inst | 69.08 | 39.92 | ×0.58 | **lower** |
| collection | Combobox@1000 | heap open KB/item | 27.40 | 15.87 | ×0.58 | **lower** |
| collection | Tree@5000 | ms/key | 12.00 | 6.95 | ×0.58 | **lower** |
| mount | ColorSwatch | heap KB/inst | 5.85 | 3.41 | ×0.58 | **lower** |
| mount | Pagination | heap KB/inst | 78.58 | 46.03 | ×0.59 | **lower** |
| mount | NavigationMenu | mount ms | 54.60 | 32.00 | ×0.59 | **lower** |
| mount | TimeField | heap KB/inst | 70.71 | 41.62 | ×0.59 | **lower** |
| mount | Collapsible | heap KB/inst | 30.47 | 18.03 | ×0.59 | **lower** |
| mount | DateRangePicker | components/inst | 49.01 | 29.01 | ×0.59 | **lower** |
| mount | TimeRangeField | DOM nodes/inst | 59.02 | 35.02 | ×0.59 | **lower** |
| mount | DropdownMenu | interaction ms | 3.60 | 2.15 | ×0.60 | **lower** |
| mount | Progress | mount ms | 23.90 | 14.30 | ×0.60 | **lower** |
| mount | Avatar | components/inst | 5.00 | 3.00 | ×0.60 | **lower** |
| mount | Separator | mount ms | 12.10 | 7.30 | ×0.60 | **lower** |
| mount | Listbox | heap KB/inst | 122.99 | 74.40 | ×0.60 | **lower** |
| mount | CheckboxGroup | listeners/inst | 28.00 | 17.00 | ×0.61 | **lower** |
| mount | DateRangeField | DOM nodes/inst | 51.02 | 31.02 | ×0.61 | **lower** |
| mount | DatePicker | DOM nodes/inst | 74.02 | 45.02 | ×0.61 | **lower** |
| mount | NumberField | mount ms | 87.50 | 53.70 | ×0.61 | **lower** |
| mount | PinInput | components/inst | 13.00 | 8.00 | ×0.62 | **lower** |
| mount | Pagination | mount ms | 100.90 | 62.30 | ×0.62 | **lower** |
| collection | Combobox@1000 | mount ms | 2.10 | 1.30 | ×0.62 | **lower** |
| mount | Progress | heap KB/inst | 13.38 | 8.31 | ×0.62 | **lower** |
| mount | Switch | heap KB/inst | 16.02 | 9.98 | ×0.62 | **lower** |
| collection | Combobox@5000 | open ms | 746.10 | 471.50 | ×0.63 | **lower** |
| mount | Toast | heap KB/inst | 71.16 | 45.02 | ×0.63 | **lower** |
| mount | TimeField | DOM nodes/inst | 33.01 | 21.01 | ×0.64 | **lower** |
| mount | Field | components/inst | 11.00 | 7.00 | ×0.64 | **lower** |
| mount | Toggle | heap KB/inst | 9.86 | 6.33 | ×0.64 | **lower** |
| mount | AspectRatio | heap KB/inst | 6.55 | 4.22 | ×0.64 | **lower** |
| mount | DateRangePicker | heap KB/inst | 188.42 | 122.67 | ×0.65 | **lower** |
| mount | Form | components/inst | 29.00 | 19.00 | ×0.66 | **lower** |
| mount | DatePicker | heap KB/inst | 133.57 | 87.54 | ×0.66 | **lower** |
| mount | Autocomplete | DOM nodes/inst | 29.02 | 19.02 | ×0.66 | **lower** |
| mount | Accordion | components/inst | 38.00 | 25.00 | ×0.66 | **lower** |
| mount | Field | mount ms | 81.00 | 53.30 | ×0.66 | **lower** |
| mount | Toggle | mount ms | 25.00 | 16.50 | ×0.66 | **lower** |
| mount | Popover | close ms | 1.20 | 0.80 | ×0.67 | **lower** |
| collection | DropdownMenu@5000 | mount ms | 1.20 | 0.80 | ×0.67 | **lower** |
| mount | Accordion | mount ms | 197.70 | 131.90 | ×0.67 | **lower** |
| mount | DropdownMenu | listeners/inst | 3.03 | 2.03 | ×0.67 | **lower** |
| mount | TimeRangeField | mount ms | 66.40 | 44.90 | ×0.68 | **lower** |
| collection | Tree@5000 | type ms | 9.70 | 6.60 | ×0.68 | **lower** |
| mount | Rating | listeners/inst | 60.00 | 41.01 | ×0.68 | **lower** |
| mount | Accordion | heap KB/inst | 146.42 | 100.37 | ×0.69 | **lower** |
| mount | Combobox | DOM nodes/inst | 29.02 | 20.02 | ×0.69 | **lower** |
| mount | NumberField | interaction ms | 1.30 | 0.90 | ×0.69 | **lower** |
| mount | ColorSwatchPicker | heap KB/inst | 193.89 | 134.73 | ×0.69 | **lower** |
| mount | Toolbar | listeners/inst | 23.00 | 16.00 | ×0.70 | **lower** |
| mount | ColorField | mount ms | 40.10 | 27.90 | ×0.70 | **lower** |
| mount | ContextMenu | close ms | 1.65 | 1.15 | ×0.70 | **lower** |
| mount | Menubar | close ms | 2.50 | 1.75 | ×0.70 | **lower** |
| mount | DatePicker | close ms | 3.00 | 2.10 | ×0.70 | **lower** |
| mount | Avatar | mount ms | 50.30 | 35.30 | ×0.70 | **lower** |
| mount | Dialog | close ms | 1.35 | 0.95 | ×0.70 | **lower** |
| mount | Tree | listeners/inst | 41.00 | 29.00 | ×0.71 | **lower** |
| mount | DateRangePicker | close ms | 3.25 | 2.30 | ×0.71 | **lower** |
| collection | Select@5000 | type ms | 4.20 | 5.90 | ×1.40 | **higher** |
| mount | DatePicker | mount ms | 94.80 | 67.50 | ×0.71 | **lower** |
| mount | Stepper | heap KB/inst | 128.82 | 91.73 | ×0.71 | **lower** |
| mount | DropdownMenu | close ms | 1.75 | 1.25 | ×0.71 | **lower** |
| mount | Tabs | listeners/inst | 28.00 | 20.00 | ×0.71 | **lower** |
| mount | Field | heap KB/inst | 50.05 | 35.85 | ×0.72 | **lower** |
| mount | Form | heap KB/inst | 138.19 | 99.99 | ×0.72 | **lower** |
| collection | Combobox@1000 | select ms | 40.40 | 29.70 | ×0.74 | **lower** |
| mount | ToggleGroup | listeners/inst | 19.00 | 14.00 | ×0.74 | **lower** |
| mount | Avatar | heap KB/inst | 16.66 | 12.31 | ×0.74 | **lower** |
| mount | DateRangePicker | mount ms | 98.20 | 73.00 | ×0.74 | **lower** |
| mount | Label | heap KB/inst | 5.74 | 4.28 | ×0.75 | **lower** |
| collection | Combobox@1000 | component updates / typed char | 1287.00 | 968.00 | ×0.75 | **lower** |
| mount | PinInput | heap KB/inst | 59.39 | 44.93 | ×0.76 | **lower** |
| collection | Combobox@5000 | component updates / typed char | 6358.00 | 4815.00 | ×0.76 | **lower** |
| mount | ColorField | heap KB/inst | 16.94 | 12.90 | ×0.76 | **lower** |
| mount | Form | mount ms | 129.20 | 98.40 | ×0.76 | **lower** |
| mount | NumberField | heap KB/inst | 48.45 | 36.93 | ×0.76 | **lower** |
| mount | ColorArea | heap KB/inst | 23.61 | 18.04 | ×0.76 | **lower** |
| mount | ColorSlider | DOM nodes/inst | 17.00 | 13.00 | ×0.76 | **lower** |
| mount | Slider | DOM nodes/inst | 17.00 | 13.00 | ×0.76 | **lower** |
| mount | ColorSwatch | mount ms | 11.80 | 9.20 | ×0.78 | **lower** |
| mount | DateField | DOM nodes/inst | 41.01 | 32.01 | ×0.78 | **lower** |
| mount | DateRangeField | mount ms | 58.80 | 45.90 | ×0.78 | **lower** |
| mount | PinInput | mount ms | 118.60 | 93.00 | ×0.78 | **lower** |
| mount | TagGroup | listeners/inst | 28.00 | 22.00 | ×0.79 | **lower** |
| mount | Toast | listeners/inst | 10.15 | 8.12 | ×0.80 | **lower** |
| mount | Editable | listeners/inst | 10.00 | 8.00 | ×0.80 | **lower** |
| collection | DropdownMenu@1000 | mount ms | 1.00 | 0.80 | ×0.80 | **lower** |
| collection | Combobox@1000 | open ms | 139.20 | 111.50 | ×0.80 | **lower** |
| mount | ScrollArea | heap KB/inst | 52.02 | 42.17 | ×0.81 | **lower** |
| mount | TimeField | mount ms | 109.50 | 89.50 | ×0.82 | **lower** |
| mount | Menubar | listeners/inst | 28.03 | 23.03 | ×0.82 | **lower** |
| mount | PinInput | DOM nodes/inst | 24.01 | 29.01 | ×1.21 | **higher** |
| mount | TagsInput | listeners/inst | 12.00 | 10.00 | ×0.83 | **lower** |
| mount | CheckboxGroup | DOM nodes/inst | 38.01 | 32.01 | ×0.84 | **lower** |
| mount | Autocomplete | listeners/inst | 11.00 | 13.00 | ×1.18 | **higher** |
| mount | ColorSwatchPicker | listeners/inst | 23.00 | 20.00 | ×0.87 | **lower** |
| mount | RefPrimitive | heap KB/inst | 2.58 | 2.26 | ×0.88 | **lower** |
| mount | NavigationMenu | listeners/inst | 17.00 | 15.00 | ×0.88 | **lower** |
| mount | Stepper | components/inst | 40.00 | 36.00 | ×0.90 | **lower** |
| mount | DateField | listeners/inst | 25.00 | 23.00 | ×0.92 | **lower** |
| mount | Combobox | listeners/inst | 12.00 | 13.00 | ×1.08 | **higher** |
| mount | DatePicker | listeners/inst | 27.00 | 25.00 | ×0.93 | **lower** |
| mount | RefPrimitiveAsChild | heap KB/inst | 3.73 | 3.46 | ×0.93 | **lower** |
| mount | Tabs | DOM nodes/inst | 30.01 | 28.01 | ×0.93 | **lower** |
| mount | Form | listeners/inst | 20.00 | 19.00 | ×0.95 | **lower** |

