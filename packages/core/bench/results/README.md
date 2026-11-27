# Heap and update counts after the performance PRs, 2026-11-26

Three builds, same harness, same machine (Apple M1 Pro), Chromium 153, Vue 3.5.46, one page load × three rounds per family (`--runs 1 --rounds 3`):

- **v2 before**: `7c562b8b9`, v2 before the performance PRs (`baseline-v2-before.*`)
- **v2 now**: `dfa3406d4`, v2 with them merged (`baseline-v2-now.*`)
- **v3**: `68fee3dd8` (`baseline-v3.*`)

**Timing: pending (machine busy).** Two gated attempts (`--gate 2`, 20 and 30 minutes) never saw the 1-minute load average below 3.1, so no timing is published. The millisecond columns in the `baseline-*.md` files were taken at a load of 12 to 19 and must not be compared. Everything below is heap, DOM, listener and component-update counts, which do not depend on load: between two runs of the same build heap differs by at most 0.2% and the counts are identical (`noise-floor.md`, 2026-11-25).

`before-vs-now.md` and `now-vs-v3.md` are the full `pnpm bench:compare` outputs (ignore their timing rows).

## v2 before → v2 now

**Regressions: none.** No family retains more heap (beyond 2% and 0.1 KB), has more DOM nodes, components or listeners, leaks more after unmount, or re-renders more components per key press, typed character or selection.

Geomean over 63 families: retained heap ×0.92, components ×0.94, listeners unchanged. Every family returns to baseline after unmount (at most 2.9 KB per instance, 0 DOM nodes).

Largest wins:

| Family | Metric | v2 before | v2 now |
|---|---|--:|--:|
| Listbox, 1,000 / 5,000 items | component updates per key press | 6,002 / 30,002 | 8 / 8 |
| Listbox | updates per selection | 6,007 / 30,007 | 10 / 10 |
| Tabs | updates per key press | 10,008 / 50,008 | 11.3 / 11.3 |
| Tabs | updates per selection | 10,012 / 50,012 | 16 / 16 |
| Select | updates per selection | 16,040 / 80,040 | 7,038 / 35,038 |
| Tree | updates per selection | 7,001 / 35,001 | 4,001 / 20,001 |
| RadioGroup, ToggleGroup | updates per selection | 8,009 / 8,001 at 1,000 | 5,009 / 5,001 |
| DropdownMenu | updates per selection | 6,024 / 30,024 | 4,021 / 20,021 |
| Combobox | updates per typed character | 1,287 / 6,358 | 975 / 4,822 |
| Listbox, Combobox | `querySelectorAll` calls per key press | 1 | 0 |
| Select, Tabs, Tree, RadioGroup, ToggleGroup | `querySelectorAll` calls per key press | 1 | 0.33 |
| Tabs | heap per instance / per item | 146.8 KB / 40.3 KB | 107.0 KB / 26.8 KB |
| Tree | heap per instance / per item | 178.4 KB / 26.0 KB | 132.3 KB / 18.2 KB |
| Toolbar, ToggleGroup, Accordion | heap per instance | 173.9 / 110.5 / 146.6 KB | 130.6 / 85.0 / 113.2 KB |
| Select (closed) | heap per instance / per item | 206.3 KB / 28.3 KB | 170.2 KB / 21.7 KB |

## v2 now vs v3

Geomean over the 57 families both have: v3 retains ×0.57 the heap and mounts ×0.45 the components of v2 now. What is still open on v2:

- **Selection re-renders every item** (component updates for one selection at 1,000 items, v2 now against v3; the count scales with the list unless marked constant): Select 7,038 (7 per item) against 19 (constant); RadioGroup 5,009 (5 per item) against 12 (constant); ToggleGroup 5,001 (5 per item) against 2,001 (2 per item); Tree 4,001 (4 per item) against 1,001 (1 per item); DropdownMenu 4,021 (4 per item) against 3,011 (3 per item). Tabs is now ahead of v3: 16 (constant) against 4,006 (4 per tab).
- **Closed Select** still mounts its items: 170 KB per instance and 21.7 KB per item against 29.5 KB and 0.06 KB.
- **Closed popups**: Menubar 223 KB against 58 KB; Dialog, Popover, Tooltip and DropdownMenu about twice v3.
- **Calendar / RangeCalendar**: 664 / 781 KB against 332 / 358 KB.
- DropdownMenu still makes one `querySelectorAll` call per key press (v3 0.33).

