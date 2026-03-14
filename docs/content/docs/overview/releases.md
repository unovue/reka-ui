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
