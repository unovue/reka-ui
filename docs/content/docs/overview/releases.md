---
title: Releases
description: Discover the latest release of Reka UI.
---

# Releases

<Description>
Discover the latest release of Reka UI.
</Description>

[Latest releases on github](https://github.com/unovue/reka-ui/releases)

---

## v2.11

### ✨ New Features

#### Components

- **Field**: New primitive that wires a control to its label, description and validation errors <Badge>Alpha</Badge>
- **Form**: New primitive that extends the native form with submit-time validation and server error display <Badge>Alpha</Badge>
- **TagGroup**: New component for a list of selectable, removable tags with keyboard navigation <Badge>Alpha</Badge>
- **Toast**: New toast manager for creating toasts from anywhere
  - `createToastManager` and `useToastManager` to add, update and close toasts imperatively
  - `ToastPositioner` and `ToastArrow` to anchor a toast to an element
- **Drawer**: New `DrawerVirtualKeyboardProvider` to keep the drawer clear of the software keyboard

#### Functionality

- **Listbox/Combobox/Autocomplete/Select/Tree**: Added `loop` prop so arrow-key navigation wraps around
- **Select/Listbox/Combobox/Menu/ColorSwatchPicker**: Added slot props (e.g. `selected`, `checked`) to `*Item`, and `forceMount` to `*ItemIndicator`
- **Combobox**: Added `unmountOnHide` prop to control whether content is unmounted when closed
- **Calendar/RangeCalendar**: Added `Home`, `End`, `PageUp`, `PageDown` and `Shift` + `PageUp`/`PageDown` keyboard shortcuts
- **NumberField**: Added `startingValue` prop for the first increment or decrement of an empty field
- **NumberField**: Added `allowInvalid` prop to keep a typed value that is out of range or off the step
- **Checkbox**: Added `max` prop to `CheckboxGroupRoot` to limit the number of checked values
- **Toast**: Added `closeOnClick` prop to `ToastAction` to keep the toast open after the action
- **Menu**: Added `graceDuration` prop to sub triggers to customize the pointer grace period
- **ContextMenu**: Added controlled `open` state support
- **Drawer**: Swipe dismissal can be canceled with `details.cancel()` in `update:open`
- **DismissableLayer/FocusScope**: Added support for content rendered inside an iframe or a shadow root

#### Developer Experience

- **Types**: `openAutoFocus` is now typed on `DropdownMenuContent`, `ContextMenuContent` and `MenubarContent`
- **Dependencies**: Updated `@floating-ui/vue` to v2

### ⚠️ Behavior Changes

These are fixes, but they change behavior you may rely on.

- **VisuallyHidden**: No longer sets `aria-hidden` by default, so its content is exposed to assistive technology. Use `feature="fully-hidden"` to hide it completely.
- **Select/DropdownMenu/Menubar/NavigationMenu/Tabs**: Triggers now respect `event.preventDefault()`. A listener such as `@click.prevent` on a trigger stops it from opening.
- **FocusScope**: Auto focus and the `Tab` loop now follow `tabindex` order instead of DOM order.
- **NumberField**: `update:modelValue` is now typed `number | undefined`, matching what was already emitted when the field is cleared.
- **NumberField**: Stepping further out of range no longer clamps the value. For example, `ArrowUp` on a value above `max` does nothing.
- **Menu**: `@entry-focus` on `DropdownMenuContent`, `ContextMenuContent` and `MenubarContent` is no longer forwarded.
- **Calendar/RangeCalendar**: `Home`, `End`, `PageUp` and `PageDown` on a cell no longer scroll the page.
- **DatePicker**: `closeOnSelect` now closes only when the day changes.
- **Checkbox**: A disabled `CheckboxRoot` now also sets `aria-disabled="true"`.
- **Toast**: Toasts now render `--reka-toast-*` CSS variables and a `data-expanded` attribute.

---

## v2.10

### ✨ New Features

#### Components

- **Drawer**: New drawer primitive with swipe gestures, snap points, handle, and nested drawer support <Badge>Alpha</Badge>
- **Rating**: New component for star-style rating inputs <Badge>Alpha</Badge>

#### Functionality

- **Select**: Added `nullableValue` prop to allow deselecting the current value
- **Dialog**: Added `unmountOnHide` prop to control whether content is unmounted when closed
- **HoverCard**: Added `enableTouch` prop to enable hover cards on touch devices
- **ConfigProvider**: Added `teleportTo` for setting a global default teleport target
- **Popper**: Added `dir` prop for `RTL`/`LTR` support
- **Tree**: Added `disabled` support for `TreeItem`
- **DateField**: Added `stepSnapping` support
- **Tabs**: Exposed `--reka-tabs-indicator-thickness` CSS variable

#### Developer Experience

- **Types**: Improved type inference for `useEmitAsProps` and `useForwardPropsEmits`

---

## v2.9

### ✨ New Features

#### Components

- **ColorPicker Suite**: Complete set of color picker components
  - `ColorArea` - 2D color selection area with thumb
  - `ColorField` - Text input for entering color values
  - `ColorSlider` - Slider for adjusting color channels (hue, saturation, etc.)
  - `ColorSwatch` - Displays a color preview swatch
  - `ColorSwatchPicker` - Grid of selectable color swatches
- **TimeRangeField**: New component for selecting time ranges with start/end inputs
- **Autocomplete**: New component for free-form text inputs with optional suggestions (different from Combobox - uses string `modelValue` instead of selected item)
- **MonthPicker & YearPicker**: Four new date picker variants
  - `MonthPicker` - Single month selection
  - `MonthRangePicker` - Month range selection
  - `YearPicker` - Single year selection
  - `YearRangePicker` - Year range selection
- **DropdownMenuFilter**: New component for filtering menu items within dropdown menus

#### Functionality

- **Splitter**: Added support for pixel sizing and constraints (in addition to percentages)
- **Checkbox/Switch**: Added support for custom true/false values (not limited to boolean)
- **Tooltip**: Added global tooltip content configuration support
- **Combobox/Autocomplete**: Added `data-empty` attribute and `hideWhenEmpty` prop to hide dropdown when nothing matches

#### Internal (Using it at your own risk)

- **Menu**: Now exported via `/internal` path for advanced customization

---

## 2.0 Changes

### ✨ New Features

<Callout type="tip">

We recommend reviewing the [migration guide](/docs/guides/migration) to make transitioning from v1 to v2 smooth.

</Callout>

#### Components
- **TimeField**: Implement new TimeField component
- **Presence**: Expose component
- **ConfigProvider**: Add global config for locale

#### Functionality
- **Checkbox**:
  - Support multiple values and more types
  - Add roving focus props to group
- **ToggleGroup**: Support more types
- **RadioGroup**:
  - Support more types
  - Emit 'select' event when user clicks on item
- **Select**: Support different modelValue and option types
- **Listbox/Combobox**:
  - Expose highlight methods
  - Highlight first item when filter changes
- **NavigationMenu**:
  - Add additional CSS variables for better positioning
  - Add SSR support
- **Collapsible/Accordion**: Add `unmount` prop to help SEO for hidden content

#### Developer Experience
- **Types**:
  - Expose useful types
  - Allow type inference in usePrimitiveElement
- **Filtering**: New `useFilter` composable for easy filtering
- **Bundle**: Bundle with preserveModules, rollup types dts

### 🔧 Refactors

- **Form Components**:
  - Move visually hidden input element inside root node
- **Combobox**:
  - Use Listbox as base component
  - Remove ComboboxEmpty
- **Popper**:
  - Allow custom reference el or virtual el
  - Add position strategy and updateOnLayoutShift props
  - Rename props for better clarity

### 🐛 Bug Fixes

- **NavigationMenu**: Reset position after animation
- **Accordion**: Fix SSR animation causing flickers
- **Listbox**: Prevent scroll when using pointermove
- **Combobox**:
  - Fix empty state based on search value
  - Fix initial search not working and virtualizer issues
- **Select**: Fix arrow throwing content context injection error
- **VisuallyHidden**: Fix not focusable after native form validation

### 🚨 Breaking Changes

- **Form Components**:
  - Rename controlled state to `v-model`
- **Popover**: Update aria attributes and remove messy attributes
- **Select**:
  - Fix SSR support
  - Refactor SelectValue rendering mechanism
- **Arrow**: Improve polygon implementation
- **Calendar**: Remove deprecated `step` prop
