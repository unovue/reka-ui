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
