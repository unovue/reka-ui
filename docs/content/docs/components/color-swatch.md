---

title: Color Swatch
description: A predefined color block that allows users to quickly select commonly used or brand-specific colors.
name: color-swatch
---

# Color Swatch

<Badge>Alpha</Badge>

<Description>
Displays a color swatch, which can be used to represent colors in a UI.
</Description>

<ComponentPreview name="ColorSwatch" />

## Features

<Highlights
  :features="[
    'Supports custom colors',
    'Provides an accessible label for screen readers',
    'Provides a color contrast for better visibility',
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
  ColorSwatch,
} from 'reka-ui'
</script>

<template>
  <ColorSwatch color="#ff0000" />
</template>
```

## API Reference

### ColorSwatch

The main component that displays a color swatch.

<!-- @include: @/meta/ColorSwatch.md -->

## Accessibility

The swatch renders with `role="img"` and `aria-roledescription="color swatch"`. Its accessible name is the `label` prop when provided, otherwise a color name derived from the `color` value (`transparent` when there is no color or it is fully transparent).

### Keyboard Interactions

Color Swatch is a static element. It is not focusable and has no keyboard interaction.
