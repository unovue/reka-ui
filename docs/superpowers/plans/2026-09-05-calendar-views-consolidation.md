# Calendar Views Consolidation — Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. One phase per PR against `v3`, each with its own characterization gate.

> **Design:** `docs/superpowers/specs/2026-09-05-calendar-views-design.md` (read it first — every decision number below refers to it). Tracks the v3 epic **#2721** and closes #741, #1199, #1730, #2191, #2389, #1933, #2781.

**Goal:** Replace the six copied grid-picker families (`Calendar`, `RangeCalendar`, `MonthPicker`, `MonthRangePicker`, `YearPicker`, `YearRangePicker`) with `Calendar` + `RangeCalendar` driven by `view` and `granularity`, built as `useCalendar()` / `useRangeCalendar()` headless composables per the #2723 recipe.

**Approach:** Build the unit-adapter layer underneath the existing families first (no public change), then rewire `Calendar`, then `RangeCalendar`, then the pickers, and only then delete the Month/Year families. Every phase leaves `v3` green and buildable.

**Tech stack:** Vue 3 `<script setup>`, `@internationalized/date`, `useControllableState` + `ChangeEventDetails` + `PartSurface` (#2910), vitest + jsdom + `@testing-library/vue` + `vitest-axe`, Histoire stories, VitePress docs, pnpm monorepo.

## Global constraints

- Node ≥ 22, pnpm 10. All commands from repo root. Test one-shot: `pnpm --filter reka-ui exec vitest run <path>`; never `pnpm test` (watch).
- Type-check: `pnpm --filter reka-ui type-check`. Lint: `pnpm lint:fix`. Build: `pnpm --filter reka-ui build`. Docs regen: `pnpm docs:gen` (family-scoped; repair the `babel/traverse` interop failure noted on #2820 before relying on it).
- **Characterize before refactoring** (recipe step 1). The existing suites are decent for Calendar (50 cases) and RangeCalendar (45) but thin for the pickers (23 / 24, none for the range pickers). Phase 0 locks keyboard, paging, bounds and placeholder-sync behaviour against the unmodified code.
- Composables: props in as `MaybeRefOrGetter` / `Ref`, read with `toValue`; no `defineProps` / `provide` / `document` inside; handlers live in `part.props` so `mergeProps` chains consumer listeners. Bind `part.attrs.value` with `mergeProps`, never object spread. Collision audit before naming (`useCalendar` is free in `vue`, `@vueuse/core` and Nuxt auto-imports as of this writing; re-check).
- `docs/content/meta/*.md` is generated — never hand-edit.
- Conventional Commits, scope = family (`feat(Calendar): …`, `refactor(date): …`). Breaking commits carry `!`.
- Public API of `DateField` / `TimeField` and of the untouched parts of `DatePicker` must be byte-for-byte unchanged.

---

## File structure

**Create**

- `packages/core/src/date/units.ts` (+ `units.test.ts`) — `CalendarUnit`, `CalendarUnitAdapter`, `getUnitAdapter(unit)` (D10)
- `packages/core/src/date/useCalendarGrid.ts` (+ test) — the one grid/paging/bounds composable replacing `useCalendar` / `useMonthPicker` / `useYearPicker`
- `packages/core/src/Calendar/useCalendar.ts` — rewritten as the #2723 headless composable (`useCalendar`, `getCalendarCellTriggerSurface`, `CalendarChangeReason`) (+ `useCalendar.test.ts`)
- `packages/core/src/Calendar/CalendarView.vue`, `CalendarViewTrigger.vue`
- `packages/core/src/RangeCalendar/useRangeCalendar.ts` — same treatment (+ test)
- `packages/core/src/RangeCalendar/RangeCalendarView.vue`, `RangeCalendarViewTrigger.vue`
- Stories: `Calendar/story/CalendarViews.story.vue`, `CalendarMonth.story.vue`, `CalendarYear.story.vue`, and the range equivalents
- Docs: recipe sections on `docs/content/docs/components/calendar.md` and `range-calendar.md`; a section in `docs/content/docs/guides/migration-v3.md`

**Modify**

- `packages/core/src/Calendar/*.vue` — `CalendarRoot` (new props/emits/context), `CalendarGrid` (`value`, `aria-labelledby`), `CalendarCell` (`value`), `CalendarCellTrigger` (`value`, unit-generic), `CalendarHeading` / `CalendarPrev` / `CalendarNext` (active-view aware), `index.ts`
- `packages/core/src/RangeCalendar/*.vue` — same
- `packages/core/src/DatePicker/DatePickerRoot.vue`, `DatePickerCalendar.vue`, `DatePickerCell.vue`, `DatePickerCellTrigger.vue`, `DatePickerGrid.vue` (+ `DateRangePicker` mirrors)
- `packages/core/src/date/calendar.ts` — `createMonthGrid` / `createYearGrid` accept `columns`; `Grid` type renamed `CalendarGridData` with a deprecated alias
- `packages/core/src/index.ts`, `packages/core/constant/components.ts`, `packages/plugins/src/namespaced/index.ts`, `docs/.vitepress/config.ts`
- `docs/content/docs/overview/releases.md`

**Delete (Phase 5)**

- `packages/core/src/MonthPicker`, `MonthRangePicker`, `YearPicker`, `YearRangePicker`
- `docs/content/docs/components/month-picker.md`, `month-range-picker.md`, `year-picker.md`, `year-range-picker.md`
- `docs/components/demo/MonthPicker`, `MonthRangePicker`, `YearPicker`, `YearRangePicker` (moved under `Calendar*` / `RangeCalendar*` demos)
- `docs/content/meta/MonthPicker*.md`, `MonthRangePicker*.md`, `YearPicker*.md`, `YearRangePicker*.md` (40 files)

---

## Phase 0 — Characterization (no production change)

**Files:** `Calendar.test.ts`, `RangeCalendar.test.ts`, `MonthPicker.test.ts`, `YearPicker.test.ts`; **create** `MonthRangePicker.test.ts`, `YearRangePicker.test.ts`.

- [ ] **0.1** Add a `characterization` describe to each of the six suites, GREEN against unmodified code, covering: arrow-key stride (7 vs 4) and RTL flip; page flip when the arrow target is off-grid, and the focused cell afterwards; `PageUp` / `PageDown` in the month picker; `minValue` / `maxValue` disabling prev/next and clamping arrow navigation; deselect with and without `preventDeselect`; `multiple` add/remove; placeholder sync when `modelValue` changes externally; month/year selection preserving `day` (and `month`) from the previous value (`resolveMonthValue` / `resolveYearValue`); `aria-label` on root and cells; `role="application"` + `aria-labelledby` on the month/year grids; range: `fixedDate`, `maximumDays` / `maximumMonths`, `allowNonContiguousRanges`, highlight on focus.
- [ ] **0.2** Record the #2781 reproduction (3×4 month grid keyboard navigation) as a `todo`/`fails` test so Phase 2 flips it.
- [ ] **0.3** Commit: `test(Calendar): characterize keyboard, paging and bounds before the views refactor` (one commit per family is fine).

Verify: `pnpm --filter reka-ui exec vitest run src/Calendar src/RangeCalendar src/MonthPicker src/YearPicker src/MonthRangePicker src/YearRangePicker`.

---

## Phase 1 — Unit adapters and `useCalendarGrid` (internal)

**Files:** create `date/units.ts`, `date/useCalendarGrid.ts` (+ tests); modify `date/calendar.ts`, `date/index.ts`.

- [ ] **1.1** `units.ts` — implement `getUnitAdapter('day' | 'month' | 'year')` per D10, wrapping `createMonths`, `createMonthGrid`, `createYearGrid`, `isSameDay`, `isSameYearMonth`, `isSameYear`, `startOfMonth` / `endOfMonth` / `startOfYear` / `endOfYear`, `getDaysBetween` / month- and year-range builders. Add `columns` to `createMonthGrid` / `createYearGrid` (default 4). TDD: one test file asserting grid shapes (42-cell fixed weeks, 12 months, `yearsPerPage` years, decade alignment on first render and non-aligned after paging — today's behaviour), `isSame`, `between`, and bounds.
- [ ] **1.2** `useCalendarGrid.ts` — port `useCalendar` (day), `useMonthPicker`, `useYearPicker` into one composable taking `{ unit, placeholder, locale, layout, minValue, maxValue, disabled, isDateDisabled, isDateUnavailable, calendarLabel, nextPage, prevPage }` and returning `{ grid, weekDays, headingValue, fullCalendarLabel, visibleView, isOutsideVisibleView, isDateDisabled, isDateUnavailable, prevPage, nextPage, isPrevButtonDisabled, isNextButtonDisabled, isPlaceholderFocusable, firstFocusableDate, formatter }`. Keep the three existing composables' semantics per unit (the day-view `handleNextDisabled` / `duration` maths stays verbatim; the month/year `placeholder.set({ month, day })` preservation stays verbatim). `@lifecycle setup`.
- [ ] **1.3** Prove parity: temporarily make `useCalendar.ts`, `useMonthPicker.ts` and `useYearPicker.ts` delegate to `useCalendarGrid` and run Phase 0 + existing suites GREEN. (This is a stepping stone; Phase 2 rewrites the callers.)
- [ ] **1.4** Export `CalendarUnit`, `CalendarGridData` (alias `Grid` kept, `@deprecated`) from `packages/core/src/date/index.ts`.
- [ ] **1.5** Commit: `refactor(date): add unit adapters and useCalendarGrid behind the existing pickers`.

Verify: `vitest run src/date src/Calendar src/RangeCalendar src/MonthPicker src/YearPicker` + `type-check`.

---

## Phase 2 — `Calendar` with `view` / `granularity` (breaking)

**Files:** `Calendar/useCalendar.ts` (rewrite), `CalendarRoot.vue`, `CalendarGrid.vue`, `CalendarCell.vue`, `CalendarCellTrigger.vue`, `CalendarHeading.vue`, `CalendarPrev.vue`, `CalendarNext.vue`, new `CalendarView.vue`, `CalendarViewTrigger.vue`, `Calendar/index.ts`, stories, tests.

- [ ] **2.1** `useCalendar()` per D15: `useControllableState` for `modelValue`, `placeholder`, `view` (clamped to `≥ granularity`); `CalendarChangeReason`; `select(value, reason, event)` implementing D2 (commit at granularity, drill above it); `setView`; per-view `useCalendarGrid` instances created lazily via `computed` keyed on `view`; surfaces `root`, `heading`, `viewTrigger`, `prev`, `next`, `getGridSurface(value)`, `getCalendarCellTriggerSurface(context, value)` (pure builder holding the D8 keyboard handler and the `shiftFocus` loop, unit-generic, depth-guarded); `context` = the new `CalendarRootContext`. Test with a mount harness: reasons on every emit, `beforeUpdate` cancel, drill vs commit, view clamp, #2781 case now passing.
- [ ] **2.2** `CalendarRoot.vue` — thin shell: props (`+ view`, `defaultView`, `granularity`, `maxView`, `yearsPerPage`, `columns`), emits (`beforeUpdate:` / `update:` for `modelValue`, `placeholder`, `view` with details), `headingId = useId(…)`, `provideCalendarRootContext(context)`, `mergeProps(root.attrs.value, $attrs)`, slot `{ date, grid, weekDays, weekStartsOn, locale, fixedWeeks, modelValue, view, granularity }`, keep the visually-hidden heading.
- [ ] **2.3** `CalendarView.vue` — `view` prop; renders slot iff active; `provideCalendarViewContext({ unit })`; `data-view`. `CalendarViewTrigger.vue` — `button`, heading text, `aria-label` "Switch to <next> view", disabled at `maxView`, `data-view`.
- [ ] **2.4** `CalendarGrid.vue` — `value?: DateValue`, `provideCalendarGridContext`, `aria-labelledby=headingId`, `data-view`. `CalendarCell.vue` — `value`. `CalendarCellTrigger.vue` — `value`; unit from view context → grid context → root active view; bind `getCalendarCellTriggerSurface(context, () => props.value).attrs`; slot `{ cellValue, disabled, selected, today, outsideView, outsideVisibleView, unavailable }`.
- [ ] **2.5** `CalendarHeading` / `CalendarPrev` / `CalendarNext` — bind the composable's surfaces (API unchanged).
- [ ] **2.6** Re-point `MonthPicker.test.ts` / `YearPicker.test.ts` characterization cases at `CalendarRoot granularity="month|year"` (copy them into `Calendar.test.ts` under `granularity: month` / `granularity: year` describes); keep the originals passing until Phase 5 deletes them.
- [ ] **2.7** Stories: `CalendarViews` (drill-down), `CalendarMonth`, `CalendarYear`; update `_Calendar.vue` to the new cell props.
- [ ] **2.8** axe on the drill-down story; `type-check`; family-scoped `docs:gen` (expect a real diff — new props).
- [ ] **2.9** Commit: `feat(Calendar)!: view and granularity — day, month and year views in one family`.

---

## Phase 3 — `RangeCalendar` (breaking)

**Files:** `RangeCalendar/useRangeCalendar.ts` (rewrite), the eight `RangeCalendar*.vue` parts that change, new `RangeCalendarView.vue` / `RangeCalendarViewTrigger.vue`, `index.ts`, stories, tests.

- [ ] **3.1** `useRangeCalendar()` — same skeleton as 2.1 plus the range state (`startValue`, `endValue`, `focusedValue`, `lastPressedDateValue`, `highlightedRange`, `isSelected*`, `isHighlighted*`) made unit-generic through the adapter (`isSame`, `between`, `add`). `maximumLength` (D11) with `maximumDays` as deprecated alias. `RangeCalendarChangeReason`.
- [ ] **3.2** Shells + `RangeCalendarCellTrigger` on `value` with the range slot props preserved.
- [ ] **3.3** Port `MonthRangePicker.test.ts` / `YearRangePicker.test.ts` characterization to `RangeCalendar.test.ts` under `granularity` describes.
- [ ] **3.4** Stories: `RangeCalendarViews`, `RangeCalendarMonth`, `RangeCalendarYear`.
- [ ] **3.5** Commit: `feat(RangeCalendar)!: view and granularity — month and year range selection`.

---

## Phase 4 — `DatePicker` / `DateRangePicker`

**Files:** `DatePickerRoot.vue`, `DatePickerCalendar.vue`, `DatePickerCell.vue`, `DatePickerCellTrigger.vue`, `DatePickerGrid.vue`; new `DatePickerView.vue`, `DatePickerViewTrigger.vue`; `DatePicker/index.ts`; the `DateRangePicker` mirrors; stories, tests.

- [ ] **4.1** Root: pass `view` / `defaultView` / `granularity` / `maxView` / `yearsPerPage` / `columns` through; re-emit `update:view`; `closeOnSelect` only on a commit reason (D13). When this lands after the roadmap branch's `DatePickerRoot` conversion to `useControllableState` (`open` with details), rebase on it; otherwise convert `open` here per the recipe so the family is done once.
- [ ] **4.2** `DatePickerCalendar` slot exposes `view`; add `DatePickerView` / `DatePickerViewTrigger` pass-throughs; `DatePickerCell` / `DatePickerCellTrigger` / `DatePickerGrid` forward the renamed props.
- [ ] **4.3** Story `DatePickerViews` (drill-down inside the popover, `closeOnSelect`); tests for "drill does not close, commit does".
- [ ] **4.4** Commit: `feat(DatePicker): expose calendar views and granularity` (+ `DateRangePicker`).

---

## Phase 5 — Remove `MonthPicker*` / `YearPicker*`, docs, migration (breaking)

- [ ] **5.1** Delete the four families and their tests/stories; remove from `packages/core/src/index.ts`, `packages/core/constant/components.ts`, `packages/plugins/src/namespaced/index.ts`; run the namespaced generator if one exists (`chore: generate namespace` commits show the pattern).
- [ ] **5.2** Docs: fold `month-picker.md`, `month-range-picker.md`, `year-picker.md`, `year-range-picker.md` into recipe sections on `calendar.md` / `range-calendar.md` (keep the demos, moved under `Calendar*` / `RangeCalendar*`); remove the four sidebar entries in `docs/.vitepress/config.ts`; add redirects if the site supports them.
- [ ] **5.3** Regenerate `docs/content/meta` for Calendar, RangeCalendar, DatePicker, DateRangePicker; delete the 40 Month/Year meta files.
- [ ] **5.4** `migration-v3.md`: add a "Calendar views" section with the rename table from the spec; `releases.md`: v3 entry.
- [ ] **5.5** Full verification: `pnpm lint`, `pnpm --filter reka-ui type-check`, `pnpm --filter reka-ui exec vitest run`, `pnpm --filter reka-ui build`, docs build.
- [ ] **5.6** Commit: `feat(Calendar)!: remove MonthPicker and YearPicker families in favour of granularity`.
- [ ] **5.7** Update #2721 (breaking surface list + "Landed on v3") and close #741, #1199, #1730, #2191, #2389, #1933, #2781 with a link to the guide.

---

## Phase 6 — Follow-ups (separate decisions, not blocking)

- [ ] **6.1** `selectionMode` spike (D12): prototype `CalendarRoot selection-mode="range"` on top of the shared surfaces; measure the type-level cost of the model union before committing.
- [ ] **6.2** `DatePicker` pass-through parts (D13): decide with #2726 whether `DatePickerCalendar` should simply host `Calendar*` parts.
- [ ] **6.3** `Home` / `End` keyboard support (first/last cell of the page) — cheap once the keyboard is unit-generic.

---

## Verification matrix

| Phase | Tests | Type-check | Docs gen | Build |
| --- | --- | --- | --- | --- |
| 0 | six families GREEN pre-refactor | — | — | — |
| 1 | `date/*` new + six families unchanged | ✓ | no diff | — |
| 2 | Calendar + ported Month/Year cases + `useCalendar.test.ts` + axe | ✓ | Calendar diff expected | ✓ |
| 3 | RangeCalendar + ported range cases | ✓ | RangeCalendar diff | ✓ |
| 4 | DatePicker / DateRangePicker | ✓ | picker diff | ✓ |
| 5 | full suite | ✓ | full regen | ✓ + docs build |