### Large collections: component updates and heap
| Family | items | heap KB / item before → now → v3 | updates / key | updates / typed char | updates / selection | qSA / key |
|---|--:|--:|--:|--:|--:|--:|
| Combobox | 1000 | 0.18 → 0.18 → 0.09 | 13 → 13 → 7 | 1287 → 975 → 968 | 1047 → 1043 → 4012 | 1 → 0 → 0 |
| Combobox | 5000 | 0.04 → 0.04 → 0.02 | 13 → 13 → 7 | 6358 → 4822 → 4815 | 5047 → 5043 → 20012 | 1 → 0 → 0 |
| DropdownMenu | 1000 | 0.10 → 0.11 → 0.04 | 3.3 → 3.3 → 334.7 | 4 → 4 → 2 | 6024 → 4021 → 3011 | 1 → 1 → 0.3 |
| DropdownMenu | 5000 | 0.02 → 0.02 → 0.01 | 3.3 → 3.3 → 1668 | 4 → 4 → 2 | 30024 → 20021 → 15011 | 1 → 1 → 0.3 |
| Listbox | 1000 | 20.85 → 20.13 → 10.91 | 6002 → 8 → 4 | 6002 → 8 → 4 | 6007 → 10 → 5 | 1 → 0 → 0 |
| Listbox | 5000 | 20.25 → 19.58 → 10.47 | 30002 → 8 → 4 | 30002 → 8 → 4 | 30007 → 10 → 5 | 1 → 0 → 0 |
| RadioGroup | 1000 | 43.35 → 35.07 → 15.34 | 10 → 8 → 4 | – → – → – | 8009 → 5009 → 12 | 1 → 0.3 → 0.3 |
| RadioGroup | 5000 | 42.71 → 34.48 → 14.90 | 10 → 8 → 4 | – → – → – | 40009 → 25009 → 12 | 1 → 0.3 → 0.3 |
| Select | 1000 | 28.34 → 21.66 → 0.06 | 12 → 10 → 6 | 12 → 10 → 6 | 16040 → 7038 → 19 | 1 → 0.3 → 0 |
| Select | 5000 | 27.76 → 21.23 → 0.01 | 12 → 10 → 6 | 12 → 10 → 6 | 80040 → 35038 → 19 | 1 → 0.3 → 0 |
| Tabs | 1000 | 40.29 → 26.79 → 15.96 | 10008 → 11.3 → 2 | – → – → – | 10012 → 16 → 4006 | 1 → 0.3 → 0.3 |
| Tabs | 5000 | 39.74 → 26.21 → 15.44 | 50008 → 11.3 → 2 | – → – → – | 50012 → 16 → 20006 | 1 → 0.3 → 0.3 |
| ToggleGroup | 1000 | 29.42 → 21.14 → 12.24 | 10 → 8 → 4 | – → – → – | 8001 → 5001 → 2001 | 1 → 0.3 → 0.3 |
| ToggleGroup | 5000 | 28.89 → 20.64 → 11.73 | 10 → 8 → 4 | – → – → – | 40001 → 25001 → 10001 | 1 → 0.3 → 0.3 |
| Tree | 1000 | 25.97 → 18.23 → 8.79 | 8 → 6 → 2 | 8 → 6 → 2 | 7001 → 4001 → 1001 | 1 → 0.3 → 0.3 |
| Tree | 5000 | 25.49 → 17.75 → 8.39 | 8 → 6 → 2 | 8 → 6 → 2 | 35001 → 20001 → 5001 | 1 → 0.3 → 0.3 |

Each cell is before → now → v3.

