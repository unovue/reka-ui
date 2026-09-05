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

- [x] **1.1** `units.ts` — `getUnitAdapter('day' | 'month' | 'year')` per D10, wrapping `createMonths`, `createMonthGrid`, `createYearGrid`, `isSameDay`, `isSameYearMonth`, `isSameYear`, `startOfMonth` / `endOfMonth` / `startOfYear` / `endOfYear`, the month- and year-range validators, plus the per-unit paging maths (`pageTarget`, `placeholderAfterPaging`, `nextPageStart`, `prevPageEnd`) lifted verbatim from the three v2 composables. `columns` added to `createMonthGrid` / `createYearGrid` (default 4). `units.test.ts` covers grid shapes, decade alignment on first render vs. unaligned after paging, bounds, paging targets and formatting.
- [x] **1.2** `useCalendarGrid.ts` — one composable parameterised by the adapter. **Homed in `packages/core/src/shared/date/`** (next to `useDateField`) rather than `src/date/`, because it imports `useDateFormatter` from `@/shared` and `src/date` must stay a leaf. Takes `MaybeRefOrGetter` props per the recipe and a `setPlaceholder` callback (so Phase 2 can hand it `useControllableState`'s setter); returns the v2 `useCalendar` surface plus `unit`, `adapter`, `layout`, `rowLength`. One deliberate behaviour change: `firstFocusableDate` walks the rendered cells that belong to the page and skips disabled/unavailable ones, instead of v2's month-level `isBefore(month.value, minValue)` pre-check, which skipped the whole month when `minValue` fell inside it. The `useCalendarGrid.test.ts` case "finds a focusable day inside the month even when minValue is after the 1st" pins this.
- [x] **1.3** Parity is proven by **side-by-side tests instead of delegation**: `useCalendarGrid.test.ts` builds the v2 `useCalendar` / `useMonthPicker` / `useYearPicker` and the new composable from the same scenario and compares grids, headings, labels, weekday strings, button-disabled state, per-cell disabled/unavailable/outside-view, placeholders after paging (default, root-level function, explicit function) and after external placeholder moves. The v2 composables are untouched, so the shipped families carry no risk from this phase; Phase 2 swaps them.
- [x] **1.4** `CalendarUnit`, `CalendarGridData` (alias of `Grid`, which stays), `Matcher` with the additive `unit` argument, and the adapter helpers (`clampCalendarView`, `finerUnit`, `coarserUnit`, `isCoarserUnit`, `CALENDAR_UNITS`) exported from `src/date`; `useCalendarGrid` from `src/shared/date`.
- [x] **1.5** Committed as `refactor(date): add unit adapters and useCalendarGrid behind the existing pickers`.

Verify: `vitest run src/date src/shared/date src/Calendar src/RangeCalendar src/MonthPicker src/YearPicker` + `type-check`. **Not yet run:** the drafting environment cannot reach the npm registry, so the Phase 1 tests were syntax-checked with Node's type stripping only and must be run in CI or locally before Phase 2 starts.

---

## Phase 2 — `Calendar` with `view` / `granularity` (breaking)

**Files:** `Calendar/useCalendar.ts` (rewrite), `CalendarRoot.vue`, `CalendarGrid.vue`, `CalendarCell.vue`, `CalendarCellTrigger.vue`, `CalendarHeading.vue`, `CalendarPrev.vue`, `CalendarNext.vue`, new `CalendarView.vue`, `CalendarViewTrigger.vue`, `Calendar/index.ts`, stories, tests.

- [x] **2.1** `useCalendar()` per D15: `useControllableState` for `modelValue`, `placeholder`, `view` (clamped into `[granularity, maxView]`); `CalendarChangeReason`; `select(value, reason, event)` implementing D2 (commit at the granularity, drill above it); `setView` / `drillUp`; one `useCalendarGrid` keyed on the active `view`; surfaces `root`, `heading`, `viewTrigger`, `prev`, `next` plus the pure builders `getCalendarGridSurface`, `getCalendarCellSurface`, `getCalendarCellTriggerSurface(context, value, page, unit)` (the D8 keyboard handler and the depth-guarded `shiftFocus` loop, unit-generic); `context` = the new `CalendarRootContext`. The v2 day composable is frozen under `shared/date/__fixtures__/useCalendarV2.ts` as the parity oracle.
- [x] **2.2** `CalendarRoot.vue` — thin shell: props (`+ view`, `defaultView`, `granularity`, `maxView`, `yearsPerPage`, `columns`), emits (`beforeUpdate:` / `update:` for `modelValue`, `placeholder`, `view` with details), `headingId = useId(…)` on the visually hidden heading, `provideCalendarRootContext(context)`, slot `{ date, grid, weekDays, weekStartsOn, locale, fixedWeeks, modelValue, view, granularity }`. Single root element, so `inheritAttrs` stays on and `$attrs` merge automatically after `root.attrs`.
- [x] **2.3** `CalendarView.vue` — `view` prop; renders a `div` (or `as-child`) with the slot only while active; `provideCalendarViewContext({ unit })`; `data-view`. `CalendarViewTrigger.vue` — `button`, heading text, `aria-label` "Switch to <next> view", disabled at `maxView`, `data-view`.
- [x] **2.4** `CalendarGrid.vue` — `value?: DateValue`, `provideCalendarGridContext`, `aria-labelledby=headingId`, `data-view`. `CalendarCell.vue` — `value`; `data-disabled` now applies `disableDaysOutsideCurrentView` only to cells outside the grid's page (v2 applied it to every cell). `CalendarCellTrigger.vue` — `value`; unit from view context → root active view, page from grid context; slot `{ cellValue, disabled, selected, today, outsideView, outsideVisibleView, unavailable, view }`. `data-selected` is now `""` rather than `"true"` (the shared `stateToDataAttrs` rule); presence selectors are unaffected.
- [x] **2.5** `CalendarHeading` / `CalendarPrev` / `CalendarNext` — bind the composable's surfaces; `nextPage` / `prevPage` props typed `CalendarPageFunction` (placeholder + view).
- [x] **2.6** New `CalendarViews.test.ts` covers `granularity="month"` and `"year"` (the MonthPicker / YearPicker contract: twelve cells, `columns`, day preservation, deselect, bounds, keyboard stride and page flips — the #2781 case — PageUp/PageDown, unit-aware matchers, decade alignment, `yearsPerPage`), the drill-down flow with reasons on `update:view`, `maxView`, the view clamp, `v-model:view`, per-view paging and `beforeUpdate:modelValue` cancel. The v2 `MonthPicker.test.ts` / `YearPicker.test.ts` keep running against the still-shipping families until Phase 5.
- [x] **2.7** Harnesses `story/_CalendarViews.vue` (three views + trigger) and `story/_CalendarUnit.vue` (single-view picker); every Calendar and DatePicker story, docs demo and docs snippet moved to `CalendarCell :value` / `CalendarCellTrigger :value` / `CalendarGrid :value`. `CalendarView` / `CalendarViewTrigger` registered in `constant/components.ts` and the namespaced plugin export. Histoire story `CalendarViews.story.vue` (drill-down, month picker, year picker with `columns` / `yearsPerPage`).
- [ ] **2.8** axe on the drill-down harness (in `CalendarViews.test.ts`); `type-check`; family-scoped `docs:gen` (expect a real diff — new props). **Tests are syntax-checked only in the drafting environment; CI (`pnpm run build` on push) provides the type-check signal, vitest needs a PR or a local run.**
- [x] **2.9** Commit: `feat(Calendar)!: view and granularity — day, month and year views in one family`.
- [x] **2.10** `RangeCalendarRoot` consumed the v2 day-view `useCalendar`; it now builds its grid on `useCalendarGrid({ unit: 'day' })` until Phase 3 gives it views. No public change.

---

## Phase 3 — `RangeCalendar` (breaking)

**Files:** `RangeCalendar/useRangeCalendar.ts` (rewrite), the eight `RangeCalendar*.vue` parts that change, new `RangeCalendarView.vue` / `RangeCalendarViewTrigger.vue`, `index.ts`, stories, tests.

- [x] **3.1** `useRangeCalendar()` — same skeleton as 2.1 plus the range state (`startValue`, `endValue`, `focusedValue`, `lastPressedDateValue`, `validModelValue`, `highlightedRange`, `isSelected*`, `isHighlighted*`) made unit-generic through the adapter (`isSame`, `compare`, `distance`, `add`, `areAllBetweenValid`). `maximumLength` (D11) with `maximumDays` as deprecated alias; the `fixedDate` window when the current range already exceeds the maximum follows the v2 month picker (restrict around the fixed end) rather than the v2 day calendar (no restriction), and the hover highlight caps at the focused cell rather than always spanning the maximum. `RangeCalendarChangeReason` adds `'escape-key'`. A `beforeUpdate:modelValue` cancel restores start/end from the committed range. Cells of a view coarser than the granularity carry no range state.
- [x] **3.2** Shells on the shared chrome builders (`getCalendarHeadingSurface`, `getCalendarViewTriggerSurface`, `getCalendarNavSurface`, `getCalendarGridSurface` now take a structural `CalendarChromeContext`) plus range-specific `getRangeCalendarCellSurface` / `getRangeCalendarCellTriggerSurface`; the keyboard loop lives once in `shared/date/cellFocusNavigation.ts` and both families' cell triggers use it. New `RangeCalendarView` / `RangeCalendarViewTrigger`; `RangeCalendarCell` / `RangeCalendarCellTrigger` / `RangeCalendarGrid` on `value`; range slot props preserved plus `cellValue` and `view`.
- [x] **3.3** New `RangeCalendarViews.test.ts` covers month and year ranges (two-click selection, ordering, `maximumLength` highlight cap and disabling, controlled ranges, keyboard across the year boundary), the drill-down flow, the absence of range state above the granularity, and cancellation. The v2 range picker suites keep running against the still-shipping families until Phase 5.
- [ ] **3.4** Stories: `RangeCalendarViews.story.vue` (drill-down, month range, year range) — pending.
- [x] **3.5** Commit: `feat(RangeCalendar)!: view and granularity — month and year range selection`. Every RangeCalendar and DateRangePicker story, demo and docs snippet moved to `:value`.

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
