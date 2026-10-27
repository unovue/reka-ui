---

title: Color Field
description: An input field for entering and editing color values in various formats.
name: color-field
---

# Color Field

<Badge>Alpha</Badge>

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
    'Emits a lossless Color object, with an opt-in hex output.',
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

## Headless composable

These composables are experimental. Reactive options accept refs or getters. Pass a writable `modelValue` ref for ref-owned state, or use `onUpdate` to handle controlled updates. `onBeforeUpdate(value, details)` can synchronously call `details.cancel()` to prevent a change. Component users can use `@before-update:model-value` for the same behavior.

`useColorField()` exposes parsing, channel stepping, the editable input value, and a root surface. Call it in setup (or an effect scope). Call `createInputSurface()` once per input to keep focus and IME composition state independent.

```vue
<script setup>
import { useColorField } from 'reka-ui'
import { ref } from 'vue'

const modelValue = ref('#ff0000')
const { root, createInputSurface } = useColorField({ modelValue })
const input = createInputSurface()
</script>

<template>
  <div v-bind="root.attrs.value">
    <input aria-label="Color" v-bind="input.attrs.value">
  </div>
</template>
```

The return also exposes `updateValue`, `commit`, `increment`, `decrement`, page stepping, and min/max actions. Hidden form input rendering remains in `ColorFieldRoot`.

`onUpdate`, `onColorUpdate`, `onChange` and `onChangeEnd` receive `Color` objects, and `onHexUpdate` receives the hex serialization of each accepted color. A field changes only when an edit is committed (Enter or blur) or a value is stepped, so `onChange` and `onChangeEnd` fire together for each change. These callbacks work without a component `emit` function. Returned state refs are read-only; use the exposed actions to request changes.

## Color model

`v-model` accepts a color string (`'#3b82f6'`, `'hsl(217, 91%, 60%)'`) or a `Color` object, and every emitted value is a `Color` object: a plain `{ space, ... }` object in the component's color space, such as `{ space: 'hsl', h: 217, s: 91, l: 60, alpha: 1 }`. A string is parsed once on the way in. Keeping the object keeps information a hex string cannot hold, such as the hue of a grey and fractional channel values, so several color components can share one `v-model` without drift.

`update:color` carries the same `Color` as `update:modelValue`. Listen to `update:hex` when you need a hex string, for example for an API or a text label. Hex is lossy: it drops the hue of greys and anything finer than one 8-bit step, so feed the `Color` back into `v-model`, not the hex. For the same reason `update:hex` can repeat the same string when the color moves by less than one step. A form submits the hex value through the hidden input either way.

```vue
<script setup>
import { ColorFieldInput, ColorFieldRoot } from 'reka-ui'
import { ref } from 'vue'

const color = ref('#3b82f6') // becomes a Color object after the first change
const hex = ref('#3b82f6')
</script>

<template>
  <ColorFieldRoot
    v-model="color"
    @update:hex="hex = $event"
  >
    <ColorFieldInput />
  </ColorFieldRoot>
</template>
```

Use `isEqualColor(a, b)` to compare two colors (strings or objects) structurally, and `colorToHex` or `colorToString` to format one.

A channel field edits the color in the space that holds its channel (the `color-space` prop when it does). So with `channel="hue"`, typing a hue for a grey keeps it, and stepping `saturation` moves by whole steps even when a hex input rounded the channel to a fraction.

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
