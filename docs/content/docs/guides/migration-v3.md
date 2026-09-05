---
title: Migration - v2 to v3
description: This guide collects the breaking changes between Reka UI v2 and v3, with search-and-replace instructions for each of them.
---

# Migration - v2 to v3

<Description>
This guide collects the breaking changes between Reka UI v2 and v3, with search-and-replace instructions for each of them.
</Description>

Reka UI v3 is still in progress. This page collects the breaking changes as they land on the `v3` branch, so it will keep growing until the release is finalized. Each section describes what changed and the mechanical rewrite needed to move an existing v2 codebase over.

Prefer to hand the mechanical work to an AI agent? [Migrating with an AI agent](./migration-v3-agent) is this guide rewritten as instructions for one: point your agent at it, let it apply the rewrites, and review the diff.

## `data-state` vocabulary

In v3, `data-state` answers exactly one of two questions: disclosure ("is this surface revealed?") is reported as `open` or `closed`, and selection ("is this control in its affirmative state?") is reported as `checked` or `unchecked`, with `indeterminate` reserved for tri-state controls that also emit `aria-checked="mixed"`. Both values are always emitted—`data-state` is never absent—and qualifiers such as *how* a surface came to be open live in their own `data-*` attribute rather than in `data-state`.

Parts that were already on `open` / `closed` or `checked` / `unchecked` / `indeterminate` are unchanged. Genuine multi-value machines keep a vocabulary of their own: [Progress](../components/progress) (`indeterminate` / `loading` / `complete`) and the [Splitter](../components/splitter) resize handle (`drag` / `hover` / `inactive`) are untouched, while [Stepper](../components/stepper) keeps `completed` but renames `active` / `inactive` to `current` / `upcoming`, so that its words are neither synonyms of the two axes nor the same as Tabs' old `active` / `inactive`.

| Part | v2 | v3 |
| --- | --- | --- |
| `Toggle`, `ToggleGroupItem`, `ToolbarToggleItem` | `on` / `off` | `checked` / `unchecked` |
| `TabsTrigger`, `TabsContent` | `active` / `inactive` | `checked` / `unchecked` |
| `TagsInputItem`, `TagsInputItemDelete` | `active` / `inactive` | `checked` / `unchecked` |
| `RatingItemIndicator` | `active` / (absent) | `checked` / `unchecked` |
| `StepperItem`, `StepperTrigger`, `StepperSeparator` | `completed` / `active` / `inactive` | `completed` / `current` / `upcoming` |
| `ScrollAreaScrollbar`, `ScrollAreaThumb`, `NavigationMenuIndicator` | `visible` / `hidden` | `open` / `closed` |
| `SplitterPanel` | `expanded` / `collapsed` / (absent when not collapsible) | `open` / `closed` (non-collapsible panels are always `open`) |
| `CollapsibleContent` | `open` / `closed` / (absent on the initial animated mount) | `open` / `closed` |
| `TooltipTrigger`, `TooltipContent` | `closed` / `delayed-open` / `instant-open` | `open` / `closed`, plus a boolean `data-delayed` attribute present while open when the open was delayed |
| Everything already on `open` / `closed` or `checked` / `unchecked` / `indeterminate` | unchanged | unchanged |

### Search and replace

The rewrites are mechanical. In Tailwind variants:

- `data-[state=on]:` → `data-[state=checked]:`, `data-[state=off]:` → `data-[state=unchecked]:`
- `data-[state=active]:` → `data-[state=checked]:`, `data-[state=inactive]:` → `data-[state=unchecked]:` — for **Tabs, TagsInput and Rating only**.
- `data-[state=active]:` → `data-[state=current]:`, `data-[state=inactive]:` → `data-[state=upcoming]:` — for **Stepper only** (`data-[state=completed]:` is unchanged). Only the Splitter resize handle still emits `inactive`, so leave selectors on `SplitterResizeHandle` alone.
- `data-[state=visible]:` → `data-[state=open]:`, `data-[state=hidden]:` → `data-[state=closed]:`
- `data-[state=expanded]:` → `data-[state=open]:`, `data-[state=collapsed]:` → `data-[state=closed]:`
- `data-[state=delayed-open]:` → `data-[state=open]:data-[delayed]:`
- `data-[state=instant-open]:` → `data-[state=open]:` (combine with `:not([data-delayed])` in plain CSS if you need to target instant opens specifically)

In plain CSS the same rewrites apply to attribute selectors:

