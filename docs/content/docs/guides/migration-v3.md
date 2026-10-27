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

Converted so far: `SwitchRoot`, `TabsRoot`, `Toggle`, `ToggleGroupRoot`, `CheckboxRoot`, `CheckboxGroupRoot`, `RadioGroupRoot`, `ListboxRoot`, `AccordionRoot` (`modelValue`), `DropdownMenuRoot`, `DropdownMenuSub`, `ContextMenuRoot`, `ContextMenuSub`, `MenubarRoot` (`modelValue`), `MenubarSub`, `DialogRoot`, `AlertDialogRoot`, `PopoverRoot`, `TooltipRoot`, `HoverCardRoot`, `CollapsibleRoot`, `DatePickerRoot` and `DateRangePickerRoot` (`open`, `view`), `CalendarRoot` and `RangeCalendarRoot` (`modelValue`, `placeholder`, `view`), `ColorAreaRoot`, `ColorFieldRoot`, `ColorSliderRoot` and `ColorSwatchPickerRoot` (`modelValue`), and `ComboboxRoot` and `AutocompleteRoot` (`modelValue`, `open`). The remaining families follow as they move to their headless composables.

`DrawerRoot` keeps the contract it was ported with from Base UI. Its `update:open` already carried `(value, details)` and still fires before the change, so `details.cancel()` inside `update:open` keeps the drawer as it is. It has no `beforeUpdate:open`, and `update:snapPoint` stays single-argument.

A change to a value that is already current no longer emits: `update:modelValue` fires only when the value actually changes, so re-pressing the checked radio or the selected single-mode toggle emits nothing (the `select` event on `RadioGroupItem` still fires). A multiple selection follows the same rule, compared entry by entry: a `ListboxRoot` with `multiple` and `selection-behavior="replace"` no longer emits a fresh `[value]` array when the selected item is pressed again.

