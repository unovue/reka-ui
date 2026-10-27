---

title: Color Slider
description: A slider control for adjusting individual color channels.
name: color-slider
---

# Color Slider

<Description>
A slider component for adjusting individual color channels. Supports all color channels including hue, saturation, lightness, brightness, red, green, blue, and alpha with automatic gradient backgrounds.
</Description>

<ComponentPreview name="ColorSlider" />

## Features

<Highlights
  :features="[
    'Supports all color channels (hue, saturation, lightness, brightness, red, green, blue, alpha).',
    'Automatic gradient background based on current color.',
    'Horizontal and vertical orientations.',
    'Full keyboard navigation support.',
    'Configurable step values.',
    'Emits a lossless Color object, with an opt-in hex output.',
    'Form integration with hidden inputs.',
    'Support for HSL, HSB, and RGB color spaces.',
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
  ColorSliderRoot,
  ColorSliderThumb,
  ColorSliderTrack,
} from 'reka-ui'
</script>

<template>
  <ColorSliderRoot channel="hue">
    <ColorSliderTrack />
    <ColorSliderThumb />
  </ColorSliderRoot>
</template>
```

## Headless composable

These composables are experimental. Reactive options accept refs or getters. Pass a writable `modelValue` ref for ref-owned state, or use `onUpdate` to handle controlled updates. `onBeforeUpdate(value, details)` can synchronously call `details.cancel()` to prevent a change. Component users can use `@before-update:model-value` for the same behavior.

`useColorSlider()` exposes precise channel state and root, track, and thumb surfaces. It holds no watchers and can be called outside setup. The surfaces compose with `SliderRoot`, `SliderTrack`, and `SliderThumb`, which supply pointer interaction, keyboard navigation, and positioning.

```vue
<script setup>
import { SliderRoot, SliderThumb, SliderTrack, useColorSlider } from 'reka-ui'

const { sliderProps, track, thumb, setValue } = useColorSlider({
  channel: 'hue',
  defaultValue: '#ff0000',
})
setValue([120])
</script>

<template>
  <SliderRoot v-bind="sliderProps">
    <SliderTrack v-bind="track.attrs.value" />
    <SliderThumb v-bind="thumb.attrs.value" />
  </SliderRoot>
</template>
```

Binding these surfaces to plain elements does not supply Slider interactions. Delegated updates have the `slider` reason; Slider's model event does not supply a native event. Hidden color form inputs remain in `ColorSliderRoot`.

`root.attrs` contains only DOM attributes. `sliderProps` contains the bindings for the child component shown above.

`onUpdate`, `onColorUpdate`, `onChange` and `onChangeEnd` receive `Color` objects, and `onHexUpdate` receives the hex serialization of each accepted color. `onChange` fires for every change, `onChangeEnd` once a drag that changed the color ends and after each keyboard step. These callbacks work without a component `emit` function. Returned state refs are read-only; use the exposed actions to request changes.

## Color model

`v-model` accepts a color string (`'#3b82f6'`, `'hsl(217, 91%, 60%)'`) or a `Color` object, and every emitted value is a `Color` object: a plain `{ space, ... }` object in the component's color space, such as `{ space: 'hsl', h: 217, s: 91, l: 60, alpha: 1 }`. A string is parsed once on the way in. Keeping the object keeps information a hex string cannot hold, such as the hue of a grey and fractional channel values, so several color components can share one `v-model` without drift.

`update:color` carries the same `Color` as `update:modelValue`. Listen to `update:hex` when you need a hex string, for example for an API or a text label. Hex is lossy: it drops the hue of greys and anything finer than one 8-bit step, so feed the `Color` back into `v-model`, not the hex. For the same reason `update:hex` can repeat the same string when the color moves by less than one step. A form submits the hex value through the hidden input either way.

```vue
<script setup>
import { ColorSliderRoot, ColorSliderThumb, ColorSliderTrack } from 'reka-ui'
import { ref } from 'vue'

const color = ref('#3b82f6') // becomes a Color object after the first change
const hex = ref('#3b82f6')
</script>

<template>
  <ColorSliderRoot
    v-model="color"
    channel="hue"
    @update:hex="hex = $event"
  >
    <ColorSliderTrack />
    <ColorSliderThumb />
  </ColorSliderRoot>
