---

title: Color Area
description: A two-dimensional area for selecting color values in a specific color space.
name: color-area
---

# Color Area

<Description>
A two-dimensional area control that allows users to select color values by interacting with a visual gradient area. Supports multiple color spaces and configurable channels for each axis.
</Description>

<ComponentPreview name="ColorArea" />

## Features

<Highlights
  :features="[
    'Supports HSL, HSB, and RGB color spaces.',
    'Configurable channels for horizontal (x) and vertical (y) axes.',
    'Full keyboard navigation support.',
    'Pointer/touch interaction for value selection.',
    'Preserves hue information when saturation is 0.',
    'Form integration with hidden inputs.',
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
  ColorAreaArea,
  ColorAreaRoot,
  ColorAreaThumb,
} from 'reka-ui'
</script>

<template>
  <ColorAreaRoot v-slot="{ style }">
    <ColorAreaArea :style="style">
      <ColorAreaThumb />
    </ColorAreaArea>
  </ColorAreaRoot>
</template>
```

## API Reference

### ColorAreaRoot

The root component that provides the color area context and state management.

<!-- @include: @/meta/ColorAreaRoot.md -->

### ColorAreaArea

The interactive area component where users can select color values by clicking or dragging.

<!-- @include: @/meta/ColorAreaArea.md -->

### ColorAreaThumb

The draggable thumb component that indicates the current position in the color area.

<!-- @include: @/meta/ColorAreaThumb.md -->

## Examples

### HSL Saturation/Lightness

A common use case for color area is selecting saturation and lightness in HSL color space.

```vue
<script setup>
import {
  ColorAreaArea,
  ColorAreaRoot,
  ColorAreaThumb,
} from 'reka-ui'
import { ref } from 'vue'

const color = ref('#3b82f6')
</script>

<template>
  <ColorAreaRoot
    v-slot="{ style }"
    v-model="color"
    color-space="hsl"
    x-channel="saturation"
    y-channel="lightness"
  >
    <ColorAreaArea :style="style">
      <ColorAreaThumb />
    </ColorAreaArea>
  </ColorAreaRoot>
</template>
```

### RGB Red/Green Selector

Using RGB color space with red and green channels.

```vue
<script setup>
import {
  ColorAreaArea,
  ColorAreaRoot,
  ColorAreaThumb,
} from 'reka-ui'
import { ref } from 'vue'

const color = ref('#ff0000')
</script>

<template>
  <ColorAreaRoot
    v-slot="{ style }"
    v-model="color"
    color-space="rgb"
    x-channel="red"
    y-channel="green"
  >
    <ColorAreaArea :style="style">
      <ColorAreaThumb />
    </ColorAreaArea>
  </ColorAreaRoot>
</template>
```

### Disabled State

Disable interaction with the color area.

```vue
<script setup>
import {
  ColorAreaArea,
  ColorAreaRoot,
  ColorAreaThumb,
} from 'reka-ui'
import { ref } from 'vue'

const color = ref('#3b82f6')
</script>

<template>
  <ColorAreaRoot
    v-slot="{ style }"
    v-model="color"
    disabled
  >
    <ColorAreaArea :style="style">
      <ColorAreaThumb />
    </ColorAreaArea>
  </ColorAreaRoot>
</template>
```

## Accessibility

### Keyboard Interactions

| Key | Description |
| --- | --- |
| `ArrowLeft` | Decreases the x-axis channel value by one step. |
| `ArrowRight` | Increases the x-axis channel value by one step. |
| `ArrowUp` | Increases the y-axis channel value by one step. |
| `ArrowDown` | Decreases the y-axis channel value by one step. |
| `Shift + ArrowKey` | Changes values by 10 steps at a time. |
| `PageUp` | Increases the y-axis channel value by a larger step. |
| `PageDown` | Decreases the y-axis channel value by a larger step. |
| `Home` | Jumps left (decreases x-axis value). |
| `End` | Jumps right (increases x-axis value). |
