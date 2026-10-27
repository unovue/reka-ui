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

Converted so far: `SwitchRoot`, `TabsRoot`, `Toggle`, `ToggleGroupRoot`, `CheckboxRoot`, `CheckboxGroupRoot`, `RadioGroupRoot`, `ListboxRoot`, `AccordionRoot` (`modelValue`), `DropdownMenuRoot`, `DropdownMenuSub`, `ContextMenuRoot`, `ContextMenuSub`, `MenubarSub`, `DialogRoot`, `AlertDialogRoot`, `PopoverRoot`, `TooltipRoot`, `HoverCardRoot`, `CollapsibleRoot`, `DatePickerRoot` and `DateRangePickerRoot` (`open`, `view`), `CalendarRoot` and `RangeCalendarRoot` (`modelValue`, `placeholder`, `view`), and `ColorAreaRoot`, `ColorFieldRoot`, `ColorSliderRoot` and `ColorSwatchPickerRoot` (`modelValue`). The remaining families follow as they move to their headless composables.

A change to a value that is already current no longer emits: `update:modelValue` fires only when the value actually changes, so re-pressing the checked radio or the selected single-mode toggle emits nothing (the `select` event on `RadioGroupItem` still fires). A multiple selection follows the same rule, compared entry by entry: a `ListboxRoot` with `multiple` and `selection-behavior="replace"` no longer emits a fresh `[value]` array when the selected item is pressed again.

