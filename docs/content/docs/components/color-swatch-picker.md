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

## Accessibility

Adheres to the [Listbox WAI-ARIA design pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/). The root renders with `role="listbox"` and each item with `role="option"`, labelled with the name of its color.

Focus is managed with a roving tabindex, so the picker is a single tab stop. Moving focus with the arrow keys does not change the selection; press <kbd>Space</kbd> or <kbd>Enter</kbd> to select.

### Keyboard Interactions

<KeyboardTable
  :data="[
    {
      keys: ['Tab'],
      description: 'Moves focus into or out of the picker.',
    },
    {
      keys: ['ArrowRight'],
      description: '<span>Moves focus to the next item when <code>orientation</code> is <code>horizontal</code> (default). Reversed when <code>dir</code> is <code>rtl</code>.</span>',
    },
    {
      keys: ['ArrowLeft'],
      description: '<span>Moves focus to the previous item when <code>orientation</code> is <code>horizontal</code> (default). Reversed when <code>dir</code> is <code>rtl</code>.</span>',
    },
    {
      keys: ['ArrowDown'],
      description: '<span>Moves focus to the next item when <code>orientation</code> is <code>vertical</code>.</span>',
    },
    {
      keys: ['ArrowUp'],
      description: '<span>Moves focus to the previous item when <code>orientation</code> is <code>vertical</code>.</span>',
    },
    {
      keys: ['Home'],
      description: 'Moves focus to the first item.',
    },
    {
      keys: ['End'],
      description: 'Moves focus to the last item.',
    },
    {
      keys: ['Space'],
      description: 'Selects the focused item.',
    },
    {
      keys: ['Enter'],
      description: 'Selects the focused item.',
    },
    {
      keys: ['Ctrl/Cmd + A'],
      description: '<span>Selects all items when <code>multiple</code> is set.</span>',
    },
  ]"
/>