`ColorAreaRoot` now emits `change`, which v2 declared but never fired, on every pointer move and arrow-key step that changes the color. It also emits `changeEnd` after each keyboard step, not only when the pointer is released. A listener on either event that assumed it never fired, or fired only once per drag, runs more often. Both events carry a `Color` object, see [Color values are `Color` objects](#color-values-are-color-objects).

Each family exports its reason union, for example `DialogOpenChangeReason` (`'trigger-press' | 'close-press' | 'escape-key' | 'outside-press' | 'focus-outside'`), `TooltipOpenChangeReason` (`'trigger-hover' | 'trigger-leave' | 'trigger-focus' | 'trigger-blur' | 'trigger-press' | 'content-leave' | 'escape-key' | 'outside-press'`) or `ListboxChangeReason` (`'item-press' | 'item-keydown' | 'select-all' | 'range-select'` — an Enter selection synthesizes a click on the highlighted item, so it reports `'item-press'`). `ComboboxChangeReason` is `'clear-press'` (`ComboboxCancel` with `reset-model-value-on-clear`) plus the `ListboxChangeReason` members (`'item-press'` for a click or Enter on an item, and `'item-keydown'`, `'select-all'`, `'range-select'` in a `multiple` combobox), `AutocompleteChangeReason` adds `'input-change'` for typed text, and both roots report `open` changes as `ComboboxOpenChangeReason` (`'trigger-press' | 'input-change' | 'input-press' | 'input-focus' | 'list-navigation' | 'item-press' | 'escape-key' | 'outside-press' | 'focus-outside'`). `AccordionChangeReason` and `CollapsibleChangeReason` are both `'trigger-press' | 'content-found'`, where `content-found` is the browser's find-in-page revealing content kept in the DOM with `:unmount-on-hide="false"`. Those unions only list the interaction reasons: `details.reason` is typed as the family union plus the shared `BaseChangeReason`, so every family also reports `'imperative-action'` for programmatic changes such as the slot's `close()`, and a `switch` written against the family union alone misses it. A delayed hover open on Tooltip and HoverCard reports `trigger-hover` with the pointer event that armed the timer.

Wrapper families reuse the union of the family they wrap. `AlertDialogOpenChangeReason` is `DialogOpenChangeReason`. `DropdownMenuOpenChangeReason`, `ContextMenuOpenChangeReason` and `MenubarChangeReason` are `MenuOpenChangeReason` (`'trigger-press' | 'trigger-hover' | 'item-press' | 'list-navigation' | 'sibling-open' | 'escape-key' | 'outside-press' | 'focus-outside'`). On `MenubarRoot`:

- a press or Enter, Space or ArrowDown on a trigger reports `trigger-press`;
- moving the pointer to another trigger while a menu is open reports `trigger-hover`;
- ArrowLeft or ArrowRight inside a menu reports `list-navigation`;
- a close reports the menu's reason (`item-press`, `escape-key`, `outside-press` or `focus-outside`).

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

The ids Reka UI generates for overlay parts are now derived from the root. This covers the Dialog and AlertDialog content, title and description, the Drawer content, title and description, the Popover trigger and content, the DropdownMenu trigger and content, and the Tooltip label that the trigger's `aria-describedby` points at. Their shape differs from v2, for example `reka-tooltip-<n>-content` instead of `reka-tooltip-content-<n>`. A `MenubarMenu` now allocates its content id when the menu is set up instead of when its content first renders.

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

Keyboard navigation in `ListboxContent`, `ListboxFilter`, `ComboboxInput` and `AutocompleteInput` now goes through one intent resolution. Most keys behave as before; these changed:

- **PageUp / PageDown** move the highlight to the first / last item and prevent the browser default, in `ListboxContent` and in the filter input. In v2 neither handled them, so they scrolled the listbox container (or the page).
- **Arrow keys while a filter has focus.** ArrowLeft and ArrowRight always stay with the text input (caret movement, Shift selection), even in a `horizontal` listbox. ArrowUp, ArrowDown, Home and End still move the highlight from the filter. `ListboxContent` no longer prevents the default of arrow keys while a filter owns the keyboard.
- **Typeahead** no longer receives navigation keys. In v2 an arrow or Home/End press was also appended to the typeahead search.

Two additions come with it:

- `getNavigationIntent` on `ListboxRoot` decides what a keydown means. Return `'first' | 'last' | 'prev' | 'next'` to move, `'select'` to select the highlighted item as Enter does, `null` to opt the key out (for Enter this also skips the selection), or `undefined` to keep the default mapping. Use it for command-palette keys such as Ctrl+N / Ctrl+P. The filter input never hands it unmodified printable keys, so typing is never swallowed. Space on a focused item already selects that item, and a `'select'` intent for Space does not select it a second time. `ComboboxRoot` and `AutocompleteRoot` accept it too: there a `'next'` or `'prev'` intent also opens a closed popup, as ArrowDown and ArrowUp do.
- `textValue` on `ListboxItem` sets the text the root's label registry records for the item, and defaults to the item's text content. Set it when the visible content is not plain text (an icon, a component that updates on its own).

The `update:modelValue` and `beforeUpdate:modelValue` events of `ListboxRoot` are now typed as `T | T[] | undefined`: an array with `multiple`, and `undefined` when a single selection is cleared. A handler typed for a single `T` may need widening; the runtime payload is unchanged.

## Listbox filtering

`ListboxRoot` has a new, opt-in `filter` prop. Nothing changes until you pass one: without it (or with `null`) the listbox filters nothing, and a list you already filter by hand from the `ListboxFilter` value keeps working as in v2. With a filter function, for example `contains` from `useFilter({ sensitivity: 'base' })`, items whose text does not match the `ListboxFilter` value are not rendered, a group whose items all fail to match is hidden, and keyboard navigation, typeahead and select-all only see the matching items. In a `ListboxVirtualizer`, the filter runs over `options` (matching `textContent(option)`), so a filtered-out option takes no virtual index. See [Filtering](../components/listbox#filtering). `ComboboxRoot` and `AutocompleteRoot` filter through the same mechanism, on by default; see [Combobox and Autocomplete filtering](#combobox-and-autocomplete-filtering).

## Combobox and Autocomplete filtering

`ComboboxRoot` and `AutocompleteRoot` have a `filter` prop and run it through the shared Listbox filter. Without it they match items with `useFilter`'s `contains` (case and accent insensitive), as in v2. Pass a function `(text, search, value) => boolean` to change how items match, or `null` to turn client filtering off. `ignoreFilter` still works but is deprecated: it is an alias for `:filter="null"` and wins over `filter`.

```vue
<ComboboxRoot ignore-filter /> <!-- [!code --] -->

<ComboboxRoot :filter="null" /> <!-- [!code ++] -->
```

What changed:

- **A virtualized combobox now filters.** In v2 `ComboboxVirtualizer` turned filtering off, so its `options` had to be filtered by hand. The root's filter now runs over `options`, matching `textContent(option)` or, without `text-content`, the option's string form. A list you still filter yourself keeps working when the two agree, but an object option without `text-content` stringifies to `[object Object]` and never matches. Set `:filter="null"` on a virtualized combobox you filter yourself, or drop your own filtering and pass the full list with `text-content`.
- **A filtered-out item stays mounted** and renders nothing, instead of being unmounted. Its slot content keeps its state, and the item keeps its entry in the label registry. A group whose items all fail to match stays mounted with `hidden`, as in v2.
- **`filtered`** on the root's template ref is now `{ search, active, count }`, the Listbox filter state. The v2 `{ count, items, groups }` maps were keyed by internal item ids; use `count` for an empty state.

## Combobox and Autocomplete roots

`ComboboxRoot` and `AutocompleteRoot` are built on `useComboboxRoot()` and no longer render a `ListboxRoot` component inside. The DOM is the same: the root still renders one element, which receives your attributes.

- **One context.** The root provides one object as both the Combobox and the Listbox root context, so `injectListboxRootContext()` inside a combobox returns the same object as `injectComboboxRootContext()`. Custom parts built on `injectComboboxRootContext()`: `allItems`, `allGroups` and `ignoreFilter` are gone (use `filterState.value.count` and `filter.value === null`), `filterState` is `{ search, active, count }`, `onOpenChange(value, reason?, event?)` returns a boolean instead of a promise, `highlightedElement` holds `null` instead of `undefined` when nothing is highlighted, and assigning `modelValue.value` still works but reports `'imperative-action'`. Use `setModelValue(value, reason?, event?)` to pass a reason. On `injectAutocompleteRootContext()`, `modelValue` is read-only; call `onModelValueChange(value, reason?, event?)`.
- **Content ids** derive from the root's id: `reka-combobox-v-0-content` instead of `reka-combobox-content-v-1`, and `reka-autocomplete-v-0-content` for Autocomplete. The input's and the trigger's `aria-controls` point at it from the first render; in v2 they stayed empty until the content first mounted. Selectors and snapshots that hard-code the old ids need updating.
- **`ComboboxInput` and `AutocompleteInput` render the input themselves** instead of wrapping `ListboxFilter`. The rendered `<input>` and its attributes are unchanged. Tests that look up `ListboxRoot` or `ListboxFilter` with `findComponent` inside a combobox no longer find them.
- **`update:modelValue` is typed by `multiple`**: `T[]` when `multiple` is set, `T | null` when it is absent (`ComboboxCancel` with `reset-model-value-on-clear` emits `null`), either while it is a plain `boolean`. The runtime payload is unchanged.
- **New:** `displayValue` on `ComboboxRoot` sets the input text for the selected value when `ComboboxInput` has no `displayValue` of its own. On `AutocompleteRoot` it sets the text a selected item writes into the value.

## Color values are `Color` objects

`ColorAreaRoot`, `ColorFieldRoot` and `ColorSliderRoot` now emit a `Color` object instead of a hex string. A `Color` is a plain object in one color space, such as `{ space: 'hsl', h: 217, s: 91, l: 60, alpha: 1 }`. Each component emits it in the space it edits: the `colorSpace` prop, or the space that holds the edited channel (`rgb` for `red`, `hsb` for `brightness`). The hex string could not hold the hue of a grey or anything finer than one 8-bit step, so v2 kept that precision in hidden internal state; in v3 the emitted value carries it, and components that share one `v-model` no longer drift.

What changed:

- `update:modelValue`, `beforeUpdate:modelValue`, `change` and `changeEnd` carry a `Color`. `update:color` is unchanged and carries the same `Color` as `update:modelValue`.
- `modelValue` and `defaultValue` still accept a color string, so `v-model` on a `ref('#3b82f6')` keeps working, but after the first change the ref holds a `Color`. Code that uses the bound value as a string (template text, a CSS `background`, a string comparison, an API payload) must format it.
- The new `update:hex` event (and `onHexUpdate` on the composables) emits the hex string after each change. It is lossy, so do not feed it back into `v-model` when you need the hue of greys to survive. Forms still submit hex through the hidden input.
- An update fires only when the color actually changes, compared structurally with `isEqualColor` (now exported). The v2 exception where `ColorAreaRoot` and `ColorSliderRoot` re-emitted an unchanged hex string for a change finer than hex precision is gone: such a change emits a `Color` that differs from the previous one.
- `ColorFieldRoot` now emits `change` and `changeEnd` too, both after each committed change. On every component `changeEnd` fires only when the interaction changed the color and the model holds the result: a drag that returns to its start, or an update a controlled parent rejects, reports nothing. With a controlled `modelValue`, `changeEnd` fires once the parent has applied the update, after it re-renders.
- `ColorAreaRoot` derives its thumb from the model, so a controlled parent that rejects an update keeps the thumb in place. It takes a `dir` prop and inherits the direction from `ConfigProvider`, so under `dir="rtl"` its x axis, arrow keys, thumb and gradient are mirrored.
- Keyboard steps in `ColorAreaRoot` and channel steps in `ColorFieldRoot` snap to the step grid, so a channel at 11.1 steps to 12. A custom `step` on `ColorFieldRoot` snaps to multiples of that step.
- `ColorSwatchPickerRoot` and `ColorSwatchPickerItem` accept a `Color` object as well as a string, and compare values structurally: a model of `'#ff0000'` selects an item whose value is `{ space: 'hsl', h: 0, s: 100, l: 50, alpha: 1 }`. The picker still emits the selected item's value as declared.
- The root contexts expose `color`, `xValue` and `yValue` as read-only computeds.

```vue
<script setup lang="ts">
import type { Color } from 'reka-ui' // [!code ++]
import { ColorAreaArea, ColorAreaRoot, ColorAreaThumb, colorToHex, normalizeColor } from 'reka-ui'
import { computed, ref } from 'vue'

const color = ref('#3b82f6') // [!code --]
const color = ref<string | Color>('#3b82f6') // [!code ++]
const hex = computed(() => colorToHex(normalizeColor(color.value))) // [!code ++]
</script>

<template>
  <ColorAreaRoot v-slot="{ style }" v-model="color">
    <ColorAreaArea :style="style">
      <ColorAreaThumb />
    </ColorAreaArea>
  </ColorAreaRoot>
  <span>{{ color }}</span> <!-- [!code --] -->
  <span>{{ hex }}</span> <!-- [!code ++] -->
</template>
```

If the app stores a hex string and you accept the precision loss, keep the string and update it from `update:hex`: `:model-value="hex" @update:hex="hex = $event"`. `update:hex` follows every model update, and a move finer than one 8-bit step still updates the model, so it can repeat the same string. Compare against the previous value before doing anything costly with it.

The color utilities changed with the model. `convertToHsl` and `convertToHsb` convert between HSL and HSB directly and keep the hue of a grey. The channel and gradient helpers are no longer exported; see [Color utilities removed from the package root](#color-utilities-removed-from-the-package-root). The red, green and blue slider gradients use the color's real channel values for HSL and HSB colors instead of a fixed 128, and `parseColor` accepts `hsv()` as documented.

`ColorSliderTrack`'s gradient now runs from the slider's minimum to its maximum: bottom to top on a vertical slider (top to bottom when it is also `inverted`), and right to left on a horizontal slider when exactly one of `inverted` and right-to-left is set (the direction is inherited from `ConfigProvider`). In v2 it always ran left to right, so it did not match the thumb on those sliders. Remove any CSS that rotated or flipped the track to compensate.

`ColorFieldInput` now validates on commit. When Enter or blur rejects text that does not parse (a color string, or a number with a `channel`), the text still reverts to the current color, and the input gets `aria-invalid="true"` and the input and `ColorFieldRoot` get `data-invalid`. They stay until an edit parses or a later change commits; partial input while typing is never flagged.

## ColorArea exposes one range input per channel

`ColorAreaThumb` now renders two visually hidden `<input type="range">` elements, one per channel, after its slot content. In v2 the thumb was a single `role="slider"` that held only the x channel (the y channel was free text in `aria-valuetext`, and `aria-orientation` was always `horizontal`), and `ColorAreaArea` had `role="application"`.

- Each input is named after its channel ("Saturation", "Lightness"), has its own value, `min`, `max` and `aria-orientation` (`horizontal` for x, `vertical` for y), and reports the other channel as context in `aria-valuetext` ("50, Lightness 40").
- Focus goes to the inputs, not the thumb. One input is in the tab order; an arrow key moves focus to the input of the axis it changes. Pointer, keyboard and right-to-left behaviour are unchanged.
- `ColorAreaThumb` no longer has `role`, `tabindex`, `aria-label`, `aria-valuenow`, `aria-valuetext`, `aria-roledescription` or `aria-orientation`. `ColorAreaArea` no longer has `role`, `aria-roledescription` or `aria-disabled`; `ColorAreaRoot` keeps `aria-disabled`, and every part keeps `data-disabled`.
- Focus styles on the thumb (`:focus`, `focus:`) never match now. Use `:focus-within` / `focus-within:` on the thumb or the area, or `:has(:focus-visible)` for keyboard focus only. With `<ColorAreaThumb as-child>` the inputs render next to your element (placed at the thumb's position), not inside it, so put the focus style on `ColorAreaArea`.
- Enter on a channel input does not submit an enclosing form, as with the v2 thumb.
- Tests that find the thumb with `getByRole('slider')` find two sliders now: select one by name (`getByRole('slider', { name: 'Saturation' })`). Tests that read the y value from the thumb's `aria-valuetext` read the y input's value instead.
- With `useColorArea()` directly, render the new `xInput` and `yInput` surfaces as `<input>` elements in the thumb and bind them with `setInputElement('x' | 'y', el)`. The thumb surface no longer carries the ARIA slider attributes.

```vue
<style>
.ColorAreaThumb:focus { /* [!code --] */
.ColorAreaThumb:focus-within { /* [!code ++] */
  outline: 2px solid black;
}
</style>
```

## Color utilities removed from the package root

The package root now exports the color utilities an app needs to work with the `Color` model: `parseColor`, `normalizeColor`, `isValidColor`, `isEqualColor`, `colorToHex`, `colorToString`, `convertToRgb`, `convertToHsl`, `convertToHsb` and the `Color`, `RGBColor`, `HSLColor`, `HSBColor`, `ColorSpace`, `ColorChannel` and `ColorFormat` types. The channel and gradient helpers the Color components use internally are no longer exported:

| Removed | Replacement |
| --- | --- |
| `colorToRgb(color)`, `colorToHsl(color)`, `colorToHsb(color)` | `colorToString(color, 'rgb')`, `colorToString(color, 'hsl')`, `colorToString(color, 'hsb')` |
| `getChannelValue(color, channel)` | The property of the converted color: `hue` → `convertToHsl(color).h`, `saturation` → `convertToHsl(color).s` (or `convertToHsb(color).s` for an HSB color), `lightness` → `convertToHsl(color).l`, `brightness` → `convertToHsb(color).b`, `red`/`green`/`blue` → `convertToRgb(color).r`/`.g`/`.b`, `alpha` → `color.alpha * 100` |
| `setChannelValue(color, 'hue', 120)`, `setChannelValues(color, [...])` | Spread the converted color: `{ ...convertToHsl(color), h: 120 }` |
| `getChannelRange(channel)` | The fixed ranges: hue 0 to 360; saturation, lightness, brightness and alpha 0 to 100 (alpha is stored 0 to 1 on the `Color`); red, green and blue 0 to 255. All step by 1 |
| `getChannelName(channel)` | Your own (localized) label for the channel |
| `getAreaBackgroundStyle`, `getAreaGradient` | The `style` slot prop of `ColorAreaRoot`, bound to `ColorAreaArea` |
| `getSliderBackgroundStyle`, `getSliderGradient` | `ColorSliderTrack`, which sets the gradient for its channel and layout |

```ts
import { convertToHsl } from 'reka-ui' // was: import { getChannelValue, setChannelValue } from 'reka-ui'

const hue = getChannelValue(color, 'hue') // [!code --]
const hue = convertToHsl(color).h // [!code ++]
const shifted = setChannelValue(color, 'hue', hue + 30) // [!code --]
const shifted = { ...convertToHsl(color), h: (hue + 30) % 360 } // [!code ++]
```

## Template refs on parts

A template ref on a part now exposes the part's element and its documented methods, and nothing else. Every part exposes `element` and `$el`, both reading the same reactive ref to its rendered DOM element, next to the methods listed in its API reference. See [the element-first ref contract](../utilities/use-forward-expose#the-element-first-ref-contract).

What changed:

- **`$el` needs no migration.** `partRef.value.$el` still returns the part's element. It is now reactive: a `computed` that reads it re-runs when the part's root element changes (a `v-if`, an `as` change, an `asChild` child swap). In v2 it was a snapshot that could point at a removed element. `partRef.value.element` returns the same element.
- **`element` is `null` when the part renders no element** (a closed `DialogContent`, an unmounted `PopoverContent`). `$el` then falls back to the placeholder comment node Vue renders, as in v2, so VueUse's `unrefElement(partRef)` and `useEventListener(partRef, …)` receive a node and never the component itself. Check `element` when you need to know whether the part is rendered.
- **Props are no longer readable from a part ref.** In v2, `partRef.value.disabled` or `partRef.value.modelValue` returned the part's prop value. This was never documented and is now `undefined`. Read the value from the state you pass to the part. In development, the first such read logs a warning that names the part and the prop.
- **Methods are no longer forwarded through `as` / `asChild`.** In v2, when a part rendered your component through `as` or `asChild`, the methods your component exposed were also reachable on the part's ref. Put a ref on your own component to call them. The methods a part documents (`validate`, `scrollTop`, `highlightItem`, …) are unchanged.
- **Components passed to `asChild` should expose `element`.** A component with a single root element works without changes. A component with several root nodes, a root that changes with `v-if`, or a target on an inner element should call `useForwardElement()` and `defineExpose(expose)`, and bind `forwardRef` on the element the part should target. Without it, Reka UI falls back to the component's `$el`, which Vue does not keep up to date.
- **`useForwardExpose` is deprecated.** It keeps its v2 behavior and logs a one-time warning in development. Replace it with `useForwardElement`, imported from `reka-ui`:

```vue
<script setup lang="ts">
import { useForwardElement } from 'reka-ui'

const { forwardRef } = useForwardExpose() // [!code --]
const { forwardRef, expose } = useForwardElement() // [!code ++]
defineExpose(expose) // [!code ++]
</script>
```

If the component already calls `defineExpose({ ... })`, wrap the object in `mergeExpose(expose, { ... })`.

## Modal layers no longer touch `<body>`

Modal overlays follow [Base UI](https://base-ui.com)'s model in v3. A modal layer (a modal `Dialog`, `AlertDialog`, `Drawer`, `Popover`, `DropdownMenu` or `ContextMenu`, an open `Select`, and any content with `disableOutsidePointerEvents`) no longer sets `pointer-events: none` on `<body>`, and the page scroll lock no longer adds `padding-right` or a `--scrollbar-width` variable.

### Outside pointer interaction

The page is now blocked by a transparent internal backdrop that the layer renders right below itself: a `position: fixed` `<div data-reka-internal-backdrop role="presentation">` covering the viewport. It takes the `z-index` of the layer (of its positioning wrapper for floating content, or of the fixed container around a scrollable dialog), so it covers page content with a lower `z-index`, such as a sticky header. A press on it is an outside press, so it closes the layer, as before. `<body>` keeps its own `pointer-events`. A non-portaled layer inside an element that contains fixed elements (`transform`, `filter`, `backdrop-filter`, `contain: paint`, `will-change: transform`) gets its backdrop in `<body>` instead, with a hole over the layer.

- **Only content above the layer's own `z-index` stays interactive.** An element in the root stacking context whose `z-index` is higher than the layer's (a chat launcher or a cookie banner at `z-index: 2147483647`, a toast viewport above your overlays) can be clicked while a modal layer is open. Page content at or below the layer's `z-index` is covered, as in v2. In v2 the whole page was unclickable, whatever its `z-index`.
- **A modal `Dialog` or `Drawer` closes only on its own backdrop.** A press on the internal backdrop, on `DialogOverlay` / `DrawerOverlay`, or on a container around the content closes it; a press on an element stacked above the backdrop does not. Popovers and menus close on any outside press, as before.
- **A modal `Popover` or `DropdownMenu` keeps its trigger reachable.** The trigger is cut out of the backdrop, so pressing it toggles the layer closed instead of hitting the backdrop. The `ContextMenu` trigger area and the `Combobox` input are cut out in the same way.
- **Layers below a modal layer stay inert.** A non-modal popover that is open under a modal dialog still gets `pointer-events: none` (and so does its positioning wrapper) until the dialog closes, whatever its `z-index`.

What to check in your code:

- **Styles or tests that read `body.style.pointerEvents`.** Nothing sets it any more. To detect an open modal layer, query `[data-reka-internal-backdrop]`, or check the component's `data-state="open"`. A test that asserted `document.body.style.pointerEvents === 'none'` now asserts that the backdrop exists.
- **Workarounds that restored `pointer-events: auto`** on `<body>` or on a third-party widget so it stayed clickable next to a dialog: remove them. If the widget sits *below* the backdrop in the stacking order, give it a higher `z-index` than your overlay content.
- **Tests that click an arbitrary element to dismiss a modal `Dialog`.** Press the overlay, the backdrop (`[data-reka-internal-backdrop]`) or `document.body` instead. In a real browser, a click "on" an element under a modal layer lands on the backdrop; with Playwright, pass `force: true` to click through the actionability check.
- **CSS that targets the overlay's direct sibling** (`.overlay + .content`): the backdrop now sits between them. Use `~` or a class.
- **Page chrome with a higher `z-index` than your overlays.** A sticky header at `z-index: 50` stays clickable over a dialog whose content has `z-index: 10`. As Base UI recommends, give your app root its own stacking context, so nothing inside it can rise above overlays portaled to `<body>`:

  ```css
  #app {
    isolation: isolate;
  }
  ```

### Page scroll lock

`useBodyScrollLock` (and every modal layer that uses it) is now an overflow-based lock ported from Base UI's `useScrollLock`:

- It hides the overflow of the element that scrolls the page (`<html>` when it is its own scroll container, `<body>` otherwise) instead of always `<body>`, and restores the original inline styles exactly when the last lock releases.
- It keeps the layout from shifting with `scrollbar-gutter: stable`. Where that is unsupported it pins `<body>`'s size and sets `data-reka-scroll-locked` on `<html>` instead. With overlay scrollbars (macOS, mobile) and on iOS it only hides the overflow. It never adds `padding-right` to `<body>`, never sets `--scrollbar-width` on `<html>`, and no longer intercepts `touchmove` on iOS.
- Nested and stacked overlays share one reference-counted lock. It applies and releases a macrotask after the change, so a hand-off between two overlays in the same tick does not unlock in between, and it waits for a lock that another library still holds instead of saving it as the page's original state.
- The lock only engages once the component has mounted, so server rendering never touches the page.
- A modal `Dialog`, `AlertDialog` or `Drawer` locks scroll whenever it is open, with or without an overlay part. In v2 only `DialogOverlay` / `DrawerOverlay` locked it, so a modal dialog without an overlay left the page scrollable and a `Drawer` with `modal="trap-focus"` and an overlay locked it. A `Drawer` with `modal="trap-focus"` no longer locks scroll.

What to check in your code:

- **`var(--scrollbar-width)`** in your styles: the variable is gone. Fixed-position elements no longer need the compensation that the variable fed, because the gutter stays reserved. Remove the `padding-right: var(--scrollbar-width)` / `right: var(--scrollbar-width)` rules.
- **Styles or tests that read `body.style.overflow` or `body.style.paddingRight`** while an overlay is open: read `getComputedStyle(document.body).overflowY` (or the `<html>` one when `<html>` scrolls), and expect no padding. In tests, the lock applies a macrotask after the overlay opens: wait with `vi.waitFor` or a short timeout before asserting.
- **`ConfigProvider`'s `scrollBody`**: `true` (the default) uses the behaviour above. `false` only hides the overflow, as before. `{ padding, margin }` still offsets `<body>` by the given amounts (`true` meaning the scrollbar width) and is the escape hatch if your layout relied on the v2 padding.
- **A modal dialog that should leave the page scrollable**: set `:modal="false"` (or `modal="trap-focus"` on a `Drawer`). Omitting the overlay no longer does it.

### `modal` defaults

The defaults already match Base UI and do not change: `Dialog`, `AlertDialog`, `Drawer`, `DropdownMenu` and `ContextMenu` are modal, `Popover` is not, `Select` locks scroll and blocks outside pointer events (`bodyLock` and `disableOutsidePointerEvents` default to `true`) and `Combobox` does neither. `Menubar` menus stay non-modal.

## Menu wrapper contexts

These changes only affect custom parts and tests built on the contexts the menu wrappers provide. Components used through their props, events and `v-model` work as before.

- **Menubar root context.** On `injectMenubarRootContext()`, `modelValue` is now a readonly ref: assigning `modelValue.value` no longer opens or closes a menu. Call `onMenuOpen(value)`, `onMenuClose()` or `onMenuToggle(value)` instead. Each one accepts an optional reason and native event, and returns `false` when the change was cancelled or did not change the value.
- **`MenubarRoot` emit type.** `update:modelValue` is typed `[value: string, details: ChangeEventDetails<MenubarChangeReason>]`. v2 declared it as `[value: boolean]`, although the payload was always the open menu's value (`''` when every menu is closed). A wrapper that re-declares the emit needs the new tuple.
- **No inner `MenuRoot`.** `DropdownMenuRoot`, `ContextMenuRoot` and `MenubarMenu` provide the Menu contexts themselves, through `useDropdownMenu()`, `useContextMenu()` and `useMenubarMenu()`. A test that looked up a `MenuRoot` component under them finds nothing; assert on the wrapper root's events instead.
- **Dropdown ids are set by the root.** The `DropdownMenuRoot` context fills in `triggerId` and `contentId` up front, so a custom trigger or content that assigned them keeps the root's ids. Pass `id` to the part if you need a specific one.