- `[data-state='on']` → `[data-state='checked']`, `[data-state='off']` → `[data-state='unchecked']`
- `[data-state='active']` → `[data-state='checked']`, `[data-state='inactive']` → `[data-state='unchecked']` — Tabs, TagsInput and Rating only.
- `[data-state='active']` → `[data-state='current']`, `[data-state='inactive']` → `[data-state='upcoming']` — Stepper only; `[data-state='completed']` is unchanged and the Splitter resize handle keeps `inactive`.
- `[data-state='visible']` → `[data-state='open']`, `[data-state='hidden']` → `[data-state='closed']`
- `[data-state='expanded']` → `[data-state='open']`, `[data-state='collapsed']` → `[data-state='closed']`
- `[data-state='delayed-open']` → `[data-state='open'][data-delayed]`
- `[data-state='instant-open']` → `[data-state='open']:not([data-delayed])`

Because both values are now always emitted, any styles that relied on the attribute being *absent* (for example `.RatingItemIndicator:not([data-state])`, or a `SplitterPanel` without `data-state` because it is not collapsible) should target the explicit `unchecked` / `open` value instead.

```css
.Toggle[data-state='on'] { /* [!code --] */
.Toggle[data-state='checked'] { /* [!code ++] */
  background-color: var(--green-5);
}

.TabsTrigger[data-state='active'] { /* [!code --] */
.TabsTrigger[data-state='checked'] { /* [!code ++] */
  color: var(--grass-11);
}

.StepperItem[data-state='active'] .StepperIndicator { /* [!code --] */
.StepperItem[data-state='current'] .StepperIndicator { /* [!code ++] */
  background-color: var(--mauve-12);
}

.TooltipContent[data-state='delayed-open'][data-side='top'] { /* [!code --] */
.TooltipContent[data-state='open'][data-delayed][data-side='top'] { /* [!code ++] */
  animation-name: slideDownAndFade;
}
```

## Change events carry details

`update:*` events on stateful roots now receive a second argument, a `ChangeEventDetails` object, and a cancellable `beforeUpdate:*` event fires before every change. `v-model` keeps working unchanged. The details tell you *why* the state changed (`details.reason`) and which native event caused it (`details.event`), and `details.cancel()` inside `beforeUpdate:*` keeps the current state.

Converted so far: `SwitchRoot`, `TabsRoot`, `Toggle`, `ToggleGroupRoot`, `CheckboxRoot`, `CheckboxGroupRoot`, `RadioGroupRoot` (`modelValue`), `DropdownMenuRoot`, `DropdownMenuSub`, `ContextMenuRoot`, `ContextMenuSub`, `MenubarSub`, `DialogRoot`, `AlertDialogRoot`, `PopoverRoot`, `TooltipRoot`, `HoverCardRoot`, `DatePickerRoot` and `DateRangePickerRoot` (`open`). The remaining families follow as they move to their headless composables.

A change to a value that is already current no longer emits: `update:modelValue` fires only when the value actually changes, so re-pressing the checked radio or the selected single-mode toggle emits nothing (the `select` event on `RadioGroupItem` still fires).

Each family exports its reason union, for example `DialogOpenChangeReason` (`'trigger-press' | 'close-press' | 'escape-key' | 'outside-press' | 'focus-outside'`) or `TooltipOpenChangeReason` (`'trigger-hover' | 'trigger-leave' | 'trigger-focus' | 'trigger-blur' | 'trigger-press' | 'content-leave' | 'escape-key' | 'outside-press'`). Those unions only list the interaction reasons: `details.reason` is typed as the family union plus the shared `BaseChangeReason`, so every family also reports `'imperative-action'` for programmatic changes such as the slot's `close()`, and a `switch` written against the family union alone misses it. A delayed hover open on Tooltip and HoverCard reports `trigger-hover` with the pointer event that armed the timer.

What to check in your code:

- Explicit `@update:open` / `@update:model-value` listeners receive an extra argument. Handlers that only read the first argument keep working; handlers typed with a single-parameter signature still type-check.
- Wrappers that re-declare the emit types need the new tuple shape:

  ```ts
  'update:open': [value: boolean] // [!code --]
  'update:open': [value: boolean, details: ChangeEventDetails<DialogOpenChangeReason>] // [!code ++]
  ```

- Uncontrolled components emit synchronously from the interaction instead of from a watcher on the next tick. Code that relied on the old timing may observe the difference.
- A component that mounts uncontrolled and later receives a defined model value becomes controlled at that point and stays controlled, even if the model is later cleared to `undefined`.

