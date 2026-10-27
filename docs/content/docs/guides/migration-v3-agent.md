---
title: Migration - v2 to v3 with an AI agent
description: The v2 to v3 migration guide rewritten as instructions for an AI coding agent. Point your agent at this page and review the diff.
---

# Migration - v2 to v3 with an AI agent

<Description>
The v2 to v3 migration guide rewritten as instructions for an AI coding agent. Point your agent at this page and review the diff.
</Description>

<llm-exclude>

## How to use this page

Everything below the line is written for an AI coding agent (Claude Code, Cursor, Copilot, Codex, …), not for you. Hand it to the agent as the raw markdown of this page, which the site serves at the same path with a `.md` extension, and ask it to migrate your project:

```sh
claude "Read https://reka-ui.com/docs/guides/migration-v3-agent.md and migrate this project from Reka UI v2 to v3."
```

The agent applies the mechanical rewrites, asks you about the few cases that need a decision, and finishes with a report of what it changed. Review that diff the way you would review a pull request; the human-readable version of the same changes is the [Migration to v3](./migration-v3) guide.

Reka UI v3 is still in progress, so this page grows as breaking changes land on the `v3` branch. Re-run the migration against the latest version of this page when you upgrade to a newer v3 pre-release.

---

</llm-exclude>

## Instructions for the agent

You are migrating a Vue project from Reka UI v2 to Reka UI v3. Work through the sections below in order. Each one says what changed, how to find the affected code, the rules for rewriting it, and how to verify the result. Apply the mechanical rewrites yourself. Where a rule says *ask*, stop and ask the developer instead of guessing. Do not change anything this page does not ask you to change: apart from the month and year pickers covered in section 6 and the color value type covered in section 10, component names, props, slots and `v-model` bindings are unchanged in v3.

### Before you start

1. Record a baseline: run the project's type-check, lint and test commands and note what already fails, so you can tell your changes apart from pre-existing failures.
2. Upgrade the dependency to the v3 line (`reka-ui@^3`, or the exact pre-release the developer asked for) with the project's package manager, and check that any Nuxt module or resolver usage (`reka-ui/nuxt`, `reka-ui/resolver`) resolves after the upgrade.
3. Decide the search scope: every `.vue`, `.ts`, `.tsx`, `.js`, `.jsx`, `.css`, `.scss`, `.html` and `.md` file in the project's own source, plus shared styling files such as `cva` / `tailwind-variants` / `class-variance-authority` definitions, UnoCSS shortcuts and design-token files. Skip `node_modules`, build output and lockfiles.

### 1. `data-state` vocabulary

**What changed.** `data-state` now answers exactly one of two questions. Disclosure ("is this surface revealed?") is `open` or `closed`. Selection ("is this control in its affirmative state?") is `checked` or `unchecked`, with `indeterminate` only on tri-state controls. Both values are always emitted, so `data-state` is never absent, and qualifiers such as *how* a surface opened live in their own attribute. Three multi-value machines are exempt: Progress (`indeterminate` / `loading` / `complete`) and the Splitter resize handle (`drag` / `hover` / `inactive`) are unchanged, and Stepper keeps `completed` but renames `active` / `inactive` to `current` / `upcoming`.

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
| `TooltipTrigger`, `TooltipContent` | `closed` / `delayed-open` / `instant-open` | `open` / `closed`, plus a boolean `data-delayed` attribute while open when the open was delayed |
| Everything already on `open` / `closed` or `checked` / `unchecked` / `indeterminate` | unchanged | unchanged |

**How to find it.** Search the scope for these patterns (case-sensitive, all of them):

- Tailwind variants: `data-[state=`, `group-data-[state=`, `peer-data-[state=`, including quoted values such as `data-[state='on']` and named groups such as `group-data-[state=open]/item`.
- CSS attribute selectors: `[data-state=`, `[data-state =`, with single, double or no quotes.
- Presence-only selectors: `[data-state]` and `:not([data-state])`.
- JavaScript reads: `dataset.state`, `getAttribute('data-state')`, `data-state` inside test assertions and snapshot files.

**Rewrite rules.**

- Only rewrite a selector or read that targets a Reka UI part: the element is a Reka component, the class or variant is applied to one, or the shared style is consumed by one. `data-state` is a common convention, so custom components and other libraries in the project may emit the same words (`open`, `expanded`, `active`, …); those are out of scope and must stay as they are. When a selector's target is unclear, leave it unchanged and *ask*, listing the file and line.
- For a Reka UI part, the following values map the same way whichever part it is: `on` → `checked`, `off` → `unchecked`, `visible` → `open`, `hidden` → `closed`, `expanded` → `open`, `collapsed` → `closed`, `instant-open` → `open`.
- `delayed-open` → `open` **and** `data-delayed`. In Tailwind: `data-[state=delayed-open]:` → `data-[state=open]:data-[delayed]:` (keep any `group-` / `peer-` prefix and `/name` suffix on both variants; on Tailwind 3 the bare `data-delayed:` form does not exist, so always use `data-[delayed]:`). In CSS: `[data-state='delayed-open']` → `[data-state='open'][data-delayed]`. If a rule targeted `instant-open` specifically, use `[data-state='open']:not([data-delayed])` in CSS.
- `active` / `inactive` depend on the component the selector styles, so decide **per selector**, not per file:
  - Tabs, TagsInput or Rating → `checked` / `unchecked`.
  - Stepper → `current` / `upcoming` (`completed` is unchanged).
  - The Splitter resize handle → keep `inactive` as it is.
  - Work out the component from the element the class or selector applies to: the Reka component it is rendered on, the component name in a `cva` / variants object or its consumer, a class name such as `.TabsTrigger` or `.StepperItem`, or the surrounding markup. A shared variants file that serves both Tabs and Stepper must be split so each gets its own value. If you cannot tell which component a selector styles, leave it unchanged and *ask*, listing the file and line.
- Presence-only selectors on a Reka UI part: because both values are now always present, `[data-state]` matches every part and `:not([data-state])` matches nothing. Rewrite them to the explicit value they were standing in for: an unlit `RatingItemIndicator` is `unchecked`, a non-collapsible `SplitterPanel` is `open`, a `CollapsibleContent` on its first mount is `open` or `closed` like any other.
- JavaScript reads of a Reka UI part follow the same mapping as the selectors (`el.dataset.state === 'active'` on a tab becomes `'checked'`). Update test assertions and re-record snapshots that contain the old values.
- Leave alone: `data-orientation`, `data-side`, `data-align`, `data-disabled`, `data-highlighted`, `data-selected`, `data-active` (that one is the roving-focus tab stop, unrelated to `data-state`), and every value that is already `open` / `closed` / `checked` / `unchecked` / `indeterminate`.

**Verify.** After the rewrite, a search for `data-[state=` and `[data-state` must show no `on`, `off`, `visible`, `hidden`, `expanded`, `collapsed`, `delayed-open` or `instant-open`, and `active` / `inactive` only on Splitter resize-handle selectors (`inactive`) or on selectors you deliberately left for the developer to decide. Presence-only `[data-state]` selectors must be gone.

### 2. Change events carry details

**What changed.** `update:*` events on stateful roots now receive a second argument, a `ChangeEventDetails` object with `reason`, `event`, `isCanceled` and `cancel()`, and a cancellable `beforeUpdate:*` event fires before every change. `v-model` keeps working unchanged. Uncontrolled components emit synchronously from the interaction instead of from a watcher on the next tick, and a component that mounts uncontrolled and later receives a defined model value becomes controlled from then on, even if the model is later cleared to `undefined`.

Converted so far: `SwitchRoot`, `TabsRoot`, `Toggle`, `ToggleGroupRoot`, `CheckboxRoot`, `CheckboxGroupRoot`, `RadioGroupRoot`, `ListboxRoot`, `AccordionRoot` (`modelValue`), `DropdownMenuRoot`, `DropdownMenuSub`, `ContextMenuRoot`, `ContextMenuSub`, `MenubarRoot` (`modelValue`), `MenubarSub`, `DialogRoot`, `AlertDialogRoot`, `PopoverRoot`, `TooltipRoot`, `HoverCardRoot`, `CollapsibleRoot`, `DateFieldRoot`, `TimeFieldRoot`, `DateRangeFieldRoot` and `TimeRangeFieldRoot` (`modelValue`, `placeholder`; section 20), `DatePickerRoot` and `DateRangePickerRoot` (`modelValue`, `placeholder`, `open`, `view`, and `startValue` on `DateRangePickerRoot`; section 20), `CalendarRoot` and `RangeCalendarRoot` (`modelValue`, `placeholder`, `view`), `ColorAreaRoot`, `ColorFieldRoot`, `ColorSliderRoot` and `ColorSwatchPickerRoot` (`modelValue`), `ComboboxRoot` and `AutocompleteRoot` (`modelValue`, `open`; section 16), `NumberFieldRoot`, `PinInputRoot`, `RatingRoot`, `SliderRoot`, `TagsInputRoot`, `TagGroupRoot` and `EditableRoot` (`modelValue`; sections 17 and 18), and `SelectRoot` (`modelValue`, `open`; section 19). On the converted families an `update:*` event fires only when the value actually changes; re-selecting the current value emits nothing, and a multiple selection is compared entry by entry (a `ListboxRoot` with `multiple` and `selection-behavior="replace"` no longer emits a fresh `[value]` array for a re-pressed item). `ColorAreaRoot` also now emits `change` (declared but never fired in v2) on every pointer move and arrow-key step that changes the color, and `changeEnd` after each keyboard step as well as on pointer release; both carry a `Color` object (section 10). Treat every other family as still on the v2 single-argument shape; the [Migration to v3](./migration-v3) guide lists the families as they convert. `DrawerRoot` is not on this contract: its `update:open(value, details)` is unchanged from v2 (it fires before the change and `details.cancel()` inside it vetoes the change), it has no `beforeUpdate:open`, and `update:snapPoint` stays single-argument. Leave Drawer listeners unchanged.

