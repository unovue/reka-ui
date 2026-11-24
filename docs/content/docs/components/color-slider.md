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