</template>
```

Use `isEqualColor(a, b)` to compare two colors (strings or objects) structurally, and `colorToHex` or `colorToString` to format one.

## API Reference

### ColorSliderRoot

The root component that provides the slider functionality and context.

<!-- @include: @/meta/ColorSliderRoot.md -->

### ColorSliderTrack

The track component that displays the color gradient background. The gradient runs from the slider's minimum to its maximum, so it follows `orientation`, `inverted` and the reading direction (`dir`, or inherited from `ConfigProvider`).

<!-- @include: @/meta/ColorSliderTrack.md -->

### ColorSliderThumb

The draggable thumb component for selecting values.

<!-- @include: @/meta/ColorSliderThumb.md -->

## Examples

### Hue Slider

A horizontal hue slider in HSL color space.

```vue
<script setup>
import {
  ColorSliderRoot,
  ColorSliderThumb,
  ColorSliderTrack,
} from 'reka-ui'
import { ref } from 'vue'

const color = ref('#3b82f6')
</script>

<template>
  <ColorSliderRoot
    v-model="color"
    channel="hue"
    color-space="hsl"
  >
    <ColorSliderTrack />
    <ColorSliderThumb />
  </ColorSliderRoot>
</template>
```

### Alpha Channel

Slider for adjusting the alpha (opacity) channel.

```vue
<script setup>
import {
  ColorSliderRoot,
  ColorSliderThumb,
  ColorSliderTrack,
} from 'reka-ui'
import { ref } from 'vue'

const color = ref('#3b82f6')
</script>

<template>
  <ColorSliderRoot
    v-model="color"
    channel="alpha"
  >
    <ColorSliderTrack />
    <ColorSliderThumb />
  </ColorSliderRoot>
</template>
```

### Vertical Orientation

A vertical slider for space-constrained layouts. The track gradient runs from bottom to top, or top to bottom with `inverted`.

```vue
<script setup>
import {
  ColorSliderRoot,
  ColorSliderThumb,
  ColorSliderTrack,
} from 'reka-ui'
import { ref } from 'vue'

const color = ref('#3b82f6')
</script>

<template>
  <ColorSliderRoot
    v-model="color"
    channel="lightness"
    orientation="vertical"
    class="h-[200px]"
  >
    <ColorSliderTrack />
    <ColorSliderThumb />
  </ColorSliderRoot>
</template>
```

### RGB Channel Sliders

Sliders for individual RGB channels.

```vue
<script setup>
import {
  ColorSliderRoot,
  ColorSliderThumb,
  ColorSliderTrack,
} from 'reka-ui'
import { ref } from 'vue'

const color = ref('#3b82f6')
</script>

<template>
  <div class="flex flex-col gap-4">
    <ColorSliderRoot
      v-model="color"
      channel="red"
      color-space="rgb"
    >
      <ColorSliderTrack />
      <ColorSliderThumb />
    </ColorSliderRoot>

    <ColorSliderRoot
      v-model="color"
      channel="green"
      color-space="rgb"
    >
      <ColorSliderTrack />
      <ColorSliderThumb />
    </ColorSliderRoot>

    <ColorSliderRoot
      v-model="color"
      channel="blue"
      color-space="rgb"
    >
      <ColorSliderTrack />
      <ColorSliderThumb />
    </ColorSliderRoot>
  </div>
</template>
```

### Custom Step Value

Use a custom step increment for finer or coarser control.

```vue
<script setup>
import {
  ColorSliderRoot,
  ColorSliderThumb,
  ColorSliderTrack,
} from 'reka-ui'
import { ref } from 'vue'

const color = ref('#3b82f6')
</script>

<template>
  <ColorSliderRoot
    v-model="color"
    channel="hue"
    :step="5"
  >
    <ColorSliderTrack />
    <ColorSliderThumb />
  </ColorSliderRoot>
</template>
```

## Accessibility

### Keyboard Interactions

| Key | Description |
| --- | --- |
| `ArrowLeft` | Decreases the value in horizontal orientation. |
| `ArrowRight` | Increases the value in horizontal orientation. |
| `ArrowUp` | Increases the value in vertical orientation. |
| `ArrowDown` | Decreases the value in vertical orientation. |
| `PageUp` | Increases the value by a larger step. |
| `PageDown` | Decreases the value by a larger step. |
| `Home` | Sets the value to minimum. |
| `End` | Sets the value to maximum. |
