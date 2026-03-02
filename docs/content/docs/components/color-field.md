---

title: Color Field
description: An input field for entering and editing color values in various formats.
name: color-field
---

# Color Field

<Description>
An input field component for entering color values. Supports hex color input or individual color channel values with keyboard navigation and wheel interaction.
</Description>

<ComponentPreview name="ColorField" />

## Features

<Highlights
  :features="[
    'Supports hex color input mode.',
    'Individual color channel editing mode.',
    'Keyboard navigation with arrow keys.',
    'Mouse wheel support for increment/decrement.',
    'Page Up/Down for larger value changes.',
    'Home/End keys to jump to min/max values.',
    'Form integration with hidden inputs.',
    'Support for HSL, HSB, and RGB color spaces.',
  ]"
/>

## Installation

Install the component from your command line.

<InstallationTabs value="reka-ui" />

## Anatomy

Import all parts and piece them together.

```vue
<script setup>
import {
  ColorFieldInput,
  ColorFieldRoot,
} from 'reka-ui'
</script>

<template>
  <ColorFieldRoot>
    <ColorFieldInput />
  </ColorFieldRoot>
</template>
```

## API Reference

### ColorFieldRoot

The root component that provides the color field context and state management.

<!-- @include: @/meta/ColorFieldRoot.md -->

### ColorFieldInput

The input element for entering color values.

<!-- @include: @/meta/ColorFieldInput.md -->

## Examples

### Hex Color Input

Basic hex color input field.

```vue
<script setup>
import {
  ColorFieldInput,
  ColorFieldRoot,
} from 'reka-ui'
import { ref } from 'vue'

const color = ref('#3b82f6')
</script>

<template>
  <ColorFieldRoot v-model="color">
    <ColorFieldInput />
  </ColorFieldRoot>
</template>
```

### Channel Input

Input for a specific color channel (e.g., hue).

```vue
<script setup>
import {
  ColorFieldInput,
  ColorFieldRoot,
} from 'reka-ui'
import { ref } from 'vue'

const color = ref('#3b82f6')
</script>

<template>
  <ColorFieldRoot
    v-model="color"
    color-space="hsl"
    channel="hue"
  >
    <ColorFieldInput />
  </ColorFieldRoot>
</template>
```

### With Wheel Control Disabled

Prevent changing values with mouse wheel.

```vue
<script setup>
import {
  ColorFieldInput,
  ColorFieldRoot,
} from 'reka-ui'
import { ref } from 'vue'

const color = ref('#3b82f6')
</script>

<template>
  <ColorFieldRoot
    v-model="color"
    disable-wheel-change
  >
    <ColorFieldInput />
  </ColorFieldRoot>
</template>
```

### Read-only Mode

Display the color value without allowing edits.

```vue
<script setup>
import {
  ColorFieldInput,
  ColorFieldRoot,
} from 'reka-ui'
import { ref } from 'vue'

const color = ref('#3b82f6')
</script>

<template>
  <ColorFieldRoot
    v-model="color"
    readonly
  >
    <ColorFieldInput />
  </ColorFieldRoot>
</template>
```

## Accessibility

### Keyboard Interactions

| Key | Description |
| --- | --- |
| `ArrowUp` | Increases the value by one step. |
| `ArrowDown` | Decreases the value by one step. |
| `PageUp` | Increases the value by 10 steps. |
| `PageDown` | Decreases the value by 10 steps. |
| `Home` | Sets the value to minimum. |
| `End` | Sets the value to maximum. |
| `Enter` | Commits the current input value. |