**How to find it.** Search for listeners and emit declarations on those roots: `@update:open`, `@update:model-value`, `@update:modelValue`, `@update:placeholder`, `'update:open'`, `'update:modelValue'`, `'update:placeholder'`, `onUpdate:open`, `onUpdate:modelValue`, `onUpdate:placeholder`, `defineEmits` in components that wrap one of the roots, `useForwardPropsEmits`, `emitted('update:open')` and `toHaveBeenCalledWith` in tests, and `watch(` calls that react to these models.

**Rewrite rules.**

- A listener that only reads the first argument keeps working. Leave it unchanged.
- A wrapper component that re-declares the emit type needs the new tuple shape, importing the details type and the family's reason union from `reka-ui`:

  ```ts
  type Emits = {
    'update:open': [value: boolean] // [!code --]
    'update:open': [value: boolean, details: ChangeEventDetails<DialogOpenChangeReason>] // [!code ++]
  }
  ```

  The reason unions, all exported from `reka-ui`, are `DialogOpenChangeReason` (also exported as `AlertDialogOpenChangeReason`), `PopoverOpenChangeReason`, `TooltipOpenChangeReason`, `HoverCardOpenChangeReason`, `MenuOpenChangeReason` (shared by the DropdownMenu, ContextMenu and Menubar parts, and also exported as `DropdownMenuOpenChangeReason`, `ContextMenuOpenChangeReason` and `MenubarChangeReason`), `SwitchChangeReason`, `TabsChangeReason`, `ToggleChangeReason`, `ToggleGroupChangeReason`, `CheckboxChangeReason`, `CheckboxGroupChangeReason`, `RadioGroupChangeReason`, `ListboxChangeReason`, `AccordionChangeReason`, `CollapsibleChangeReason`, `DatePickerOpenChangeReason`, `DateRangePickerOpenChangeReason`, `CalendarChangeReason`, `RangeCalendarChangeReason`, `ColorAreaChangeReason`, `ColorFieldChangeReason`, `ColorSliderChangeReason`, `ColorSwatchPickerChangeReason`, `ComboboxChangeReason`, `ComboboxOpenChangeReason` (the `open` reasons of both `ComboboxRoot` and `AutocompleteRoot`), `AutocompleteChangeReason`, `NumberFieldChangeReason`, `PinInputChangeReason`, `RatingChangeReason`, `SliderChangeReason`, `TagsInputChangeReason`, `TagGroupChangeReason`, `EditableChangeReason`, `SelectChangeReason`, `SelectOpenChangeReason`, `DateFieldChangeReason`, `TimeFieldChangeReason`, `DateRangeFieldChangeReason` and `TimeRangeFieldChangeReason` (one union: `'segment-input' | 'segment-increment' | 'segment-decrement' | 'segment-clear' | 'step-snap'`), `DatePickerChangeReason` (`DateFieldChangeReason | CalendarChangeReason`) and `DateRangePickerChangeReason` (`DateRangeFieldChangeReason | RangeCalendarChangeReason`). `details.reason` is the family union plus the shared `BaseChangeReason` (`'imperative-action'` for programmatic changes such as a slot's `close()`), so a `switch` over the family union alone is incomplete.
- Wrappers that forward with `useForwardPropsEmits` need no change.
- Custom parts built on `injectAccordionRootContext()` or `injectCollapsibleRootContext()`: the Accordion root context's `modelValue` is now a readonly `ComputedRef`, so call `changeModelValue` instead of assigning it, and `changeModelValue(value, reason?, event?)` now takes an optional reason and native event and returns a boolean (`false` when the change was cancelled or did not change the value). On the Collapsible root context, `onOpenToggle(event?)` accepts the native event, `onContentFound(event)` is new, and `contentId` is backed by a ref, so assigning it also updates the trigger's `aria-controls`.
- Tests: an assertion such as `expect(emit).toHaveBeenCalledWith(true)` or `expect(wrapper.emitted('update:open')[0]).toEqual([true])` now fails because of the extra argument. Assert on the first element (`[0][0]`) or use `expect.objectContaining({ reason: '…' })` for the details. Tests that awaited a tick for an uncontrolled emit may now see it synchronously; remove waits only if the test's intent is unchanged.
- A `watch` on the model that relied on the old next-tick emit ordering may observe the change one tick earlier. Only change such code if a test or the developer confirms the ordering mattered.
- Do not add `beforeUpdate:*` handlers on your own; they are an opportunity (cancel a close while a form is dirty, for example), not a migration requirement.

**Verify.** The project's type-check must pass. Every test that asserts on an `update:*` payload of a converted family must pass.

### 3. ESM only

**What changed.** v3 ships ES modules only. The CommonJS build and the `require` export conditions are gone, for `reka-ui` and for its `reka-ui/nuxt`, `reka-ui/resolver`, `reka-ui/namespaced`, `reka-ui/date`, `reka-ui/constant` and `reka-ui/internal` entries.

**How to find it.** Search for `require('reka-ui` and `require("reka-ui`, and check the test runner and any Node scripts that load the package.

**Rewrite rules.** Replace `require()` with `import` (or dynamic `import()` inside CommonJS files). Vite, Nuxt and Vitest need nothing else. Jest projects need ESM support for the package: either run Jest in ESM mode or add `reka-ui` to `transformIgnorePatterns` exceptions so it is transformed. If the project's own package is CommonJS and cannot move to ESM, *ask* before restructuring it.

**Verify.** The build and the test runner start without a "Cannot use import statement" or "require() of ES Module" error.

### 4. Generated ids

**What changed.** The ids Reka UI generates for overlay parts (Dialog and AlertDialog content, title and description; Drawer content, title and description; Popover trigger and content; DropdownMenu trigger and content; the Tooltip label the trigger's `aria-describedby` points at) are now derived from the root, so their shape differs from v2 (for example `reka-tooltip-<n>-content` instead of `reka-tooltip-content-<n>`). A `MenubarMenu` now allocates its content id when the menu is set up, not when its content first renders, so the numbering of the other generated ids in a page can shift.

**How to find it.** Search for `reka-dialog-`, `reka-alert-dialog-`, `reka-drawer-`, `reka-popover-`, `reka-dropdown-menu-`, `reka-menubar-content-`, `reka-tooltip-` and for `aria-describedby` / `aria-labelledby` / `aria-controls` values in tests and selectors.

**Rewrite rules.** Never depend on the shape of a generated id. In tests, select by role, label or text (`getByRole('dialog')`, `getByRole('tooltip')`) or compare the attribute to the id read from the other element. In CSS, style by data attribute or class, not by generated id. Code that passes its own `id` to a part is unaffected.

### 5. Disabled triggers rendered `asChild`

**What changed.** A disabled `Toggle`, `ToggleGroupItem` or `CheckboxRoot` ignores a user click even when it renders `asChild` onto an element without native `disabled` behaviour (a `div`, a link, a custom component). In v2 only the native `disabled` attribute blocked the click, so those elements still toggled.

**How to find it.** Search for `Toggle`, `ToggleGroupItem` and `CheckboxRoot` used with both `as-child` (or `asChild`) and `disabled` (or `:disabled`), where the child is not a `<button>`.

**Rewrite rules.** Nothing to rewrite in most projects: the new behaviour is what a disabled control should do. If a test or handler expects the disabled control to toggle on click, *ask* before changing it; do not remove `disabled` on your own.

**Verify.** Tests that click a disabled `asChild` control assert that the value did not change.

### 6. Calendar views replace the month and year pickers

**What changed.** The `MonthPicker`, `MonthRangePicker`, `YearPicker` and `YearRangePicker` families no longer exist. `CalendarRoot` and `RangeCalendarRoot` take a `granularity` (`day` | `month` | `year`) that sets what a selection commits, so a month picker is a `Calendar` with `granularity="month"`. The cell parts of `Calendar`, `RangeCalendar`, `DatePicker` and `DateRangePicker` take one `value` prop instead of `date` / `day` + `month`, and the grid part takes the page it renders.

| v2 | v3 |
| --- | --- |
| `MonthPickerRoot` | `CalendarRoot` with `granularity="month"` |
| `YearPickerRoot` | `CalendarRoot` with `granularity="year"` |
| `MonthRangePickerRoot` | `RangeCalendarRoot` with `granularity="month"` |
| `YearRangePickerRoot` | `RangeCalendarRoot` with `granularity="year"` |
| `MonthPicker<Part>`, `YearPicker<Part>` (`Cell`, `CellTrigger`, `Grid`, `GridBody`, `GridRow`, `Header`, `Heading`, `Next`, `Prev`) | `Calendar<Part>` |
| `MonthRangePicker<Part>`, `YearRangePicker<Part>` | `RangeCalendar<Part>` |
| `MonthPicker<Part>Props`, `YearPickerRootEmits` and the other exported types | the `Calendar<Part>…` / `RangeCalendar<Part>…` type of the same part |
| `MonthPicker.*`, `MonthRangePicker.*`, `YearPicker.*`, `YearRangePicker.*` from `reka-ui/namespaced` | `Calendar.*`, `RangeCalendar.*` |
| `isMonthDisabled`, `isYearDisabled` | `isDateDisabled` |
| `isMonthUnavailable`, `isYearUnavailable` | `isDateUnavailable` |
| `maximumMonths`, `maximumYears` | `maximumLength` |
| `<…Cell :date="x">` | `<…Cell :value="x">` |
| `<…CellTrigger :day="x" :month="page.value">` | `<…CellTrigger :value="x">`, and `:value="page.value"` on the enclosing `…Grid` |
| `<MonthPickerCellTrigger :month="x">`, `<YearPickerCellTrigger :year="x">` | `<CalendarCellTrigger :value="x">` |
| cell trigger slot props `dayValue`, `monthValue`, `yearValue` | `cellValue` |

**How to find it.** Search for `MonthPicker`, `MonthRangePicker`, `YearPicker`, `YearRangePicker` (imports, templates, types, auto-import or resolver configuration), and for every `CalendarCell`, `CalendarCellTrigger`, `CalendarGrid`, `RangeCalendarCell`, `RangeCalendarCellTrigger`, `RangeCalendarGrid`, `DatePickerCell`, `DatePickerCellTrigger`, `DatePickerGrid`, `DateRangePickerCell`, `DateRangePickerCellTrigger` and `DateRangePickerGrid` in templates, including the namespaced forms (`Calendar.Cell`, …). Also search for `maximumMonths`, `maximum-months`, `maximumYears`, `maximum-years`, `dayValue`, `monthValue`, `yearValue`, `isMonth`, `isYear`, and for `data-selected`, `data-selection-start`, `data-selection-end`, `data-highlighted-start` and `data-highlighted-end` in selectors and tests.

**Rewrite rules.**

- Rename the removed families with the table above and add the matching `granularity` to the root. Keep every other prop: `v-model`, `v-model:placeholder`, `minValue`, `maxValue`, `yearsPerPage`, `multiple`, `fixedDate`, `allowNonContiguousRanges` and the rest have the same names on `CalendarRoot` / `RangeCalendarRoot`.
- The root's `grid` slot prop is always an array of pages. The month and year pickers exposed one object, so wrap their grid in a loop and pass the page to the grid part:

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

- In existing day calendars, date pickers and date range pickers: replace `:date` on the cell and `:day` on the cell trigger with `:value`, delete `:month` from the cell trigger, and add `:value` with the same expression that `:month` had (usually `month.value`) to the enclosing grid part. Do not skip the grid: without `value` it cannot mark the days of the neighbouring months as `data-outside-view`.
- A matcher renamed to `isDateDisabled` or `isDateUnavailable` keeps its body: in a month or year picker it is still called with a date inside the month or year being tested. Matchers are called only for cells at the `granularity`, with that unit (`'day'`, `'month'` or `'year'`) as a second argument. The views coarser than the granularity never call them: those cells are disabled only by `minValue`, `maxValue` and `disabled`. Do not add unit checks to existing matchers.
- `maximumMonths` and `maximumYears` become `maximumLength`, counted in units of the `granularity`. `maximumDays` on a day range calendar still works as a deprecated alias; rename it to `maximumLength` as well.
- `data-selected`, `data-selection-start`, `data-selection-end`, `data-highlighted-start` and `data-highlighted-end` are now present with an empty value instead of `"true"`. Presence selectors (`[data-selected]`, `data-[selected]:`) need no change. Rewrite value selectors and assertions: `[data-selected='true']` → `[data-selected]`, `toHaveAttribute('data-selected', 'true')` → `toHaveAttribute('data-selected')`.
- `update:modelValue`, `update:placeholder` and `update:view` on `CalendarRoot` and `RangeCalendarRoot`, and `update:view` on `DatePickerRoot` and `DateRangePickerRoot`, follow section 2.
- A `nextPage` / `prevPage` function on the root keeps working unchanged. It is used only in the `granularity` view, with that view as an extra second argument; the coarser views page by their default step.
- The new `view`, `defaultView` and `maxView` props and the `CalendarView` / `CalendarViewTrigger` parts are optional. Do not add them during the migration. If the project built its own month or year switching around a calendar (for example swapping a `MonthPicker` and a `Calendar` with `v-if`), keep that code working with the renames above, and *ask* before replacing it with views.
- A `granularity` prop on `DatePickerRoot` or `DateRangePickerRoot` is untouched: on those roots it is still the field's time granularity.

**Verify.** A search for `MonthPicker`, `MonthRangePicker`, `YearPicker` and `YearRangePicker` returns nothing in the project's own source. No `CalendarCell`, `RangeCalendarCell`, `DatePickerCell` or `DateRangePickerCell` has a `:date` prop, no cell trigger has `:day` or `:month`, and every grid part in a day view has `:value`. The type-check passes. Render one migrated calendar and check that the days of the neighbouring months carry `data-outside-view`.

### 7. `by` comparison functions receive strings

**What changed.** A function passed as `by` to `ListboxRoot`, `ComboboxRoot` or `SelectRoot` now runs for every value, strings included. In v2 string values were compared with `===` and the function was only called for objects. `by` is still read once at setup.

**How to find it.** Search for `:by="` and `by:` on those roots where the value is a function (not a string key).

**Rewrite rules.** If the list can contain string values and the function dereferences a property (`a.id === b.id`), add a string guard (`typeof a === 'string' ? a === b : a.id === b.id`). A function that already handles both, or a list of objects only, needs no change. A string key (`by="id"`) is unaffected.

**Verify.** Selection and highlighting of string options in those lists behave as before.

### 8. Listbox keyboard handling

**What changed.** `ListboxContent`, `ListboxFilter`, `ComboboxInput` and `AutocompleteInput` resolve every keydown through one navigation intent.
- PageUp and PageDown now move the highlight to the first or last item and prevent the default, both in the content and in the filter input. In v2 they scrolled the container natively.
- While a filter has focus, ArrowLeft and ArrowRight always stay with the text input, even in a `horizontal` listbox. ArrowUp, ArrowDown, Home and End still navigate from the filter. `ListboxContent` no longer prevents the default of arrow keys while a filter owns the keyboard.
- Typeahead no longer receives navigation keys.
- New and additive: `getNavigationIntent` on `ListboxRoot` returns `'first' | 'last' | 'prev' | 'next' | 'select'`, `null` (opt the key out, Enter's selection included) or `undefined` (default mapping). The filter never passes it unmodified printable keys, and a `'select'` intent for Space on a focused item does not select twice. `ComboboxRoot` and `AutocompleteRoot` accept it too; there a `'next'` / `'prev'` intent also opens a closed popup. `textValue` on `ListboxItem` sets the label-registry text and defaults to the text content.
- `ListboxRoot`'s `update:modelValue` and `beforeUpdate:modelValue` are typed `T | T[] | undefined` (type-only).

**How to find it.**
- Keydown listeners next to these parts that handle PageUp/PageDown themselves: search for `PageUp`, `PageDown`, `'Page` in components that render `ListboxContent`, `ListboxFilter`, `ComboboxInput` or `AutocompleteInput`.
- Code that re-implemented custom navigation keys: `@keydown` on `ListboxRoot`, `ListboxContent` or `ListboxFilter` that calls `highlightItem`, `highlightFirstItem` or moves focus between options, and `key === 'n'` / `key === 'p'` checks with `ctrlKey`.
- Tests that press arrow keys in a listbox filter and assert `defaultPrevented`, or that rely on PageUp/PageDown scrolling: search `*.test.*` and `*.spec.*` for `PageUp`, `PageDown` and `defaultPrevented` near `ListboxFilter` / `ComboboxInput`.
- Handlers typed for one value on `@update:model-value` of `ListboxRoot` (`(value: string) =>`).

**Rewrite rules.**
- A custom PageUp/PageDown handler on these parts that only jumped to the first/last item: remove it. If the app needs the native scroll, pass `:get-navigation-intent="e => (e.key === 'PageUp' || e.key === 'PageDown') ? null : undefined"` on `ListboxRoot`.
- A `@keydown` handler that maps extra keys to moves (Ctrl+N/P, vim keys): replace it with `getNavigationIntent` on `ListboxRoot`, `ComboboxRoot` or `AutocompleteRoot` returning the intent; return `undefined` for every other key.
- An item whose visible content is not plain text and that is shown elsewhere by label: add `text-value="…"`. Otherwise no change.
- A `ListboxRoot` model handler typed for a single value: widen it to `T | T[] | undefined`, or narrow inside (`Array.isArray(v)`). Do not change runtime logic.
- Tests: update an expectation that ArrowLeft/ArrowRight in a horizontal filter is prevented, or that PageUp/PageDown is not. Ask the developer before changing any other keyboard assertion.

**Verify.** In each affected listbox: PageUp/PageDown move to the first/last option; ArrowLeft/ArrowRight move the caret in a filter; typing letters in a filter still filters; Enter still selects unless `getNavigationIntent` returns `null` for it. Run the type-check for the handler retyping.

### 9. Listbox filtering (no rewrite)

**What changed.** Nothing for existing code. `ListboxRoot` gained an opt-in `filter` prop: with `:filter="contains"` (from `useFilter`), the items whose text does not match the `ListboxFilter` value are not rendered, and keyboard navigation, typeahead and select-all skip them. Without `filter` (or with `null`) the listbox filters nothing, exactly as in v2. `ComboboxRoot` and `AutocompleteRoot` now filter through the same mechanism by default (section 16).

**Rewrite rules.** Do not add `filter` to an existing listbox: one whose items are already filtered by hand keeps working unchanged. Mention listboxes that compute a filtered item list from the `ListboxFilter` value in the report as optional candidates; switching one over means passing `filter` and rendering the full list.

### 10. Color values are `Color` objects

**What changed.** `ColorAreaRoot`, `ColorFieldRoot` and `ColorSliderRoot` emit a `Color` object (`{ space: 'hsl', h, s, l, alpha }`, `{ space: 'hsb', h, s, b, alpha }` or `{ space: 'rgb', r, g, b, alpha }`) instead of a hex string.
- `update:modelValue`, `beforeUpdate:modelValue`, `change` and `changeEnd` carry a `Color`; `update:color` carries the same `Color`. `modelValue` and `defaultValue` still accept strings, so a `v-model` ref that starts as a hex string holds a `Color` after the first change.
- New `update:hex` event (`onHexUpdate` on `useColorArea`, `useColorField`, `useColorSlider`): the lossy hex string after each change. The hidden form input still submits hex.
- Updates fire only for a structurally different color (`isEqualColor`, now exported). The v2 repeat of an unchanged hex string on `ColorAreaRoot` and `ColorSliderRoot` is gone.
- `ColorFieldRoot` now emits `change` and `changeEnd` after each committed change. On every component `changeEnd` fires only when the interaction changed the color and the model holds it: a drag back to its start or an update a controlled parent rejects reports nothing, and with a controlled `modelValue` it fires after the parent re-renders.
- `ColorAreaRoot` has a `dir` prop and inherits the `ConfigProvider` direction (mirrored x axis, arrow keys, thumb and gradient under `rtl`).
- `ColorSwatchPickerRoot` / `ColorSwatchPickerItem` accept `string | Color` and compare values structurally; they still emit the item value as declared.
- `injectColorAreaRootContext()` / `injectColorSliderRootContext()` / `injectColorFieldRootContext()`: `color`, `xValue` and `yValue` are read-only computeds.
- Utilities: `convertToHsl` / `convertToHsb` keep the hue between HSL and HSB. The channel and gradient helpers are no longer exported (section 12).
- `ColorSliderTrack`'s gradient follows the slider: bottom to top when `orientation="vertical"` (top to bottom when also `inverted`); on a horizontal slider, right to left when exactly one of `inverted` and right-to-left (also inherited from `ConfigProvider`) is set. In v2 it always ran left to right.
- `ColorFieldInput` validates on commit: when Enter or blur rejects text that does not parse, the text reverts to the current color as before, and the input gets `aria-invalid="true"` and the input and `ColorFieldRoot` get `data-invalid`. They stay until an edit parses or a later change commits. Typing alone never sets them.

**How to find it.**
- Every `ColorAreaRoot`, `ColorFieldRoot` and `ColorSliderRoot` usage: search for `ColorAreaRoot`, `ColorFieldRoot`, `ColorSliderRoot`, `useColorArea`, `useColorField` and `useColorSlider`. For each, find the variable bound with `v-model` / `:model-value` and every listener on `@update:model-value`, `@before-update:model-value`, `@change`, `@change-end`, `onChange`, `onChangeEnd`, `onUpdate` and `onBeforeUpdate`.
- Uses of those variables as strings: template interpolation (`{{ color }}`), style bindings (`background: color`), string methods (`.startsWith`, `.toUpperCase`, `.slice`), comparisons with string literals, `JSON`/API payloads, and TypeScript types (`ref<string>`, `(value: string) =>`).
- Workarounds for the v2 repeat: listeners that compared the new hex with the previous one before acting.
- `ColorSwatchPickerRoot` models that are compared with `===` against a color from another color component.
- `injectColorAreaRootContext` / `injectColorSliderRootContext` / `injectColorFieldRootContext` in custom parts that assign `xValue.value`, `yValue.value` or `color.value`.

**Rewrite rules.**
- A `v-model` variable that is only passed between color components (or into `ColorSwatch`, which accepts `Color`): widen its type to `string | Color` (import `type Color` from `reka-ui`) and change nothing else.
- A variable also used as a string: keep the `v-model` and add `const hex = computed(() => colorToHex(normalizeColor(color.value)))` (import `colorToHex`, `normalizeColor` from `reka-ui`); replace the string uses with `hex`.
- A variable that must stay a hex string (persisted, sent to an API, typed `string` across module boundaries): replace `v-model="x"` with `:model-value="x" @update:hex="x = $event"`. *Ask* the developer first if the component edits hue or saturation, because a hex round trip loses the hue of greys. `update:hex` can repeat the same string (moves finer than one 8-bit step still emit), so a handler with side effects must compare against the previous string.
- Listeners typed `(value: string)` on `update:model-value`, `before-update:model-value`, `change` or `change-end`: retype to `(value: Color)` and format with `colorToHex(value)` where a string was used.
- Remove hex-equality guards that only existed to skip the v2 repeated emit; use `isEqualColor(a, b)` where a guard is still needed.
- `ColorSwatchPickerRoot` comparisons with `===`: use `isEqualColor`.
- A custom part that wrote `xValue`/`yValue`/`color` on a color context: call `updateValues(x, y)` on the ColorArea context instead; *ask* for the other contexts.
- An app wrapped in `ConfigProvider` with `dir="rtl"` that wants a left-to-right color area: add `dir="ltr"` to `ColorAreaRoot`. Otherwise no change.
- Tests that assert a hex string from these events: assert `colorToHex(payload)` or the `Color` object instead.


**Verify.** The type-check passes. In each migrated picker, drag the area and the sliders and type into the fields: the shared color stays in sync, any hex label updates, and a grey keeps its hue when the hue slider moves. A form containing a color component still submits a hex string.

### 11. ColorArea renders one range input per channel

**What changed.** `ColorAreaThumb` renders two visually hidden `<input type="range">` elements after its slot content, one per channel. Each is named after its channel (`aria-label="Saturation"`), has its own value, `min`, `max` and `aria-orientation` (`horizontal` for x, `vertical` for y), and `aria-valuetext` like `"50, Lightness 40"`. Focus goes to these inputs, not the thumb; one is in the tab order, and an arrow key moves focus to the input of the axis it changes. The thumb lost `role="slider"`, `tabindex` and every `aria-*` attribute; `ColorAreaArea` lost `role="application"`, `aria-roledescription` and `aria-disabled` (`ColorAreaRoot` keeps `aria-disabled`; `data-disabled` is unchanged). `useColorArea()` returns new `xInput` / `yInput` surfaces and `setInputElement(axis, el)`. With `<ColorAreaThumb as-child>` the inputs render next to the child element, placed at the thumb's position. Enter on an input does not submit an enclosing form. Pointer, keyboard and RTL behaviour are unchanged.

**How to find it.**
- Styles on `ColorAreaThumb` or `ColorAreaArea` that use `:focus`, `:focus-visible`, `focus:` or `focus-visible:`.
- Tests and selectors that use `role="slider"` / `getByRole('slider')` / `[role=slider]` or `role="application"` / `[role=application]` near `ColorArea`, or that read `aria-valuenow` / `aria-valuetext` from the thumb.
- Direct `useColorArea()` usage that renders `thumb.attrs` (search for `useColorArea`).

**Rewrite rules.**
- Focus styles on the thumb or the area: `:focus` → `:focus-within`, `focus:` → `focus-within:`. Use `:has(:focus-visible)` (Tailwind `has-[:focus-visible]:`) for keyboard-only rings. With `<ColorAreaThumb as-child>` the inputs render next to the child element, not inside it, so put the focus style on `ColorAreaArea` instead.
- Test selectors: `getByRole('slider')` → `getByRole('slider', { name: '<x channel name>' })` (or the y channel name); `[role=slider]` → `input[type=range][aria-orientation=horizontal]` (x) or `[aria-orientation=vertical]` (y). Read values from the input's `value` instead of `aria-valuenow`, and the y value from the y input instead of parsing the thumb's `aria-valuetext`. Keydown and focus assertions target the input.
- `[role=application]` used to reach the area: select the `ColorAreaArea` element by class or test id.
- Direct `useColorArea()`: inside the thumb element, render `<input :ref="el => setInputElement('x', el)" v-bind="xInput.attrs.value">` and the same for `'y'` with `yInput`. Keep `setThumbElement` only if the thumb must still receive focus when no input is rendered.

**Verify.** Tab reaches the area once and arrow keys still move the thumb; a screen reader announces the channel name and value. Tests that select the thumb by role pass with the rewritten selectors.

### 12. Color utilities removed from the package root

**What changed.** The package root keeps `parseColor`, `normalizeColor`, `isValidColor`, `isEqualColor`, `colorToHex`, `colorToString`, `convertToRgb`, `convertToHsl`, `convertToHsb` and the types `Color`, `RGBColor`, `HSLColor`, `HSBColor`, `ColorSpace`, `ColorChannel`, `ColorFormat`. These exports are removed:

| Removed | Replacement |
| --- | --- |
| `colorToRgb(c)`, `colorToHsl(c)`, `colorToHsb(c)` | `colorToString(c, 'rgb')`, `colorToString(c, 'hsl')`, `colorToString(c, 'hsb')` |
| `getChannelValue(c, ch)` | the property of the converted color: `hue` → `convertToHsl(c).h`, `saturation` → `convertToHsl(c).s` (or `convertToHsb(c).s` in HSB), `lightness` → `convertToHsl(c).l`, `brightness` → `convertToHsb(c).b`, `red`/`green`/`blue` → `convertToRgb(c).r`/`.g`/`.b`, `alpha` → `c.alpha * 100` |
| `setChannelValue(c, ch, v)`, `setChannelValues(c, list)` | a spread of the converted color, e.g. `{ ...convertToHsl(c), h: v }`; alpha is `{ ...c, alpha: v / 100 }` |
| `getChannelRange(ch)` | constants: hue `{ min: 0, max: 360, step: 1 }`; saturation, lightness, brightness, alpha `{ min: 0, max: 100, step: 1 }`; red, green, blue `{ min: 0, max: 255, step: 1 }` |
| `getChannelName(ch)` | the project's own label (capitalized English names: `'Hue'`, `'Saturation'`, …) |
| `getAreaBackgroundStyle`, `getAreaGradient` | the `style` slot prop of `ColorAreaRoot` bound to `ColorAreaArea` |
| `getSliderBackgroundStyle`, `getSliderGradient` | `ColorSliderTrack` (it sets the gradient itself) |

**How to find it.** Search imports from `reka-ui` for `colorToRgb`, `colorToHsl`, `colorToHsb`, `getChannelValue`, `setChannelValue`, `setChannelValues`, `getChannelRange`, `getChannelName`, `getAreaBackgroundStyle`, `getAreaGradient`, `getSliderBackgroundStyle` and `getSliderGradient`.

**Rewrite rules.** Apply the table. For a gradient helper used outside a Color component (a custom track or preview), *ask* before replacing it with hand-written CSS. Do not import from `reka-ui/internal` or deep paths to get the removed helpers back.

**Verify.** The search above returns nothing, and the type-check passes.

### 13. Template refs on parts

**What changed.** A template ref on a part exposes `element` and `$el` (both read one reactive ref to the part's DOM element) plus the methods in that part's API reference, and nothing else.
- `partRef.value.$el` and `partRef.value.element` return the element. `$el` is now reactive. No rewrite.
- When the part renders no element (for example a closed `DialogContent`), `element` is `null` and `$el` falls back to Vue's placeholder comment node, as in v2. No rewrite.
- Prop values are no longer readable from a part ref: `partRef.value.<prop>` is `undefined`. Development builds warn once per part and prop, with a message that starts with `[reka-ui] <PartName>: reading the prop`.
- Methods of a component rendered through a part's `as` / `asChild` are no longer reachable on the part's ref.
- `useForwardExpose` is deprecated and logs a one-time warning in development; `useForwardElement` replaces it.

**How to find it.**
- Template refs on Reka UI parts: `ref="x"` / `:ref` / `useTemplateRef('x')` / `ref<InstanceType<typeof SomePart>>()` on any component imported from `reka-ui`. For each ref variable, list every property read off `x.value`.
- Run the app or the tests in development and collect the `reading the prop` warnings.
- `useForwardExpose` imports.
- Components passed as the child of an `as-child` part (or as the `as` value) that have more than one root node, a `v-if` on the root, or that render a fragment.

**Rewrite rules.**
- Reads of `$el`, `element` or a method documented in the part's API reference: leave unchanged.
- A read of a prop (`x.value.disabled`, `x.value.modelValue`, `x.value.open`, …): replace it with the value the component passes to that prop (the bound variable or literal). If the prop is not bound by the component, use the prop's documented default. *Ask* if the value comes from somewhere you cannot trace.
- A call to a method that the part does not document, where the method belongs to a component rendered through the part's `as` / `asChild`: add a template ref to that inner component and call the method on it.
- `const { forwardRef, ... } = useForwardExpose()`: replace with `const { forwardRef, ..., expose } = useForwardElement()` followed by `defineExpose(expose)`. If the component already calls `defineExpose({ ... })`, change it to `defineExpose(mergeExpose(expose, { ... }))`, with the `useForwardElement()` call placed above it. A bare `useForwardExpose()` call without `forwardRef`: replace it the same way and add `:ref="forwardRef"` to the template's root element. Import `useForwardElement` / `mergeExpose` from `reka-ui`.
- A component used as an `as-child` child with several root nodes, a root `v-if`, or a fragment root: add `const { forwardRef, expose } = useForwardElement()` and `defineExpose(expose)`, bind `:ref="forwardRef"` on the element the part should target, and if it has several root nodes add `defineOptions({ inheritAttrs: false })` with `v-bind="$attrs"` on that element. Leave single-root children unchanged.

**Verify.** The type-check passes. No `reading the prop` warnings remain in development. Every `$el` / `element` read from a part ref still returns the expected element.

### 14. Modal layers no longer touch `<body>`

**What changed.**
- Modal layers (modal `Dialog`, `AlertDialog`, `Drawer`, `Popover`, `DropdownMenu`, `ContextMenu`, an open `Select`, any content with `disableOutsidePointerEvents`) no longer set `pointer-events: none` on `<body>`. Each renders a transparent `position: fixed` `<div data-reka-internal-backdrop role="presentation">` right below itself instead, with the `z-index` of the layer (or of its positioning wrapper / fixed container). A press on it closes the layer. Page content with a lower `z-index` (a sticky header) is covered; only elements in the root stacking context with a higher `z-index` than the layer stay clickable. A non-portaled layer inside a `transform` / `filter` / `contain: paint` / `will-change: transform` / `backdrop-filter` ancestor gets its backdrop in `<body>`, with a hole over the layer.
- A modal `Dialog` / `Drawer` closes only on a press on its internal backdrop, its `DialogOverlay` / `DrawerOverlay`, or a container around its content, not on a press on an element stacked above the backdrop.
- A modal `Popover` / `DropdownMenu` trigger, the `ContextMenu` trigger area and the `Combobox` input are cut out of the backdrop and stay interactive.
- The scroll lock hides the overflow of the page's scroll container and keeps the gutter with `scrollbar-gutter: stable` (or pins `<body>`'s size and sets `data-reka-scroll-locked` on `<html>` where that is unsupported). It no longer sets `padding-right` / `margin-right` on `<body>` or `--scrollbar-width` on `<html>`, no longer intercepts `touchmove` on iOS, and applies a macrotask after the overlay opens.
- A modal `Dialog` / `AlertDialog` / `Drawer` locks scroll whenever it is open, with or without its overlay part. In v2 only the overlay part locked it. A `Drawer` with `modal="trap-focus"` no longer locks scroll.
- `modal` defaults are unchanged.

**How to find it.**
- `pointerEvents` / `pointer-events` together with `document.body` or `body.style` in tests, styles and scripts.
- `--scrollbar-width` in CSS, SCSS, Tailwind arbitrary values (`[--scrollbar-width]`, `var(--scrollbar-width)`) and inline styles.
- `body.style.overflow`, `body.style.paddingRight`, `body.style.marginRight` in tests.
- `scrollBody` on `ConfigProvider`.
- Modal `DialogRoot` / `AlertDialogRoot` / `DrawerRoot` usages that render no `DialogOverlay` / `AlertDialogOverlay` / `DrawerOverlay`.
- Tests that dismiss a modal dialog by firing `pointerdown` / clicking on an element other than the overlay or `document.body`.

**Rewrite rules.**
- An assertion that `document.body.style.pointerEvents` is `'none'` while a layer is open: assert `document.querySelector('[data-reka-internal-backdrop]')` is not `null`. An assertion that it is restored after close: assert the backdrop is `null`. Remove code that resets `document.body.style.pointerEvents` between tests.
- Code that sets `pointer-events: auto` on `<body>` or on a third-party element to keep it clickable next to a reka overlay: remove it.
- `var(--scrollbar-width)` used to offset fixed elements while an overlay is open: remove the declaration. *Ask* if the variable is used for anything else.
- Test assertions on `document.body.style.overflow === 'hidden'`: replace with `getComputedStyle(document.body).overflowY === 'hidden'`, waited for with `vi.waitFor` (or the test framework's equivalent). Assertions on `paddingRight` / `marginRight` of `<body>`: remove, unless `ConfigProvider` sets `scrollBody` to an object.
- A test that dismisses a modal `Dialog` / `Drawer` by pressing an arbitrary outside element: press the overlay, `[data-reka-internal-backdrop]` or `document.body` instead. Playwright / Vitest browser clicks on an element under a modal layer need `force: true`.
- A modal `Dialog` / `AlertDialog` / `Drawer` with no overlay part: leave it unchanged, and *ask* whether the page should stay scrollable while it is open. If yes, set `:modal="false"` (or `modal="trap-focus"` on a `Drawer`).
- `scrollBody` on `ConfigProvider`: leave unchanged.
- Page chrome (a sticky header, a sidebar) whose `z-index` is higher than the overlay content's and that should be blocked by modal layers: add `isolation: isolate` to the app root element (Base UI's recommendation) when the overlays are portaled to `<body>`. *Ask* before lowering any `z-index`.

**Verify.** Open each modal layer: the page does not scroll, does not shift horizontally, and `<body>` has no `pointer-events` inline style. Close it: `<html>` and `<body>` inline styles are back to what they were. The search for `--scrollbar-width` returns nothing.

### 15. Menu wrapper contexts

**What changed.** These changes affect only custom parts and tests built on the menu wrappers' injected contexts. Code that uses the components and `v-model` is not affected.
- The `MenubarRoot` context (`injectMenubarRootContext()`) exposes `modelValue` as a readonly ref, so assigning `modelValue.value` no longer opens or closes a menu. `onMenuOpen(value, reason?, event?)`, `onMenuClose(reason?, event?)` and `onMenuToggle(value, reason?, event?)` accept an optional reason and native event, and return a boolean (`false` when the change was cancelled or did not change the value).
- `MenubarRoot`'s `update:modelValue` is typed `[value: string, details]`. v2 declared it as `[value: boolean]`, although the payload was always the open menu's string value (`''` when every menu is closed).
- `DropdownMenuRoot`, `ContextMenuRoot` and `MenubarMenu` no longer render an inner `MenuRoot` component. They provide the Menu contexts themselves, so a component lookup for `MenuRoot` under them finds nothing.
- The `DropdownMenuRoot` context sets `triggerId` and `contentId` up front. A custom trigger or content that filled them in (`rootContext.triggerId ||= …`) now keeps the root's ids.

**How to find it.**
- `injectMenubarRootContext`, and assignments to `.modelValue.value` on its result.
- `'update:modelValue'` in emit types of components that wrap `MenubarRoot`.
- `findComponent(MenuRoot)` / `findAllComponents(MenuRoot)` in tests.
- `injectDropdownMenuRootContext` followed by an assignment to `triggerId` or `contentId`.

**Rewrite rules.**
- `ctx.modelValue.value = value`: replace with `ctx.onMenuOpen(value)`. `ctx.modelValue.value = ''`: replace with `ctx.onMenuClose()`.
- A wrapper emit type `'update:modelValue': [value: boolean]` for a menubar: change it to `[value: string, details: ChangeEventDetails<MenubarChangeReason>]`, importing both types from `reka-ui`.
- A test that finds `MenuRoot`: find the wrapper root (`DropdownMenuRoot`, `ContextMenuRoot`, `MenubarMenu`) instead and assert on its emits. For a `MenubarMenu`, assert on the `MenubarRoot` `update:modelValue`.
- An assignment to `triggerId` / `contentId` on the dropdown context: remove it. If the custom part needs a specific id, pass `id` to the part instead, and *ask* if other code reads the old id.

**Verify.** The type-check passes, and the menubar and dropdown tests pass.

### 16. Combobox and Autocomplete

**What changed.**
- Filtering moved onto the shared Listbox filter. `filter` on `ComboboxRoot` / `AutocompleteRoot` takes `(text, search, value) => boolean` or `null`; omitted, items match with `useFilter`'s `contains` (v2 behavior). `ignoreFilter` is a deprecated alias for `:filter="null"`.
- A `ComboboxVirtualizer` / `AutocompleteVirtualizer` now filters its `options` with the root's filter, matching `textContent(option)` or the option's string form. In v2 filtering was off in a virtualized combobox.
- A filtered-out item stays mounted and renders nothing (v2 unmounted it).
- The root ref's `filtered` is `{ search, active, count }` (v2: `{ count, items, groups }`).
- No nested `ListboxRoot` component and no `ListboxFilter` inside the input. One object is provided as both the Combobox and the Listbox root context. Removed from the Combobox root context: `allItems`, `allGroups`, `ignoreFilter`. Changed: `filterState` shape, `onOpenChange(value, reason?, event?)` returns a boolean, `highlightedElement` is `null` when empty. New: `setModelValue`, `selectItem`, `pressItem`, `clearModelValue`, `filter`, `baseId`. The Autocomplete root context's `modelValue` is read-only; `onModelValueChange(value, reason?, event?)` writes it.
- Content ids are `<root id>-content` (`reka-combobox-v-0-content`, `reka-autocomplete-v-0-content`; v2 `reka-combobox-content-v-1`), and `aria-controls` is set from the first render.
- `update:modelValue` is typed `T[]` when `multiple` is set and `T | null` otherwise (type-only; a clear emits `null`). `beforeUpdate:modelValue` and `beforeUpdate:open` are new (section 2).
- New and additive: `displayValue` on both roots, `getNavigationIntent` on both roots (section 8), `useComboboxRoot()`.

**How to find it.**
- `ignore-filter`, `:ignore-filter`, `ignoreFilter` on `ComboboxRoot` / `AutocompleteRoot`.
- `ComboboxVirtualizer` / `AutocompleteVirtualizer` usages. For each, note whether its `options` are computed from the input text (a `computed` that filters on the `ComboboxInput` `v-model`) and whether it passes `text-content`.
- `.filtered` read off a `ComboboxRoot` / `AutocompleteRoot` template ref.
- `injectComboboxRootContext(` / `injectAutocompleteRootContext(` in custom parts; within them, `allItems`, `allGroups`, `ignoreFilter`, `filterState`, `await` on `onOpenChange`, writes to `modelValue.value`.
- `reka-combobox-content` in selectors, snapshots and tests; `findComponent(ListboxRoot)` / `findComponent(ListboxFilter)` in combobox tests.
- Handlers on `@update:model-value` of a `multiple` combobox typed for a single value.

**Rewrite rules.**
- `ignore-filter` / `:ignore-filter="true"`: replace with `:filter="null"`. `:ignore-filter="flag"`: replace with `:filter="flag ? null : undefined"`.
- A virtualized combobox whose `options` are filtered by hand from the input text: add `:filter="null"` to its root (keeps the v2 behavior exactly). Do not remove the hand-written filtering unless the developer asks.
- A virtualized combobox whose `options` are NOT filtered by hand: it now filters. If the options are objects and there is no `text-content`, add `:text-content` returning the option's label. *Ask* if no label property is obvious.
- `rootRef.value.filtered.count`: leave unchanged. Reads of `filtered.items` or `filtered.groups`: *ask*; there is no per-item equivalent.
- Custom parts: replace `allItems.value.size` with `filterState.value.count`, `ignoreFilter.value` with `filter.value === null`, and drop `await` before `onOpenChange(...)`. Writes to `modelValue.value` keep working; leave them unless a reason is wanted.
- Old content ids in selectors or snapshots: select by `role="listbox"` or the input's `aria-controls` instead of the literal id; update snapshots.
- `findComponent(ListboxRoot)` / `findComponent(ListboxFilter)` in combobox tests: query the rendered element instead (`[role=listbox]`'s parent for the root, `input[role=combobox]` for the input).
- A single-value handler on a `multiple` combobox: type it as an array. Do not change runtime logic.

**Verify.** Typing in each combobox still narrows the options as before, a virtualized combobox shows its options with an empty input and narrows them when typing, the type-check passes, and tests that assert on content ids or inner components pass after the updates above.

### 17. Form input contexts

**What changed.** These changes affect only custom parts built on the form-input root contexts. Code that uses the components and `v-model` is not affected.
- The `PinInputRoot`, `RatingRoot`, `TagsInputRoot`, `TagGroupRoot` and `EditableRoot` contexts expose `modelValue` as a readonly ref, so assigning `modelValue.value` no longer changes the value.
- New context methods: `setModelValue(value, reason?, event?)` and `updateModelValueAt(index, value, reason?, event?)` on PinInput, `onAddValues(texts, reason?, event?)` and `onClear(reason?, event?)` on TagsInput.
- Existing methods take an optional trailing reason and native event: Rating `changeModelValue`, TagsInput `onAddValue` / `onRemoveValue`, TagGroup `toggleSelection` / `removeTags` (and the item context's `remove(event?)`), Editable `submit`, and NumberField `handleIncrease` / `handleDecrease` / `handleMinMaxValue` / `applyInputValue`. Rating `changeModelValue`, TagsInput `onAddValue` / `onRemoveValue`, TagGroup `toggleSelection`, Editable `submit` and NumberField `applyInputValue` return `false` when the change was cancelled or did not change the value. TagGroup `removeTags` / `remove` and NumberField `handleIncrease` / `handleDecrease` / `handleMinMaxValue` return nothing; do not test their result.
- The NumberField context's `modelValue` stays writable; an assignment now emits `beforeUpdate:modelValue` / `update:modelValue` with reason `'imperative-action'`.

**How to find it.**
- `injectPinInputRootContext(`, `injectRatingRootContext(`, `injectTagsInputRootContext(`, `injectTagGroupRootContext(` and `injectEditableRootContext(` in custom parts, and assignments to `.modelValue.value` on their results.

**Rewrite rules.**
- PinInput: `ctx.modelValue.value = v` → `ctx.setModelValue(v)`.
- Rating: `ctx.modelValue.value = v` → `ctx.changeModelValue(v)`.
- TagsInput: `ctx.modelValue.value = []` → `ctx.onClear()`. Any other assignment: *ask*.
- TagGroup: an assignment that selects or deselects one value → `ctx.toggleSelection(value)`. Any other assignment: *ask*.
- Editable: `ctx.modelValue.value = x` → `ctx.inputValue.value = x` followed by `ctx.submit()`. *Ask* if the code meant to change the value without leaving edit mode.
- Leave NumberField context code unchanged.

**Verify.** The type-check passes, and the custom parts still change the value.

### 18. TagsInput, PinInput and Editable events

**What changed.**
- `TagsInputRoot`: `addTag` and `removeTag` fire after `update:modelValue` (v2: before it), and not at all when `beforeUpdate:modelValue` cancels the change. With `v-model` the bound array is already updated when they run. With `:model-value` and a handler, `update:modelValue` is a request: they still fire if the handler does not apply it, and the bound array then stays unchanged. `invalid` fires for each rejected tag before `beforeUpdate:modelValue`, and also when the change is then cancelled. A paste adds all its tags in one `update:modelValue` (v2: one emit per tag; `invalid` and `addTag` still fire per tag).
- `TagsInputRoot` and `PinInputRoot`: mutating the bound array in place (`push`, `splice`) no longer emits `update:modelValue`. With `:model-value` and no update handler, the tags or digits no longer change locally (v2 kept a local copy). When the parent does not apply a change, TagsInput keeps the typed text and PinInput restores the digit without moving focus.
- `EditableRoot`, uncontrolled only: on a submit that changes the value, `update:modelValue` fires before `update:state` and `submit` (v2: on the next tick, after them). A controlled Editable already used this order. In both modes a cancelled submit stays in edit mode and fires neither `update:state` nor `submit`, and an unchanged submit emits no `update:modelValue` but still fires `update:state` and `submit`.

**How to find it.**
- `@add-tag` / `@remove-tag` / `onAddTag` / `onRemoveTag` handlers on `TagsInputRoot` that read the bound model.
- `TagsInputRoot` or `PinInputRoot` used with `:model-value` and no `@update:model-value`.
- `.push(` / `.splice(` / `.length = ` / index assignments on an array bound to the `v-model` of `TagsInputRoot` or `PinInputRoot`.
- Tests that count `update:modelValue` emits after a paste into `TagsInputInput`.
- `@submit` / `@update:state` handlers on an `EditableRoot` without `v-model` / `:model-value` that read the value.

**Rewrite rules.**
- An `@add-tag` / `@remove-tag` handler that reads the model: with `v-model` it now sees the updated array. With `:model-value` and an `@update:model-value` handler that can reject or transform the value, read the tag from the event payload instead of the bound array. If it relied on the old value: *ask*.
- `:model-value` without an update handler on `TagsInputRoot` or `PinInputRoot`, where the value was expected to change: replace with `v-model`. If it was meant to be read-only: leave it.
- An in-place mutation that relied on `update:modelValue` firing: assign a new array (`model.value = [...model.value, tag]`).
- A test expecting one emit per pasted tag: expect one emit whose payload holds all of them.
- Editable `@submit` / `@update:state` handlers: the model is already updated when they run. Leave them unchanged unless they compensated for the old order; if they did: *ask*.

**Verify.** The type-check passes, and the TagsInput, PinInput and Editable tests pass.

### 19. Select

**What changed.**
- `update:modelValue` and `update:open` on `SelectRoot` carry details, and `beforeUpdate:modelValue` / `beforeUpdate:open` are new (section 2). Reasons: `SelectChangeReason` (`'item-press' | 'item-keydown' | 'typeahead' | 'autofill'`) and `SelectOpenChangeReason` (`'trigger-press' | 'list-navigation' | 'item-press' | 'item-keydown' | 'escape-key' | 'outside-press'`).
- Pressing the selected item of a single select closes it without emitting `update:modelValue`, also when `by` matches a different object. Mutating an uncontrolled model array in place no longer emits.
- `update:modelValue` is typed `T[]` when `multiple` is set and `T` otherwise, as in v2 (type-only; a single select never emits `null`).
- Typing on a focused, closed `SelectTrigger` selects the next matching item (reason `typeahead`). In v2 it did nothing. `multiple` selects are unchanged.
- In `popper` position, pressing the trigger of an open select closes it (reason `trigger-press`).
- `SelectValue` keeps the text of a selected item after its `SelectItemText` unmounts.
- The hidden native `<select>` marks selected options with `selected` and no longer receives `value`. A `multiple` select submits every selected value.
- Content ids are `<root id>-content` (`reka-select-v-0-content`; v2 `reka-select-content-v-1`).
- Root context (`injectSelectRootContext()`):
  - `modelValue` and `open` are read-only `ComputedRef`s.
  - `onValueChange(value, reason?, event?)` and `onOpenChange(open, reason?, event?)` return a boolean.
  - `optionsSet`, `onOptionAdd` and `onOptionRemove` are removed; use `labels.register` / `labels.get` / `labels.entries`.
  - New: `baseId`, `setModelValue`, `isSelected`, `pressItem`, `selectedLabels`, `displayValue`, `getNavigationIntent`.
- New and additive: `displayValue` and `getNavigationIntent` on `SelectRoot`, `selectedLabels` on the `SelectValue` slot, and `useSelectRoot()` with the part composables.

**How to find it.**
- `injectSelectRootContext(` in custom parts; within them, assignments to `modelValue.value` or `open.value`, and `optionsSet`, `onOptionAdd`, `onOptionRemove`.
- `reka-select-content` in selectors, snapshots and tests.
- `@update:model-value` handlers on a `SelectRoot` with `multiple`, and `.push(` / `.splice(` on a select's `v-model` array.
- Tests that assert `update:modelValue` was emitted after pressing the already-selected item.

**Rewrite rules.**
- `rootContext.modelValue.value = x`: replace with `rootContext.setModelValue(x)`. `rootContext.open.value = x`: replace with `rootContext.onOpenChange(x)`.
- `rootContext.optionsSet.value` reads: replace with `rootContext.labels.entries()` (entries are `{ value, label, disabled }`; v2 used `textContent` for `label`). Remove `onOptionAdd` / `onOptionRemove` calls and register with `rootContext.labels.register(value, label, disabled)` instead.
- Old content ids in selectors or snapshots: select by `role="listbox"` or the trigger's `aria-controls`; update snapshots.
- In-place mutation of the `v-model` array of an uncontrolled `multiple` select that expected an emit: assign a new array. Leave controlled models unchanged.
- A test that expects an emit for re-pressing the selected item: assert that nothing was emitted and that the content closed. *Ask* if the app relied on the emit.
- Single-value handlers on a `multiple` select: type them as arrays. Do not change runtime logic.

**Verify.** Each select opens, selects and closes as before; forms submit the selected values; the type-check passes.

### 20. Date and time fields

**What changed.**
- `DateFieldRoot`, `TimeFieldRoot`, `DateRangeFieldRoot`, `TimeRangeFieldRoot`, `DatePickerRoot` and `DateRangePickerRoot` emit `update:modelValue(value, details)` and `update:placeholder(value, details)`, with a cancellable `beforeUpdate:*` before each (section 2). A picker emits one pair per change, from the root, carrying the field's reason (`segment-*`, `step-snap`) or the calendar's (`cell-press`, `cell-keydown`); `details.cancel()` on the picker root cancels the typed change too. A cancelled change keeps the last committed value, and the segments keep what the user typed, so typing can continue to a value the handler accepts. The segments only follow the model when it actually changes: a controlled parent that ignores an update leaves them showing the typed value, as in v2.
- `DatePickerRoot` and `DateRangePickerRoot` no longer render a `PopoverRoot` component; they provide the Popover context themselves.
- `:model-value="null"` is a controlled empty value (also on `CalendarRoot`, as in v2; a controlled-empty `DatePickerRoot` keeps its calendar controlled). For a controlled `null`, `modelValue` on the `DateFieldRoot`, `TimeFieldRoot` and `DatePickerRoot` contexts reads `undefined`; the `DateRangeFieldRoot` and `TimeRangeFieldRoot` contexts have no `modelValue` and read `undefined` from `startValue` and `endValue`; `modelValue` on the `DateRangePickerRoot` context reads the empty range `{ start: undefined, end: undefined }`. A cleared field emits `undefined` (single) or `{ start: undefined, end: undefined }` (range). The range roots' `modelValue` slot prop is typed `DateRange` / `TimeRange` (v2: `DateRange | null` / `TimeRange | undefined`).
- A model set to a value equal to the current one emits nothing.
- `update:startValue` on `RangeCalendarRoot` and `DateRangePickerRoot` is `[date, details]`. `beforeUpdate:startValue` on `DateRangePickerRoot` is new; cancelling it suppresses only that `update:startValue`.
- `TimeFieldRoot` emits `update:placeholder` with a `Time` when the placeholder is a `Time` (v2: a `CalendarDateTime`).
- Root contexts: `modelValue` / `placeholder` (and `startValue` / `endValue` on the range field contexts) are writable computeds that report `'imperative-action'`. New: `setModelValue(value, reason?, event?)`, `setPlaceholder(value, reason?, event?)`, `setRangeValue(type, value, reason?, event?)` (range fields), all returning a boolean. On the picker contexts, `onDateChange(date, reason?, event?)` and `onPlaceholderChange(date, reason?, event?)` return a boolean, and `onStartValueChange(date, details?)` takes the details.
- The time zone segment renders `data-readonly=""` (v2: `data-readonly="true"`).
- Without a `locale` prop and a `placeholder`, the default placeholder uses the `ConfigProvider` locale, including its calendar system: under a `th-TH`, `fa-IR`, `ar-SA` (or other non-Gregorian) `ConfigProvider` the emitted values are in that calendar, and `.year` is that calendar's year.
- Rendered attributes can come in a different order; update snapshots.
- Additive: `isTimeUnavailable` on `TimeFieldRoot`; `stepSnapping` on `DateRangeFieldRoot`, `TimeRangeFieldRoot` and `DateRangePickerRoot`; `stepSnapping` on the picker roots now reaches the field; `useDateField()`, `useTimeField()`, `useDateRangeField()`, `useTimeRangeField()`, `useDatePicker()`, `useDateRangePicker()`.

**How to find it.**
- `@update:model-value`, `@update:placeholder` and `@update:start-value` on the six roots and on `RangeCalendarRoot`; `'update:modelValue'`, `'update:placeholder'`, `'update:startValue'` in emit types of components that wrap them.
- `findComponent(PopoverRoot)` / `findAllComponents(PopoverRoot)` in date picker tests.
- `=== null` / `!== null` checks on the `modelValue` slot prop of `DateRangeFieldRoot` / `TimeRangeFieldRoot`, and handlers that expect `null` from a cleared field.
- `injectDateFieldRootContext(`, `injectTimeFieldRootContext(`, `injectDateRangeFieldRootContext(`, `injectTimeRangeFieldRootContext(`, `injectDatePickerRootContext(`, `injectDateRangePickerRootContext(` in custom parts.
- `instanceof CalendarDateTime` or `'day' in` checks on a `TimeFieldRoot` `update:placeholder` payload.
- `data-readonly="true"` in selectors, styles and snapshots.
- A `ConfigProvider` with a `locale` whose default calendar is not Gregorian (`th`, `fa`, `ar-SA`, …) above a date or time field or picker that has no `locale` and no `placeholder` prop, and code that reads `.year`, compares, stores or serializes the field's values.
- `is-date-unavailable` / `isDateUnavailable` on `TimeFieldRoot` (it was never applied there).

**Rewrite rules.**
- Wrapper emit types: add a `details` argument typed with the root's own union, imported from `reka-ui`: `ChangeEventDetails<DateFieldChangeReason>` on `DateFieldRoot`, `TimeFieldChangeReason` on `TimeFieldRoot`, `DateRangeFieldChangeReason` on `DateRangeFieldRoot`, `TimeRangeFieldChangeReason` on `TimeRangeFieldRoot`, `DatePickerChangeReason` on `DatePickerRoot` and `DateRangePickerChangeReason` on `DateRangePickerRoot`, for both `update:modelValue` and `update:placeholder` (for example `[date: DateRange]` on `DateRangeFieldRoot` becomes `[date: DateRange, details: ChangeEventDetails<DateRangeFieldChangeReason>]`). `'update:startValue': [date: DateValue | undefined]` gets `details: ChangeEventDetails<RangeCalendarChangeReason>` on both `RangeCalendarRoot` and `DateRangePickerRoot`.
- `findComponent(PopoverRoot)` under a picker: assert on the picker root's `update:open` or on the rendered `[role=dialog]` instead.
- A `null` check on a range slot's `modelValue`: replace with a check on `modelValue.start` / `modelValue.end`.
- Context writes such as `ctx.modelValue.value = date` keep working; leave them. Replace them with `ctx.setModelValue(date, reason, event)` only where a reason is wanted. Code that awaited `onDateChange` or ignored its return value keeps working.
- A `TimeFieldRoot` placeholder handler that needs a date: convert with `toCalendarDateTime(today(tz), time)` from `@internationalized/date`. *Ask* if the intent is unclear.
- `[data-readonly="true"]`: replace with `[data-readonly]`; update snapshots.
- A field under a non-Gregorian `ConfigProvider` locale whose values are consumed as Gregorian (stored, sent to an API, compared with `.year`): *ask* the developer. If they want Gregorian values, add `:placeholder="today(getLocalTimeZone())"` (or `locale="en-US"`) to the root, or convert with `toCalendar(value, new GregorianCalendar())`.
- A `beforeUpdate:modelValue` guard on a field: leave it. A cancelled typed change keeps the typed segments, so the user can keep typing to an accepted value.
- `isDateUnavailable` on `TimeFieldRoot`: rename to `isTimeUnavailable` (it receives a date-time). It now applies, so *ask* before keeping it if the matcher's result was never tested.
- Do not add `stepSnapping` or `beforeUpdate:*` handlers on your own.

**Verify.** The type-check passes. Typing in each field and picking a day in each picker still updates the bound model, a cleared field reads as empty, and tests that assert on `update:*` payloads of these roots pass.

### Report

When you are done, give the developer:

1. The list of files you changed, grouped by the section above that required the change.
2. Every `active` / `inactive` selector, every `require()`, every hand-built month or year switcher, every color model kept as a hex string, every gradient helper call, every prop read off a part ref, every other `--scrollbar-width` use, every overlay-less modal dialog, every form-input context assignment from section 17, every TagsInput / Editable handler from section 18, every app reliance on a re-press emit from section 19, and every date or time field under a non-Gregorian `ConfigProvider` locale and every `TimeFieldRoot` placeholder handler from section 20 that you left unchanged because the rule said to ask, with file and line.
3. The result of the type-check, lint and test commands, compared with the baseline you recorded at the start.
