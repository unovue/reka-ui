---

title: Color Swatch Picker
description: A component that allows users to select from a set of predefined colors, often used for themes or branding.
name: color-swatch-picker
---

# Color Swatch Picker

<Badge>Alpha</Badge>

<Description>
A component that allows users to select from a set of predefined colors, often used for themes or branding.
</Description>

<ComponentPreview name="ColorSwatchPicker" />

## Features

<Highlights
  :features="[
    'Can be controlled or uncontrolled.',
    'Focus is fully managed.',
    'Full keyboard navigation.',
    'Supports Right to Left direction.',
    'Different selection behavior.',
  ]"
/>

## Installation

Install the component from your command line.

<InstallationTabs value="reka-ui" />

<Callout type="tip">

Looking for a complete color picker? Check out the [Color Picker example](/examples/color-picker) that combines Color Area, Color Slider, Color Field, and Color Swatch components.

</Callout>

## Anatomy

Import all parts and piece them together.

```vue
<script setup>
import {
  ColorSwatchPickerItem,
  ColorSwatchPickerItemIndicator,
  ColorSwatchPickerItemSwatch,
  ColorSwatchPickerRoot,
} from 'reka-ui'
</script>

<template>
  <ColorSwatchPickerRoot>
    <ColorSwatchPickerItem value="#ff0000">
      <ColorSwatchPickerItemSwatch />
      <ColorSwatchPickerItemIndicator />
    </ColorSwatchPickerItem>
    <ColorSwatchPickerItem value="#00ff00">
      <ColorSwatchPickerItemSwatch />
      <ColorSwatchPickerItemIndicator />
    </ColorSwatchPickerItem>
    <ColorSwatchPickerItem value="#0000ff">
      <ColorSwatchPickerItemSwatch />
      <ColorSwatchPickerItemIndicator />
    </ColorSwatchPickerItem>
  </ColorSwatchPickerRoot>
</template>
```

## Headless composable

These composables are experimental. Reactive options accept refs or getters. Pass a writable `modelValue` ref for ref-owned state, or use `onUpdate` to handle controlled updates. `onBeforeUpdate(value, details)` can synchronously call `details.cancel()` to prevent a change. Component users can use `@before-update:model-value` for the same behavior.

`useColorSwatchPicker()` is pure and exposes the model, `setValue`, programmatic `select`, and color-specific part surfaces. Compose them with the Listbox components for collection registration, selection interactions, keyboard navigation, focus, and indicator presence.

```vue
<script setup>
import { ListboxContent, ListboxItem, ListboxRoot, useColorSwatchPicker } from 'reka-ui'

const colors = ['#ff0000', '#00ff00', '#0000ff']
const { root, getItemSurface } = useColorSwatchPicker({ defaultValue: '#ff0000' })
</script>

<template>
  <ListboxRoot v-bind="root.attrs.value">
    <ListboxContent aria-label="Color">
      <ListboxItem
        v-for="color in colors"
        :key="color"
        :value="color"
        v-bind="getItemSurface(color).attrs.value"
      >
        {{ color }}
      </ListboxItem>
    </ListboxContent>
  </ListboxRoot>
</template>
```

`getItemSwatchSurface(color)` supplies props for `ColorSwatch`; `itemIndicator` composes with `ListboxItemIndicator`. These surfaces do not implement Listbox behavior on plain elements. Delegated model updates have the `selection` reason; Listbox's model event does not supply a native event.

## API Reference

### ColorSwatchPickerRoot

The main component that displays a color swatch picker.

<!-- @include: @/meta/ColorSwatchPickerRoot.md -->

### ColorSwatchPickerItem

The item that represents a selectable color swatch.

<!-- @include: @/meta/ColorSwatchPickerItem.md -->

### ColorSwatchPickerItemSwatch

The component that displays the color swatch within an item.

<!-- @include: @/meta/ColorSwatchPickerItemSwatch.md -->

### ColorSwatchPickerItemIndicator

The component that indicates the selected color swatch within an item.

<!-- @include: @/meta/ColorSwatchPickerItemIndicator.md -->
