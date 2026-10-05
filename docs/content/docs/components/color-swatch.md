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

## Headless composable

`useColorSwatch()` is a pure composable exposing the color string, alpha, accessible label, contrast, and a root surface. It accepts refs or getters and can be called outside component setup.

```vue
<script setup>
import { useColorSwatch } from 'reka-ui'

const { root } = useColorSwatch({ color: '#16a372', label: 'Brand green' })
</script>

<template>
  <div v-bind="root.attrs.value" />
</template>
```

Use the `--reka-color-swatch-color` and `--reka-color-swatch-alpha` CSS variables to style the swatch, as with the component.

## API Reference

### ColorSwatch

The main component that displays a color swatch.

<!-- @include: @/meta/ColorSwatch.md -->