`ColorAreaRoot` and `ColorSliderRoot` are a known exception until the color model changes from a hex string to a `Color` object ([#2789](https://github.com/unovue/reka-ui/issues/2789)). A change finer than hex precision, such as moving the hue of a grey or a fractional step, still emits `beforeUpdate:modelValue` and `update:modelValue` with the same hex string as before, so that `update:color` can report the precise `Color`. Compare the hex value yourself if a listener must ignore those repeats.

`ColorAreaRoot` now emits `change`, which v2 declared but never fired, with the hex value on every pointer move and arrow-key step that changes the color. It also emits `changeEnd` after each keyboard step, not only when the pointer is released. A listener on either event that assumed it never fired, or fired only once per drag, runs more often.

Each family exports its reason union, for example `DialogOpenChangeReason` (`'trigger-press' | 'close-press' | 'escape-key' | 'outside-press' | 'focus-outside'`), `TooltipOpenChangeReason` (`'trigger-hover' | 'trigger-leave' | 'trigger-focus' | 'trigger-blur' | 'trigger-press' | 'content-leave' | 'escape-key' | 'outside-press'`) or `ListboxChangeReason` (`'item-press' | 'item-keydown' | 'select-all' | 'range-select'` — an Enter selection synthesizes a click on the highlighted item, so it reports `'item-press'`). `AccordionChangeReason` and `CollapsibleChangeReason` are both `'trigger-press' | 'content-found'`, where `content-found` is the browser's find-in-page revealing content kept in the DOM with `:unmount-on-hide="false"`. Those unions only list the interaction reasons: `details.reason` is typed as the family union plus the shared `BaseChangeReason`, so every family also reports `'imperative-action'` for programmatic changes such as the slot's `close()`, and a `switch` written against the family union alone misses it. A delayed hover open on Tooltip and HoverCard reports `trigger-hover` with the pointer event that armed the timer.

What to check in your code:

- Explicit `@update:open` / `@update:model-value` listeners receive an extra argument. Handlers that only read the first argument keep working; handlers typed with a single-parameter signature still type-check.
- Custom parts built on `injectAccordionRootContext()` or `injectCollapsibleRootContext()`: the Accordion root context's `modelValue` is now a readonly `ComputedRef`, so call `changeModelValue` instead of assigning it, and `changeModelValue(value, reason?, event?)` now takes an optional reason and native event and returns a boolean (`false` when the change was cancelled or did not change the value). On the Collapsible root context, `onOpenToggle(event?)` accepts the native event, `onContentFound(event)` is new, and `contentId` is backed by a ref, so assigning it also updates the trigger's `aria-controls`.
- Wrappers that re-declare the emit types need the new tuple shape:

  ```ts
  type Emits = {
    'update:open': [value: boolean] // [!code --]
    'update:open': [value: boolean, details: ChangeEventDetails<DialogOpenChangeReason>] // [!code ++]
  }
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

## ESM only

v3 ships ES modules only. The CommonJS build and the `require` export conditions are gone, so `require('reka-ui')` no longer resolves.

What to check in your code:

- Replace `require()` calls with `import`, or with a dynamic `import()` inside files that must stay CommonJS.
- Vite, Nuxt and Vitest need no change.
- Jest needs ESM support for the package: run Jest in ESM mode, or let it transform `reka-ui` by excluding it from `transformIgnorePatterns`.

## Generated ids

The ids Reka UI generates for overlay parts are now derived from the root. This covers the Dialog content, title and description, the Popover trigger and content, and the Tooltip label that the trigger's `aria-describedby` points at. Their shape differs from v2, for example `reka-tooltip-<n>-content` instead of `reka-tooltip-content-<n>`.

Only code that hard-coded the shape of a generated id is affected. In tests, select by role, label or text, or compare the attribute with the id read from the other element. In CSS, style by data attribute or class. An `id` you pass to a part yourself is unchanged.

## Disabled triggers rendered `asChild`

A disabled `Toggle`, `ToggleGroupItem` or `CheckboxRoot` now ignores a user click even when it renders `asChild` onto an element that has no native `disabled` behaviour, such as a `div` or a link. In v2 only the native `disabled` attribute blocked the click, so those elements still toggled.

If you relied on a disabled `asChild` control still reacting to clicks, drop `disabled` and express the state another way. Programmatic changes through the composables (`toggle()`, `setChecked()`) are not guarded by `disabled`.

## Calendar views

`MonthPicker`, `MonthRangePicker`, `YearPicker` and `YearRangePicker` are gone. `Calendar` and `RangeCalendar` now carry a `view` (`day` | `month` | `year`, bindable as `v-model:view`) and a `granularity` that fixes what a selection means. A month picker is `<CalendarRoot granularity="month">`, a year range picker is `<RangeCalendarRoot granularity="year">`, and a day calendar can drill up to its month and year grids through the new `CalendarView` / `CalendarViewTrigger` parts (and their `RangeCalendar*`, `DatePicker*`, `DateRangePicker*` equivalents). Selecting a cell in a view coarser than the granularity moves the placeholder and drills down; selecting at the granularity commits.

| v2 | v3 |
| --- | --- |
| `MonthPickerRoot` | `CalendarRoot granularity="month"` |
| `YearPickerRoot` | `CalendarRoot granularity="year"` |
| `MonthRangePickerRoot`, `YearRangePickerRoot` | `RangeCalendarRoot granularity="month"` / `"year"` |
| `MonthPicker<Part>`, `YearPicker<Part>` | `Calendar<Part>` |
| `MonthRangePicker<Part>`, `YearRangePicker<Part>` | `RangeCalendar<Part>` |
| `isMonthDisabled`, `isYearDisabled` | `isDateDisabled` (called only for cells at the `granularity`, with that unit as its second argument) |
| `isMonthUnavailable`, `isYearUnavailable` | `isDateUnavailable` |
| `maximumMonths`, `maximumYears` | `maximumLength` (counted in units of `granularity`; `maximumDays` remains as a deprecated alias) |
| `CalendarCell :date`, `RangeCalendarCell :date` | `:value` |
| `CalendarCellTrigger :day :month`, `RangeCalendarCellTrigger :day :month` | `CalendarCellTrigger :value` + `CalendarGrid :value="page.value"` |
| `MonthPickerCellTrigger :month`, `YearPickerCellTrigger :year` | `CalendarCellTrigger :value` |
| cell trigger slot `dayValue` / `monthValue` / `yearValue` | `cellValue` |
| `grid` slot prop as a single object (month and year pickers) | `grid` is always an array of pages; iterate it |
| `nextPage` / `prevPage` `(placeholder) => DateValue` | unchanged signature, with the view as an additive second argument; the root function is used only in the `granularity` view |
| `data-selected="true"`, `data-selection-start="true"` … | emitted as empty strings; presence selectors (`[data-selected]`, `data-[selected]:`) are unaffected |

The `DatePicker` and `DateRangePicker` roots forward `view`, `defaultView`, `maxView`, `yearsPerPage` and `columns` and emit `beforeUpdate:view` / `update:view` with the calendar's change details; they do not expose the calendar `granularity` (that name already belongs to the field's time granularity, and a field edits full dates), so month or year pickers use `Calendar` / `RangeCalendar` directly.

Every `CalendarGrid` (and `RangeCalendarGrid`, `DatePickerGrid`, `DateRangePickerGrid`) in the day view needs the page it renders as `:value="page.value"`. The cell triggers no longer receive the month themselves, so a grid without `value` cannot mark the leading and trailing days of the neighbouring months as `data-outside-view`.

Type and import names follow the same mapping as the parts: `MonthPickerRootProps` becomes `CalendarRootProps`, `YearRangePickerRootEmits` becomes `RangeCalendarRootEmits`, and so on. The namespaced `MonthPicker.*`, `MonthRangePicker.*`, `YearPicker.*` and `YearRangePicker.*` objects from `reka-ui/namespaced` are gone too; use `Calendar.*` and `RangeCalendar.*`.

The keyboard shortcuts are unchanged: in the day view Home / End move within the week, PageUp / PageDown by a month and Shift+PageUp / Shift+PageDown by a year; in the month and year views PageUp / PageDown move by a page, as they did in the month and year pickers.

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

### Matchers and paging apply at the granularity

`isDateDisabled` and `isDateUnavailable` are called only for cells at the `granularity`: day cells in a day calendar, month cells in a `granularity="month"` calendar. The views coarser than the granularity are navigation. Their cells are disabled only by `minValue`, `maxValue` and `disabled`, they never call your matchers, and they show no selection state. So a day matcher such as `isWeekend` keeps working once you add views: it does not disable a month because the 1st of that month is a Sunday. In the same way, a `nextPage` / `prevPage` function on the root is used only in the `granularity` view, and the month and year views page by a year and by `yearsPerPage`. A `nextPage` / `prevPage` on a `CalendarNext` / `CalendarPrev` part applies in every view; place the part inside a `CalendarView` to limit it to one view.

### Adding views to a day calendar

The views are optional, and a calendar without them is unchanged. To let users drill up from the days to the months and years, wrap each grid in a `CalendarView`, move the `v-slot` from the root to each `CalendarView` (its slot passes the `grid` of that view), and replace `CalendarHeading` with a `CalendarViewTrigger`. If you built your own switcher around a `Calendar` and a `MonthPicker` / `YearPicker` with `v-if`, this replaces it. The [view switching example](/examples/date-picker-view-switching) shows a complete calendar.

```vue
<CalendarRoot v-model="date">
  <CalendarHeader>
    <CalendarPrev />
    <CalendarHeading /> <!-- [!code --] -->
    <CalendarViewTrigger /> <!-- [!code ++] -->
    <CalendarNext />
  </CalendarHeader>
  <CalendarView v-slot="{ grid, weekDays }" view="day"> <!-- [!code ++] -->
    <CalendarGrid v-for="month in grid" :key="month.value.toString()" :value="month.value">
      <!-- the existing day grid -->
    </CalendarGrid>
  </CalendarView> <!-- [!code ++] -->
  <CalendarView v-slot="{ grid }" view="month"> <!-- [!code ++] -->
    <CalendarGrid v-for="page in grid" :key="page.value.toString()" :value="page.value"> <!-- [!code ++] -->
      <CalendarGridBody> <!-- [!code ++] -->
        <CalendarGridRow v-for="(row, i) in page.rows" :key="i"> <!-- [!code ++] -->
          <CalendarCell v-for="month in row" :key="month.toString()" :value="month"> <!-- [!code ++] -->
            <CalendarCellTrigger :value="month" /> <!-- [!code ++] -->
          </CalendarCell> <!-- [!code ++] -->
        </CalendarGridRow> <!-- [!code ++] -->
      </CalendarGridBody> <!-- [!code ++] -->
    </CalendarGrid> <!-- [!code ++] -->
  </CalendarView> <!-- [!code ++] -->
  <!-- a third CalendarView with view="year" has the same shape -->
</CalendarRoot>
```

The `CalendarViewTrigger` shows the heading of the active view (`September 2026`, `2026`, `2020 - 2031`) and switches to the next coarser view, up to `maxView`. Selecting a month or year cell drills back down. Bind `v-model:view` to control the view, or set `defaultView` to start on another one.

## `by` comparison functions receive every value

A comparison function passed as `by` (on `ListboxRoot`, `ComboboxRoot` and `SelectRoot`) now runs for every value, strings included. In v2 string values were always compared with `===` and the function was only called for objects, so a case-insensitive `by` never matched string options. A function that assumes objects (`a.id === b.id`) must now guard for strings when the list mixes both. `by` is read once at setup, as before; changing it after mount has no effect.

## Listbox keyboard handling

Keyboard navigation in `ListboxContent` and `ListboxFilter` (which `ComboboxInput` and `AutocompleteInput` render) now goes through one intent resolution. Most keys behave as before; these changed:

- **PageUp / PageDown** move the highlight to the first / last item and prevent the browser default, in `ListboxContent` and in the filter input. In v2 neither handled them, so they scrolled the listbox container (or the page).
- **Arrow keys while a filter has focus.** ArrowLeft and ArrowRight always stay with the text input (caret movement, Shift selection), even in a `horizontal` listbox. ArrowUp, ArrowDown, Home and End still move the highlight from the filter. `ListboxContent` no longer prevents the default of arrow keys while a filter owns the keyboard.
- **Typeahead** no longer receives navigation keys. In v2 an arrow or Home/End press was also appended to the typeahead search.

Two additions come with it:

- `getNavigationIntent` on `ListboxRoot` decides what a keydown means. Return `'first' | 'last' | 'prev' | 'next'` to move, `'select'` to select the highlighted item as Enter does, `null` to opt the key out (for Enter this also skips the selection), or `undefined` to keep the default mapping. Use it for command-palette keys such as Ctrl+N / Ctrl+P. The filter input never hands it unmodified printable keys, so typing is never swallowed. Space on a focused item already selects that item, and a `'select'` intent for Space does not select it a second time. `ComboboxRoot` does not accept it yet.
- `textValue` on `ListboxItem` sets the text the root's label registry records for the item, and defaults to the item's text content. Set it when the visible content is not plain text (an icon, a component that updates on its own).

The `update:modelValue` and `beforeUpdate:modelValue` events of `ListboxRoot` are now typed as `T | T[] | undefined`: an array with `multiple`, and `undefined` when a single selection is cleared. A handler typed for a single `T` may need widening; the runtime payload is unchanged.
