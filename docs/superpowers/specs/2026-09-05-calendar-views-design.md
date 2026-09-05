# Calendar Views Design (v3)

**Date:** 2026-09-05
**Epic:** [unovue/reka-ui#2721](https://github.com/unovue/reka-ui/issues/2721) (v3 roadmap)
**Related:** #741, #1199, #1730, #2191, #2389 (drill-down month/year views), #1933 (MonthPicker/YearPicker), #2781 (month picker keyboard bug)
**Branch:** `claude/dates-components-refactor-lhs0j2`
**Status:** Accepted 2026-09-05 — the four proposals under "Open questions" were approved as written (`granularity`, optional `CalendarView`, `columns` default 4, `view` argument on `nextPage` / `prevPage`). D12 and D13 remain follow-ups. Implementation runs on this branch per the plan.

## Summary

v2 ships six grid-picker families that are the same component with find-and-replace applied: `Calendar`, `RangeCalendar`, `MonthPicker`, `MonthRangePicker`, `YearPicker`, `YearRangePicker` (64 parts, ~10 k lines including stories). The only real variation between the day, month and year flavours is a handful of pluggable values: which function builds the grid, which "is same" comparator applies, what unit a page moves by, how many columns the keyboard stride uses, and how the heading is formatted. Everything else — deselect logic, placeholder sync, min/max clamping, the `shiftFocus` page-flipping loop, the a11y wiring — is copied four times, and the copies have already drifted (#2781).

v3 collapses them into **two families driven by a view**:

- `Calendar` — single / multiple selection, with `view: 'day' | 'month' | 'year'` state and a `granularity` that fixes the selection unit.
- `RangeCalendar` — the same, for `{ start, end }` ranges.

`DatePicker` / `DateRangePicker` keep wrapping them and pass the new props through. `MonthPicker*` and `YearPicker*` are removed; a month picker is `<CalendarRoot granularity="month">`.

This also answers the five open drill-down requests (#741, #1199, #1730, #2191, #2389): a day calendar can switch to its month grid and year grid without leaving the component.

**Scope:** Calendar, RangeCalendar, DatePicker, DateRangePicker, `packages/core/src/date`, the resolver/Nuxt component lists, docs. Not in scope: DateField / TimeField, merging `RangeCalendar` into `Calendar` via a `selectionMode` prop (see D12).

**Architecture:** One `useCalendarGrid(unit)` strategy layer under one `useCalendar()` / `useRangeCalendar()` headless composable per the #2723 recipe (`docs/superpowers/recipes/2723-headless-composable-recipe.md`), consumed by a single set of part SFCs.

---

## Prior art (what the design copies and what it avoids)

| Library | Model | Standalone month/year picker |
| --- | --- | --- |
| Ark UI / Zag | one `DatePicker`, `view` state + `minView` / `maxView` / `defaultView`, `selectionMode` | `defaultView="month" minView="month"` |
| Mantine | one `Calendar`, `level` + `minLevel` / `maxLevel` | `MonthPicker` / `YearPicker` are thin presets over `Calendar` |
| MUI X | `DateCalendar` with a `views` array, `openTo`, `onViewChange` | `MonthCalendar` / `YearCalendar` single-view components |
| React Aria, Bits UI, react-day-picker | day grid only; month/year via dropdowns | none |
| PrimeVue, Vuetify 3, Angular Material | `view` / `view-mode` / `startView` with **no** separate selection unit | same component, with bugs |

The last row is the cautionary tale. Vuetify #20800 (a `view-mode="months"` picker snaps back to the day grid after selecting a month), PrimeVue #7270 (`disabledDates` ignored in month view) and MUI X #9703 (selecting in month view jumps to year view) all come from having a *view* without an independent notion of *what a selection means*. Ark's `minView` and Mantine's `minLevel` are the fix; this design calls it `granularity`, the word Reka's `DateField` already uses for the same concept (`'day' | 'hour' | 'minute' | 'second'`).

Base UI's Calendar (mui/base-ui#1709) goes further and owns no view state at all: it ships `DayGrid` / `MonthGrid` / `YearGrid` siblings and leaves switching to the consumer. This design keeps a root `view` so the drill-down, focus restoration and heading behaviour ship once, but makes `CalendarView` optional so single-view pickers pay nothing for it (D5).

---

## Decisions

### D1. `view` is root state

`CalendarRoot` (and `RangeCalendarRoot`) gains:

```ts
view?: CalendarView // 'day' | 'month' | 'year' — controlled
defaultView?: CalendarView // default: granularity
```

with `beforeUpdate:view` / `update:view` emits carrying `ChangeEventDetails<CalendarChangeReason>` (#2828). `v-model:view` works like every other model.

### D2. `granularity` fixes the selection unit (and the finest reachable view)

```ts
granularity?: CalendarUnit // 'day' | 'month' | 'year', default 'day'
```

- Selecting a cell **at** the granularity commits `modelValue` (single / multiple / range rules unchanged from v2).
- Selecting a cell in a view **coarser** than the granularity does not touch `modelValue`: it moves `placeholder` into that unit and switches `view` one level finer (`reason: 'view-drill'`).
- `view` can never be finer than `granularity`; the root clamps it.

A standalone month picker is therefore `<CalendarRoot granularity="month">` — `defaultView` falls back to `'month'`, and the day view is unreachable.

### D3. `maxView` bounds how far the heading can drill up

```ts
maxView?: CalendarView // default 'year'
```

`CalendarViewTrigger` (D4) cycles `day → month → year` and stops at `maxView`. This is the one-liner for "month select but no decade view" and matches Ark / Mantine. *Open:* ship in v1 or defer — it is ~10 lines, so the proposal is to ship it.

### D4. Anatomy

```vue
<CalendarRoot v-model="date" v-model:view="view" granularity="day">
  <CalendarHeader>
    <CalendarPrev />
    <CalendarViewTrigger />       <!-- NEW: heading text as a button; click drills up -->
    <CalendarNext />
  </CalendarHeader>

  <CalendarView view="day" v-slot="{ grid, weekDays }">     <!-- NEW: renders only while active -->
    <CalendarGrid v-for="page in grid" :key="page.value.toString()" :value="page.value">
      <CalendarGridHead>
        <CalendarGridRow>
          <CalendarHeadCell v-for="day in weekDays" :key="day">{{ day }}</CalendarHeadCell>
        </CalendarGridRow>
      </CalendarGridHead>
      <CalendarGridBody>
        <CalendarGridRow v-for="(row, i) in page.rows" :key="i">
          <CalendarCell v-for="cell in row" :key="cell.toString()" :value="cell">
            <CalendarCellTrigger :value="cell" />
          </CalendarCell>
        </CalendarGridRow>
      </CalendarGridBody>
    </CalendarGrid>
  </CalendarView>

  <CalendarView view="month" v-slot="{ grid }">
    <CalendarGrid v-for="page in grid" :key="page.value.toString()" :value="page.value">
      <CalendarGridBody>
        <CalendarGridRow v-for="(row, i) in page.rows" :key="i">
          <CalendarCell v-for="cell in row" :key="cell.toString()" :value="cell">
            <CalendarCellTrigger :value="cell" />
          </CalendarCell>
        </CalendarGridRow>
      </CalendarGridBody>
    </CalendarGrid>
  </CalendarView>

  <CalendarView view="year" v-slot="{ grid }">
    <!-- same shape as the month view -->
  </CalendarView>
</CalendarRoot>
```

Parts, with what changes from v2:

| Part | v2 | v3 |
| --- | --- | --- |
| `CalendarRoot` | — | + `view`, `defaultView`, `granularity`, `maxView`, `yearsPerPage`, `columns`; slot gains `view`, `granularity` |
| `CalendarHeader`, `CalendarPrev`, `CalendarNext`, `CalendarHeading` | — | unchanged API; page/format by active view |
| `CalendarViewTrigger` | — | **new**. Renders `headingValue` inside a `button`, `aria-label="Switch to month view"` etc., `data-view`. Disabled at `maxView`. |
| `CalendarView` | — | **new**, optional. Props: `view`. Renders its slot only while `view` is active; provides the view unit to descendants; slot `{ grid, weekDays, view }`. |
| `CalendarGrid` | no props | + `value?: DateValue` — the page this grid renders (a month in day view, a year in month view). Needed to mark `outside-view` cells; provided to descendants. |
| `CalendarGridHead`, `CalendarHeadCell`, `CalendarGridBody`, `CalendarGridRow` | — | unchanged (day-view only in practice) |
| `CalendarCell` | `date: DateValue` | `value: DateValue` |
| `CalendarCellTrigger` | `day: DateValue`, `month: DateValue` | `value: DateValue`. Unit comes from the enclosing `CalendarView` (or the root's active view). Slot `dayValue` → `cellValue`. |

`CalendarView` is optional (D5): a picker that only ever shows one view may put `CalendarGrid` directly under the root, as today. That keeps the v2 → v3 migration for existing day calendars to prop renames.

### D5. Root owns the state, views are gates

The root computes the grid for the **active** view only (lazily, one `computed` per view) from root-level layout props, and provides:

- `view`, `granularity`, `activeUnit`
- `grid: CalendarGrid[]` for the active view (always an array — see D6)
- `weekDays` (day view only; `[]` otherwise)
- `headingValue`, `prevPage()`, `nextPage()`, `isPrevButtonDisabled()`, `isNextButtonDisabled()` — all for the active view

`CalendarView` is a thin gate: it renders its slot when `props.view === root.view`, and provides `{ unit: props.view }` so `CalendarGrid` / `CalendarCellTrigger` can format and navigate without a prop. When no `CalendarView` wraps them, they fall back to the root's active unit.

Layout props stay on the root so `DatePickerRoot` keeps passing them through unchanged: `numberOfMonths`, `pagedNavigation`, `fixedWeeks`, `weekStartsOn`, `weekdayFormat`, `disableDaysOutsideCurrentView` (day view), `yearsPerPage` (year view, default 12), and a new `columns` (month and year views, default 4 — the v2 layout).

*Rejected alternative:* each `CalendarView` owns its own grid and layout props. Cleaner in isolation, but it forces a `CalendarView` wrapper on every consumer, breaks `DatePickerRoot`'s prop plumbing, and needs a registration round-trip so `Prev` / `Next` / `Heading` can find the active view.

### D6. One `CalendarGrid` shape for every view

```ts
interface CalendarGridData<T = DateValue> {
  value: T // the page: first day of the month / first day of the year / first year of the page
  cells: T[] // flat
  rows: T[][] // chunked for rendering
}
```

`grid` is **always** `CalendarGridData[]`: `numberOfMonths` pages in day view, one page of 12 in month view, one page of `yearsPerPage` in year view. v2 `MonthPicker` / `YearPicker` exposed a single `Grid` object; that shape goes away.

### D7. Paging and headings follow the active view

| View | Prev / Next moves by | Heading |
| --- | --- | --- |
| day | 1 month, or `numberOfMonths` with `pagedNavigation` | `September 2026`, or `September - October 2026` |
| month | 1 year | `2026` |
| year | `yearsPerPage` years | `2020 - 2031` |

The `nextPage` / `prevPage` function props keep their signature `(placeholder: DateValue) => DateValue` and are only consulted in the day view (their v2 semantics). *Open:* extend them with a second `view` argument so custom paging can apply to every view. Proposal: yes, additive.

### D8. Keyboard is one implementation

`ArrowLeft` / `ArrowRight` move ±1 unit (RTL-aware), `ArrowUp` / `ArrowDown` move ± the row length (7 in day view, `columns` otherwise), `PageUp` / `PageDown` move one page in every view (v2 only had this in the month picker), `Enter` / `Space` select. The `shiftFocus` loop — clamp to min/max, query `[data-value]`, flip the page when the target is not rendered, skip disabled cells — is written once against the unit adapter (D10) and bounded by a depth guard, which fixes #2781 for good.

### D9. Matchers and bounds are unit-aware

`isDateDisabled` / `isDateUnavailable` (and `isDateHighlightable` on ranges) replace `isMonthDisabled` / `isYearDisabled` etc. They are called with the cell's `DateValue` (start of the unit) and, additively, the unit:

```ts
type Matcher = (date: DateValue, unit?: CalendarUnit) => boolean
```

`minValue` / `maxValue` clamp by unit bounds: a month cell is disabled when the month *ends* before `minValue` or *starts* after `maxValue` (v2 `useMonthPicker` semantics), likewise for years. `isInvalid` on the root evaluates `modelValue` at the granularity.

### D10. Unit adapters in `packages/core/src/date`

```ts
type CalendarUnit = 'day' | 'month' | 'year'

interface CalendarUnitAdapter {
  unit: CalendarUnit
  isSame: (a: DateValue, b: DateValue) => boolean // isSameDay / isSameYearMonth / isSameYear
  startOf: (d: DateValue) => DateValue
  endOf: (d: DateValue) => DateValue
  add: (d: DateValue, n: number) => DateValue // { days } / { months } / { years }
  between: (start: DateValue, end: DateValue) => DateValue[] // range highlighting
  createGrid: (placeholder: DateValue, layout: CalendarLayout) => CalendarGridData[]
  pageDuration: (layout: CalendarLayout) => DateDuration
  rowLength: (layout: CalendarLayout) => number
  formatCell: (formatter: Formatter, d: DateValue, locale: string) => string // "5" / "Sep" / "2026"
  formatLabel: (formatter: Formatter, d: DateValue) => string // aria-label
  formatHeading: (formatter: Formatter, grid: CalendarGridData[], opts: DateFormatterOptions) => string
}
```

`createMonths`, `createMonthGrid`, `createYearGrid` and the comparators already exist; the adapters wrap them. `useCalendarGrid({ unit, placeholder, layout, minValue, maxValue, … })` replaces `useCalendar`, `useMonthPicker` and `useYearPicker` with a single implementation parameterised by the adapter. `useRangeCalendarState` becomes unit-generic the same way (`isSameDay` → `adapter.isSame`, `getDaysBetween` → `adapter.between`).

### D11. Range specifics

`RangeCalendarRoot` gets the same `view` / `defaultView` / `granularity` / `maxView` props. `maximumDays` is generalised to `maximumLength` (counted in units of `granularity`); `maximumDays` stays as a deprecated alias for `granularity="day"` for one minor and is removed in v4. `fixedDate`, `allowNonContiguousRanges`, `isDateHighlightable` are unchanged and apply at the granularity.

### D12. `RangeCalendar` stays a separate family (for now)

Ark, Mantine, PrimeVue and react-day-picker fold range into a mode prop; React Aria, Bits UI and MUI X keep a separate component, and Reka has followed the second camp. The bloat this spec addresses is the six-way *unit* split, not the two-way *selection* split. Merging via `selectionMode: 'single' | 'multiple' | 'range'` is a follow-up: after this lands, `useCalendarGrid` and the cell-trigger surface are shared, so the remaining delta is the model type (`DateValue | DateValue[] | DateRange`) and the range-highlight state. Decide once the first phase is in.

### D13. `DatePicker` / `DateRangePicker`

Keep both families. `DatePickerRoot` passes `view` / `defaultView` / `granularity` / `maxView` / `yearsPerPage` / `columns` through to `CalendarRoot` and re-emits `update:view`. `DatePickerCalendar` exposes `view` in its slot. `closeOnSelect` fires only on a **commit** (`reason: 'cell-press' | 'cell-keydown'` at the granularity), never on a drill.

The fourteen pass-through parts per picker (`DatePickerCell`, `DatePickerCellTrigger`, …) stay as they are in this spec; they are twenty-line re-exports with renamed prop interfaces, not duplicated logic. Trimming them is a separate call best made with #2726 (per-component imports).

### D14. `MonthPicker*` / `YearPicker*` are removed

All four families and their 40 parts are deleted from `packages/core/src`, `packages/core/constant/components.ts`, `packages/plugins/src/namespaced`, the docs sidebar and `docs/content/meta`. Their docs pages become recipes on the Calendar page ("Month picker", "Year picker", "Month range picker"). The migration is a rename table (below); no codemod is needed. They shipped in v2.9, so the affected surface is young.

### D15. Headless composable per #2723

`useCalendar()` follows the recipe exactly:

- `useControllableState` for `modelValue`, `placeholder` and `view` (no `useVModel`).
- `CalendarChangeReason = 'cell-press' | 'cell-keydown' | 'view-drill' | 'view-trigger' | 'page-navigation' | 'focus-navigation'`; `'imperative-action'` / `'none'` from the base union.
- Emits: `beforeUpdate:modelValue`, `update:modelValue`, `beforeUpdate:placeholder`, `update:placeholder`, `beforeUpdate:view`, `update:view`, each `[value, details]`.
- Surfaces: `root`, `heading`, `viewTrigger`, `prev`, `next`, `grid(value)`, and the pure per-cell builder `getCalendarCellTriggerSurface(context, value)` (Tabs archetype — the SFC and the composable call the same builder).
- `context` is the frozen `CalendarRootContext` the descendant SFCs inject; the root SFC calls `provideCalendarRootContext(context)`.
- `@lifecycle setup` (the grid recomputes on placeholder/locale watchers; keyboard focus needs `nextTick`).

`useRangeCalendar()` mirrors it with `RangeCalendarChangeReason`.

### D16. Data attributes

Cells keep `data-value`, `data-selected`, `data-disabled`, `data-unavailable`, `data-today`, `data-outside-view`, `data-outside-visible-view`, `data-focused`, plus `data-highlighted` / `data-selection-start` / `data-selection-end` / `data-highlighted-start` / `data-highlighted-end` on ranges. Selection stays on `data-selected` rather than the two-axis `data-state` vocabulary (#2823): calendar cells were exempt from #2914 and a cell carries several orthogonal booleans, not one state. New: `data-view="day|month|year"` on `CalendarRoot`, `CalendarView`, `CalendarGrid`, `CalendarCellTrigger` and `CalendarViewTrigger`.

Accessibility: `CalendarGrid` keeps `role="application"` (#2502) and gains `aria-labelledby` pointing at a root-generated `headingId` (the month picker already did this; the day calendar did not). `CalendarViewTrigger` is a real `button`; `CalendarHeading` remains a static element with `role="heading"` for consumers who do not want the drill-down.

---

## Examples

**Month picker** (replaces `MonthPickerRoot` + 9 parts):

```vue
<CalendarRoot v-model="month" granularity="month" v-slot="{ grid }">
  <CalendarHeader>
    <CalendarPrev />
    <CalendarHeading />
    <CalendarNext />
  </CalendarHeader>
  <CalendarGrid v-for="page in grid" :key="page.value.toString()" :value="page.value">
    <CalendarGridBody>
      <CalendarGridRow v-for="(row, i) in page.rows" :key="i">
        <CalendarCell v-for="cell in row" :key="cell.toString()" :value="cell">
          <CalendarCellTrigger :value="cell" />
        </CalendarCell>
      </CalendarGridRow>
    </CalendarGridBody>
  </CalendarGrid>
</CalendarRoot>
```

**Date picker with drill-down** (the #741 / #2389 request):

```vue
<DatePickerRoot v-model="date" max-view="year">
  <DatePickerField> … </DatePickerField>
  <DatePickerContent>
    <DatePickerCalendar>
      <CalendarHeader>
        <CalendarPrev />
        <CalendarViewTrigger />
        <CalendarNext />
      </CalendarHeader>
      <CalendarView view="day"> … day grid … </CalendarView>
      <CalendarView view="month"> … month grid … </CalendarView>
      <CalendarView view="year"> … year grid … </CalendarView>
    </DatePickerCalendar>
  </DatePickerContent>
</DatePickerRoot>
```

Clicking the heading goes day → month → year; picking a year moves the placeholder and drops to the month view; picking a month drops to the day view; picking a day commits and (with `closeOnSelect`) closes the popover.

**Year range picker** (replaces `YearRangePickerRoot`): `<RangeCalendarRoot granularity="year" :years-per-page="12">` with the same grid markup.

---

## Migration (v2 → v3)

| v2 | v3 |
| --- | --- |
| `MonthPickerRoot` | `CalendarRoot granularity="month"` |
| `YearPickerRoot` | `CalendarRoot granularity="year"` |
| `MonthRangePickerRoot` | `RangeCalendarRoot granularity="month"` |
| `YearRangePickerRoot` | `RangeCalendarRoot granularity="year"` |
| `MonthPicker<Part>`, `YearPicker<Part>` | `Calendar<Part>` |
| `MonthRangePicker<Part>`, `YearRangePicker<Part>` | `RangeCalendar<Part>` |
| `isMonthDisabled`, `isYearDisabled` | `isDateDisabled` |
| `isMonthUnavailable`, `isYearUnavailable` | `isDateUnavailable` |
| `maximumMonths`, `maximumYears` | `maximumLength` |
| `CalendarCell :date` | `CalendarCell :value` |
| `CalendarCellTrigger :day :month` | `CalendarCellTrigger :value` + `CalendarGrid :value` |
| `MonthPickerCellTrigger :month`, `YearPickerCellTrigger :year` | `CalendarCellTrigger :value` |
| slot `dayValue` / `monthValue` / `yearValue` | slot `cellValue` |
| `v-slot="{ grid }"` where `grid` was a single object (Month/Year pickers) | `grid` is an array; iterate it |
| `@update:modelValue="(v) => …"` | unchanged for `v-model`; explicit listeners receive `details` as the second argument (#2828) |

Every change is a rename or a one-level wrap, so the "Migration - v2 to v3" guide gets a table, not a codemod.

---

## Open questions

Resolved 2026-09-05 (items 1–4 accepted as proposed):

1. **`granularity` vs `minView`.** `granularity` matches `DateField`; `minView` matches Ark, which the shadcn-vue audience knows. **Decision: `granularity`.**
2. **`CalendarView` optional** (D5) or required? Optional keeps day-calendar migration to renames; required is more explicit. **Decision: optional.**
3. **`columns` default** 4 (v2 layout, 3 rows of 4) or 3 (the shadcn / Ark layout). **Decision: 4**, to keep existing month-picker styling working.
4. **`nextPage` / `prevPage` props** gain a `view` argument (D7). **Decision: yes**, additive — `(placeholder: DateValue, view: CalendarView) => DateValue`.

Still open:

5. **Selection mode merge** (D12): decide after Phase 3 lands.
6. **`DatePicker` pass-through parts** (D13): decide with #2726.

---

## Risks

- **Focus across page flips.** The `shiftFocus` recursion relies on `nextTick` + `[data-value]` queries; making it unit-generic must not change the day-view behaviour that #2423 and #2676 fixed. The characterization tests in Phase 0 exist for this.
- **`grid` shape change** for `MonthPicker` / `YearPicker` consumers (single object → array). Covered by the migration table; the compiler flags it.
- **`DatePickerRoot` prop surface grows** (`view`, `granularity`, …). Additive, and the generated docs pick it up.
- **Docs generator** currently fails on `babel/traverse` interop (#2820 review note). `pnpm docs:gen` must be repaired before Phase 5 can regenerate `docs/content/meta`.