```vue
<DialogRoot
  v-model:open="open"
  @before-update:open="(value, details) => {
    // keep the dialog open while the form is dirty, but let the close button through
    if (!value && isDirty && details.reason !== 'close-press')
      details.cancel()
  }"
/>
```

## Calendar views

`MonthPicker`, `MonthRangePicker`, `YearPicker` and `YearRangePicker` are gone. `Calendar` and `RangeCalendar` now carry a `view` (`day` | `month` | `year`, bindable as `v-model:view`) and a `granularity` that fixes what a selection means. A month picker is `<CalendarRoot granularity="month">`, a year range picker is `<RangeCalendarRoot granularity="year">`, and a day calendar can drill up to its month and year grids through the new `CalendarView` / `CalendarViewTrigger` parts (and their `RangeCalendar*`, `DatePicker*`, `DateRangePicker*` equivalents). Selecting a cell in a view coarser than the granularity moves the placeholder and drills down; selecting at the granularity commits.

| v2 | v3 |
| --- | --- |
| `MonthPickerRoot` | `CalendarRoot granularity="month"` |
| `YearPickerRoot` | `CalendarRoot granularity="year"` |
| `MonthRangePickerRoot`, `YearRangePickerRoot` | `RangeCalendarRoot granularity="month"` / `"year"` |
| `MonthPicker<Part>`, `YearPicker<Part>` | `Calendar<Part>` |
| `MonthRangePicker<Part>`, `YearRangePicker<Part>` | `RangeCalendar<Part>` |
| `isMonthDisabled`, `isYearDisabled` | `isDateDisabled` (receives the cell's unit as its second argument) |
| `isMonthUnavailable`, `isYearUnavailable` | `isDateUnavailable` |
| `maximumMonths`, `maximumYears` | `maximumLength` (counted in units of `granularity`; `maximumDays` remains as a deprecated alias) |
| `CalendarCell :date`, `RangeCalendarCell :date` | `:value` |
| `CalendarCellTrigger :day :month`, `RangeCalendarCellTrigger :day :month` | `CalendarCellTrigger :value` + `CalendarGrid :value="page.value"` |
| `MonthPickerCellTrigger :month`, `YearPickerCellTrigger :year` | `CalendarCellTrigger :value` |
| cell trigger slot `dayValue` / `monthValue` / `yearValue` | `cellValue` |
| `grid` slot prop as a single object (month and year pickers) | `grid` is always an array of pages; iterate it |
| `nextPage` / `prevPage` `(placeholder) => DateValue` | unchanged signature; the active view arrives as an additive second argument |
| `data-selected="true"`, `data-selection-start="true"` … | emitted as empty strings; presence selectors (`[data-selected]`, `data-[selected]:`) are unaffected |

The `DatePicker` and `DateRangePicker` roots forward `view`, `defaultView`, `maxView`, `yearsPerPage` and `columns` and emit `update:view`; they do not expose the calendar `granularity` (that name already belongs to the field's time granularity, and a field edits full dates), so month or year pickers use `Calendar` / `RangeCalendar` directly.

Change events on these roots now follow the [details contract](#change-events-carry-details): `update:modelValue`, `update:placeholder` and `update:view` receive a `ChangeEventDetails<CalendarChangeReason>` second argument (reasons: `cell-press`, `cell-keydown`, `view-drill`, `view-trigger`, `page-navigation`, `focus-navigation`; `escape-key` on ranges) and are preceded by a cancellable `beforeUpdate:*` emit.

```vue
<MonthPickerRoot v-slot="{ grid }"> <!-- [!code --] -->
  <MonthPickerGrid> <!-- [!code --] -->
    <MonthPickerGridBody> <!-- [!code --] -->
      <MonthPickerGridRow v-for="(row, i) in grid.rows" :key="i"> <!-- [!code --] -->
        <MonthPickerCell v-for="month in row" :key="month.toString()" :date="month"> <!-- [!code --] -->
          <MonthPickerCellTrigger :month="month" /> <!-- [!code --] -->
<CalendarRoot v-slot="{ grid }" granularity="month"> <!-- [!code ++] -->
  <CalendarGrid v-for="page in grid" :key="page.value.toString()" :value="page.value"> <!-- [!code ++] -->
    <CalendarGridBody> <!-- [!code ++] -->
      <CalendarGridRow v-for="(row, i) in page.rows" :key="i"> <!-- [!code ++] -->
        <CalendarCell v-for="month in row" :key="month.toString()" :value="month"> <!-- [!code ++] -->
          <CalendarCellTrigger :value="month" /> <!-- [!code ++] -->
```