### Heap KB / instance, all families
| Family | N | v2 before | v2 now | now / before | v3 | v3 / now | components before → now → v3 | listeners before → now → v3 | after unmount KB now |
|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|
| Accordion | 300 | 146.6 | 113.2 | ×0.77 | 100.3 | ×0.89 | 38 → 32 → 25 | 21 → 21 → 12 | 0.06 |
| AlertDialog | 100 | 47.1 | 47.0 | ×1.00 | 19.4 | ×0.41 | 13 → 13 → 4 | 1 → 1 → 1 | 0.68 |
| AspectRatio | 500 | 6.6 | 6.0 | ×0.91 | 4.2 | ×0.71 | 2 → 2 → 1 | 0 → 0 → 0 | 0.03 |
| Autocomplete | 100 | 80.0 | 77.9 | ×0.97 | 40.8 | ×0.52 | 18 → 17 → 6 | 11 → 11 → 13 | 0.49 |
| Avatar | 500 | 16.7 | 16.1 | ×0.97 | 12.3 | ×0.77 | 5 → 5 → 3 | 2 → 2 → 2 | 0.06 |
| Calendar | 30 | 706.3 | 664.4 | ×0.94 | 331.7 | ×0.50 | 182 → 182 → 91 | 72 → 72 → 72 | 0.98 |
| Carousel | 100 | 138.5 | 130.1 | ×0.94 | – | – | 30 → 30 → – | 21 → 21 → – | 0.23 |
| Checkbox | 500 | 23.1 | 20.9 | ×0.90 | 9.4 | ×0.45 | 4 → 4 → 2 | 4 → 4 → 2 | 0.05 |
| CheckboxGroup | 300 | 140.5 | 118.7 | ×0.84 | 52.1 | ×0.44 | 27 → 21 → 9 | 28 → 28 → 17 | 0.13 |
| Collapsible | 500 | 30.5 | 27.0 | ×0.89 | 18.0 | ×0.67 | 7 → 7 → 4 | 6 → 6 → 3 | 0.03 |
| ColorArea | 300 | 23.9 | 22.0 | ×0.92 | 18.0 | ×0.82 | 6 → 6 → 3 | 6 → 6 → 8 | 0.12 |
| ColorField | 500 | 16.9 | 15.7 | ×0.93 | 12.9 | ×0.82 | 4 → 4 → 2 | 8 → 8 → 8 | 0.03 |
| ColorSlider | 500 | 60.7 | 59.6 | ×0.98 | 34.4 | ×0.58 | 16 → 16 → 6 | 6 → 6 → 6 | 0.04 |
| ColorSwatch | 500 | 5.9 | 5.4 | ×0.92 | 3.4 | ×0.63 | 2 → 2 → 1 | 0 → 0 → 0 | 0.04 |
| ColorSwatchPicker | 200 | 194.1 | 189.2 | ×0.98 | 134.8 | ×0.71 | 64 → 63 → 35 | 23 → 23 → 20 | 0.22 |
| Combobox | 100 | 83.5 | 81.6 | ×0.98 | 41.4 | ×0.51 | 18 → 17 → 6 | 12 → 12 → 13 | 0.55 |
| ContextMenu | 100 | 55.9 | 53.3 | ×0.95 | 16.2 | ×0.30 | 15 → 14 → 4 | 5 → 5 → 5 | 0.74 |
| DateField | 200 | 69.2 | 66.1 | ×0.96 | 40.0 | ×0.60 | 14 → 14 → 7 | 25 → 25 → 23 | 0.26 |
| DatePicker | 100 | 133.7 | 128.3 | ×0.96 | 87.6 | ×0.68 | 34 → 33 → 19 | 27 → 27 → 25 | 0.71 |
| DateRangeField | 100 | 116.7 | 111.2 | ×0.95 | 63.7 | ×0.57 | 24 → 24 → 12 | 44 → 44 → 44 | 0.27 |
| DateRangePicker | 100 | 188.6 | 180.8 | ×0.96 | 122.6 | ×0.68 | 49 → 48 → 29 | 46 → 46 → 46 | 0.57 |
| Dialog | 100 | 34.0 | 33.7 | ×0.99 | 16.6 | ×0.49 | 9 → 9 → 3 | 1 → 1 → 1 | 0.62 |
| Drawer | 100 | 40.4 | 40.0 | ×0.99 | 14.3 | ×0.36 | 9 → 9 → 3 | 1 → 1 → 1 | 0.55 |
| DropdownMenu | 100 | 54.9 | 52.4 | ×0.96 | 20.1 | ×0.38 | 15 → 14 → 4 | 3 → 3 → 2 | 1.02 |
| Editable | 300 | 42.0 | 38.9 | ×0.93 | 40.6 | ×1.04 | 14 → 14 → 14 | 10 → 10 → 8 | 0.19 |
| Field | 300 | 50.1 | 48.5 | ×0.97 | 35.9 | ×0.74 | 11 → 11 → 7 | 6 → 6 → 6 | 0.30 |
| Form | 200 | 138.3 | 134.4 | ×0.97 | 99.9 | ×0.74 | 29 → 29 → 19 | 20 → 20 → 19 | 0.03 |
| HoverCard | 100 | 39.6 | 37.2 | ×0.94 | 13.4 | ×0.36 | 11 → 10 → 4 | 5 → 5 → 5 | 0.48 |
| Label | 500 | 5.8 | 5.4 | ×0.93 | 4.3 | ×0.80 | 2 → 2 → 1 | 1 → 1 → 1 | 0.03 |
| Listbox | 300 | 123.2 | 121.9 | ×0.99 | 74.4 | ×0.61 | 36 → 36 → 12 | 20 → 20 → 20 | 0.18 |
| Menubar | 100 | 253.6 | 222.6 | ×0.88 | 57.9 | ×0.26 | 75 → 62 → 13 | 28 → 28 → 23 | 2.86 |
| MonthPicker | 50 | 227.1 | 211.3 | ×0.93 | – | – | 68 → 68 → – | 26 → 26 → – | 0.53 |
| MonthRangePicker | 50 | 264.8 | 249.2 | ×0.94 | – | – | 68 → 68 → – | 51 → 51 → – | 0.54 |
| NavigationMenu | 100 | 122.5 | 116.8 | ×0.95 | 63.6 | ×0.54 | 31 → 31 → 14 | 17 → 17 → 15 | 0.91 |
| NumberField | 300 | 48.5 | 46.9 | ×0.97 | 36.9 | ×0.79 | 8 → 8 → 4 | 18 → 18 → 18 | 0.10 |
| Pagination | 300 | 81.8 | 76.5 | ×0.93 | 46.0 | ×0.60 | 26 → 26 → 13 | 10 → 10 → 10 | 0.23 |
| PinInput | 300 | 61.8 | 59.4 | ×0.96 | 44.9 | ×0.76 | 13 → 13 → 8 | 33 → 33 → 33 | 0.09 |
| Popover | 100 | 39.3 | 36.9 | ×0.94 | 20.3 | ×0.55 | 11 → 10 → 4 | 1 → 1 → 1 | 0.59 |
| Progress | 500 | 13.4 | 12.6 | ×0.94 | 8.3 | ×0.66 | 4 → 4 → 2 | 0 → 0 → 0 | 0.03 |
| RadioGroup | 300 | 154.1 | 128.4 | ×0.83 | 59.3 | ×0.46 | 38 → 28 → 11 | 31 → 31 → 17 | 0.15 |
| RangeCalendar | 30 | 823.2 | 780.5 | ×0.95 | 357.9 | ×0.46 | 182 → 182 → 91 | 144 → 144 → 144 | 0.53 |
| Rating | 300 | 331.1 | 277.9 | ×0.84 | 173.6 | ×0.62 | 83 → 62 → 37 | 60 → 60 → 41 | 0.20 |
| ScrollArea | 300 | 52.0 | 49.4 | ×0.95 | 42.2 | ×0.85 | 13 → 13 → 13 | 7 → 7 → 7 | 0.16 |
| Select | 100 | 206.3 | 170.2 | ×0.83 | 29.5 | ×0.17 | 60 → 54 → 6 | 53 → 53 → 6 | 0.52 |
| Separator | 500 | 6.9 | 6.5 | ×0.93 | 3.2 | ×0.50 | 3 → 3 → 1 | 0 → 0 → 0 | 0.02 |
| Slider | 500 | 52.4 | 50.8 | ×0.97 | 23.3 | ×0.46 | 15 → 15 → 4 | 6 → 6 → 6 | 0.02 |
| SliderArea | 300 | 44.4 | 42.5 | ×0.96 | – | – | 12 → 12 → – | 5 → 5 → – | 0.14 |
| Splitter | 300 | 49.4 | 47.1 | ×0.95 | 48.6 | ×1.03 | 8 → 8 → 8 | 4 → 4 → 4 | 0.11 |
| Stepper | 300 | 128.9 | 119.9 | ×0.93 | 91.8 | ×0.77 | 40 → 40 → 36 | 6 → 6 → 6 | 0.12 |
| Switch | 500 | 16.0 | 14.7 | ×0.92 | 10.0 | ×0.68 | 4 → 4 → 2 | 2 → 2 → 2 | 0.02 |
| Tabs | 300 | 146.8 | 107.0 | ×0.73 | 62.7 | ×0.59 | 39 → 23 → 11 | 28 → 28 → 20 | 0.11 |
| TagGroup | 300 | 136.7 | 108.4 | ×0.79 | 53.0 | ×0.49 | 40 → 30 → 10 | 28 → 28 → 22 | 0.07 |
| TagsInput | 300 | 74.3 | 69.4 | ×0.93 | 36.5 | ×0.53 | 22 → 22 → 8 | 12 → 12 → 10 | 0.16 |
| TimeField | 300 | 70.8 | 67.3 | ×0.95 | 41.6 | ×0.62 | 16 → 16 → 8 | 23 → 23 → 23 | 0.14 |
| TimeRangeField | 100 | 127.9 | 121.7 | ×0.95 | 70.3 | ×0.58 | 28 → 28 → 14 | 44 → 44 → 44 | 0.31 |
| Toast | 100 | 75.7 | 69.5 | ×0.92 | 44.8 | ×0.64 | 18 → 17 → 8 | 10 → 10 → 8 | 0.53 |
| Toggle | 500 | 9.9 | 9.1 | ×0.93 | 6.3 | ×0.69 | 2 → 2 → 1 | 1 → 1 → 1 | 0.02 |
| ToggleGroup | 300 | 110.5 | 85.0 | ×0.77 | 50.4 | ×0.59 | 31 → 21 → 9 | 19 → 19 → 14 | 0.09 |
| Toolbar | 300 | 173.9 | 130.6 | ×0.75 | 69.9 | ×0.54 | 57 → 39 → 17 | 23 → 23 → 16 | 0.16 |
| Tooltip | 100 | 42.3 | 39.9 | ×0.94 | 17.2 | ×0.43 | 11 → 10 → 4 | 6 → 6 → 6 | 0.45 |
| Tree | 200 | 178.4 | 132.3 | ×0.74 | 65.6 | ×0.50 | 49 → 30 → 7 | 41 → 41 → 29 | 0.20 |
| YearPicker | 50 | 226.6 | 210.8 | ×0.93 | – | – | 68 → 68 → – | 26 → 26 → – | 0.51 |
| YearRangePicker | 50 | 264.3 | 248.6 | ×0.94 | – | – | 68 → 68 → – | 51 → 51 → – | 0.54 |
| RefBaseline | 500 | 0.4 | 0.4 | ×1.00 | 0.4 | ×0.98 | 0 → 0 → 0 | 0 → 0 → 0 | 0.05 |
| RefVueComponent | 500 | 2.1 | 2.1 | ×1.00 | 2.1 | ×0.99 | 1 → 1 → 1 | 0 → 0 → 0 | 0.07 |
| RefPrimitive | 500 | 2.6 | 2.1 | ×0.81 | 2.3 | ×1.07 | 1 → 1 → 1 | 0 → 0 → 0 | 0.05 |
| RefPrimitiveAsChild | 500 | 3.7 | 1.9 | ×0.52 | 3.5 | ×1.78 | 2 → 1 → 2 | 0 → 0 → 0 | 0.05 |
