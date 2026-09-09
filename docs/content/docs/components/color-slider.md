---

title: Color Slider
description: A slider control for adjusting individual color channels.
name: color-slider
---

# Color Slider

<Badge>Alpha</Badge>

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
    'Preserves color precision during drag operations.',
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

`useColorSlider()` exposes precise channel state and root, track, and thumb surfaces. Call it in setup (or an effect scope). The surfaces compose with `SliderRoot`, `SliderTrack`, and `SliderThumb`, which supply pointer interaction, keyboard navigation, and positioning.

```vue
<script setup>
import { SliderRoot, SliderThumb, SliderTrack, useColorSlider } from 'reka-ui'

const { root, track, thumb, setValue } = useColorSlider({
  channel: 'hue',
  defaultValue: '#ff0000',
})
setValue([120])
</script>

<template>
  <SliderRoot v-bind="root.attrs.value">
    <SliderTrack v-bind="track.attrs.value" />
    <SliderThumb v-bind="thumb.attrs.value" />
  </SliderRoot>
</template>
```

Binding these surfaces to plain elements does not supply Slider interactions. Delegated updates have the `slider` reason; Slider's model event does not supply a native event. Hidden color form inputs remain in `ColorSliderRoot`.

## API Reference

### ColorSliderRoot

The root component that provides the slider functionality and context.

<!-- @include: @/meta/ColorSliderRoot.md -->

### ColorSliderTrack

The track component that displays the color gradient background.

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

A vertical slider for space-constrained layouts.

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
