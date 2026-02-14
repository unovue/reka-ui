---

title: SliderArea
description: A two-dimensional input where the user selects a point within a given region.
name: slider-area
aria: https://www.w3.org/WAI/ARIA/apg/patterns/slider
---

# Slider Area

<Description>
A two-dimensional input where the user selects a point within a given region.
</Description>

<ComponentPreview name="SliderArea" />

## Features

<Highlights
  :features="[
    'Can be controlled or uncontrolled.',
    'Supports multiple thumbs.',
    'Supports touch or click on track to update value.',
    'Supports Right to Left direction.',
    'Full keyboard navigation.',
    'Separate X and Y axis configuration.',
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
  SliderAreaRegion,
  SliderAreaRoot,
  SliderAreaThumb,
  SliderAreaThumbX,
  SliderAreaThumbY,
  SliderAreaTrack,
} from 'reka-ui'
</script>

<template>
  <SliderAreaRoot>
    <SliderAreaTrack>
      <SliderAreaRegion />
    </SliderAreaTrack>
    <SliderAreaThumb>
      <SliderAreaThumbX />
      <SliderAreaThumbY />
    </SliderAreaThumb>
  </SliderAreaRoot>
</template>
```

## API Reference

### Root

Contains all the parts of a slider area. It will render an `input` when used within a `form` to ensure events propagate correctly.

<!-- @include: @/meta/SliderAreaRoot.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    },
  ]"
/>

### Track

The track that contains the `SliderAreaRegion`.

<!-- @include: @/meta/SliderAreaTrack.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    },
  ]"
/>

### Region

The region part. Must live inside `SliderAreaTrack`. Represents the area between the origin and the thumb(s).

<!-- @include: @/meta/SliderAreaRegion.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    },
  ]"
/>

### Thumb

A draggable thumb that positions itself within the 2D area. Must contain `SliderAreaThumbX` and `SliderAreaThumbY`. You can render multiple thumbs.

<!-- @include: @/meta/SliderAreaThumb.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    },
  ]"
/>

### ThumbX

The horizontal slider element inside a `SliderAreaThumb`. Provides the `role="slider"` for the X axis and handles focus for horizontal keyboard navigation.

<!-- @include: @/meta/SliderAreaThumbX.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    },
  ]"
/>

### ThumbY

The vertical slider element inside a `SliderAreaThumb`. Provides the `role="slider"` for the Y axis and handles focus for vertical keyboard navigation.

<!-- @include: @/meta/SliderAreaThumbY.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    },
  ]"
/>

## Examples

### Define step size

Use the `stepX` and `stepY` props to increase the stepping interval for each axis.

```vue line=9-10
// index.vue
<script setup>
import { SliderAreaRegion, SliderAreaRoot, SliderAreaThumb, SliderAreaThumbX, SliderAreaThumbY, SliderAreaTrack } from 'reka-ui'
</script>

<template>
  <SliderAreaRoot
    :default-value="[[50, 50]]"
    :step-x="10"
    :step-y="10"
  >
    <SliderAreaTrack>
      <SliderAreaRegion />
    </SliderAreaTrack>
    <SliderAreaThumb>
      <SliderAreaThumbX />
      <SliderAreaThumbY />
    </SliderAreaThumb>
  </SliderAreaRoot>
</template>
```

### Custom axis ranges

Use the `minX`, `maxX`, `minY`, and `maxY` props to define custom ranges for each axis.

```vue line=8-11
// index.vue
<script setup>
import { SliderAreaRegion, SliderAreaRoot, SliderAreaThumb, SliderAreaThumbX, SliderAreaThumbY, SliderAreaTrack } from 'reka-ui'
</script>

<template>
  <SliderAreaRoot
    :min-x="0"
    :max-x="360"
    :min-y="0"
    :max-y="100"
    :default-value="[[180, 50]]"
  >
    <SliderAreaTrack>
      <SliderAreaRegion />
    </SliderAreaTrack>
    <SliderAreaThumb>
      <SliderAreaThumbX />
      <SliderAreaThumbY />
    </SliderAreaThumb>
  </SliderAreaRoot>
</template>
```

### Multiple thumbs

Add multiple `SliderAreaThumb` components to create a multi-point slider area.

```vue line=7,14-21
// index.vue
<script setup>
import { SliderAreaRegion, SliderAreaRoot, SliderAreaThumb, SliderAreaThumbX, SliderAreaThumbY, SliderAreaTrack } from 'reka-ui'
</script>

<template>
  <SliderAreaRoot :default-value="[[25, 25], [75, 75]]">
    <SliderAreaTrack>
      <SliderAreaRegion />
    </SliderAreaTrack>
    <SliderAreaThumb>
      <SliderAreaThumbX />
      <SliderAreaThumbY />
    </SliderAreaThumb>
    <SliderAreaThumb>
      <SliderAreaThumbX />
      <SliderAreaThumbY />
    </SliderAreaThumb>
  </SliderAreaRoot>
</template>
```

### Prevent thumb overlap

Use `minXStepsBetweenThumbs` and `minYStepsBetweenThumbs` to enforce a minimum distance between thumbs on each axis. Each axis is constrained independently — restricting one axis does not prevent movement on the other.

```vue line=10-11
// index.vue
<script setup>
import { SliderAreaRegion, SliderAreaRoot, SliderAreaThumb, SliderAreaThumbX, SliderAreaThumbY, SliderAreaTrack } from 'reka-ui'
</script>

<template>
  <SliderAreaRoot
    :default-value="[[25, 25], [75, 75]]"
    :step-x="10"
    :step-y="10"
    :min-x-steps-between-thumbs="1"
    :min-y-steps-between-thumbs="1"
  >
    <SliderAreaTrack>
      <SliderAreaRegion />
    </SliderAreaTrack>
    <SliderAreaThumb>
      <SliderAreaThumbX />
      <SliderAreaThumbY />
    </SliderAreaThumb>
    <SliderAreaThumb>
      <SliderAreaThumbX />
      <SliderAreaThumbY />
    </SliderAreaThumb>
  </SliderAreaRoot>
</template>
```

### Inverted axes

Use the `invertedX` and `invertedY` props to invert the direction of each axis.

```vue line=9-10
// index.vue
<script setup>
import { SliderAreaRegion, SliderAreaRoot, SliderAreaThumb, SliderAreaThumbX, SliderAreaThumbY, SliderAreaTrack } from 'reka-ui'
</script>

<template>
  <SliderAreaRoot
    :default-value="[[20, 30]]"
    inverted-x
    inverted-y
  >
    <SliderAreaTrack>
      <SliderAreaRegion />
    </SliderAreaTrack>
    <SliderAreaThumb>
      <SliderAreaThumbX />
      <SliderAreaThumbY />
    </SliderAreaThumb>
  </SliderAreaRoot>
</template>
```

### Thumb alignment

Use the `thumbAlignment` prop to control how the thumb is positioned relative to the track edges.

- `overflow` (default): the thumb can visually overflow the track boundaries.
- `contain`: the thumb is contained within the track boundaries.

```vue line=9
// index.vue
<script setup>
import { SliderAreaRegion, SliderAreaRoot, SliderAreaThumb, SliderAreaThumbX, SliderAreaThumbY, SliderAreaTrack } from 'reka-ui'
</script>

<template>
  <SliderAreaRoot
    :default-value="[[50, 50]]"
    thumb-alignment="contain"
  >
    <SliderAreaTrack>
      <SliderAreaRegion />
    </SliderAreaTrack>
    <SliderAreaThumb>
      <SliderAreaThumbX />
      <SliderAreaThumbY />
    </SliderAreaThumb>
  </SliderAreaRoot>
</template>
```

## Accessibility

Adheres to the [Slider WAI-ARIA design pattern](https://www.w3.org/WAI/ARIA/apg/patterns/slider).

### Keyboard Interactions

<KeyboardTable
  :data="[
    {
      keys: ['ArrowRight'],
      description: 'Increases the X value by the <Code>stepX</Code> amount.',
    },
    {
      keys: ['ArrowLeft'],
      description: 'Decreases the X value by the <Code>stepX</Code> amount.',
    },
    {
      keys: ['ArrowDown'],
      description: 'Increases the Y value by the <Code>stepY</Code> amount.',
    },
    {
      keys: ['ArrowUp'],
      description: 'Decreases the Y value by the <Code>stepY</Code> amount.',
    },
    {
      keys: ['Shift + ArrowRight'],
      description: 'Increases the X value by a larger <Code>stepX</Code>.',
    },
    {
      keys: ['Shift + ArrowLeft'],
      description: 'Decreases the X value by a larger <Code>stepX</Code>.',
    },
    {
      keys: ['Shift + ArrowDown'],
      description: 'Increases the Y value by a larger <Code>stepY</Code>.',
    },
    {
      keys: ['Shift + ArrowUp'],
      description: 'Decreases the Y value by a larger <Code>stepY</Code>.',
    },
    {
      keys: ['Home'],
      description: 'Sets the X value to its minimum.',
    },
    {
      keys: ['End'],
      description: 'Sets the X value to its maximum.',
    },
    {
      keys: ['PageUp'],
      description: 'Sets the Y value to its minimum.',
    },
    {
      keys: ['PageDown'],
      description: 'Sets the Y value to its maximum.',
    },
  ]"
/>

#### Inverted axes

When axes are inverted, some keyboard controls are inverted as well:

- When <Code>invertedX</Code> is set, <kbd>ArrowRight</kbd>, <kbd>ArrowLeft</kbd>, <kbd>Home</kbd>, and <kbd>End</kbd> are inverted.
- When <Code>invertedY</Code> is set, <kbd>ArrowUp</kbd>, <kbd>ArrowDown</kbd>, <kbd>PageUp</kbd>, and <kbd>PageDown</kbd> are inverted.

## Custom APIs

Create your own API by abstracting the primitive parts into your own component.

### Abstract all parts

This example abstracts all of the `SliderArea` parts so it can be used as a self-closing element.

#### Usage

```vue
<script setup lang="ts">
import { SliderArea } from './your-slider-area'
</script>

<template>
  <SliderArea :default-value="[[50, 50]]" />
</template>
```

#### Implementation

 ```ts
// your-slider-area.ts
export { default as SliderArea } from './SliderArea.vue'
```

```vue
 <!-- SliderArea.vue -->
<script setup lang="ts">
import type { SliderAreaRootEmits, SliderAreaRootProps } from 'reka-ui'
import { SliderAreaRegion, SliderAreaRoot, SliderAreaThumb, SliderAreaThumbX, SliderAreaThumbY, SliderAreaTrack, useForwardPropsEmits } from 'reka-ui'

const props = defineProps<SliderAreaRootProps>()
const emits = defineEmits<SliderAreaRootEmits>()

const forward = useForwardPropsEmits(props, emits)
</script>

<template>
  <SliderAreaRoot v-slot="{ modelValue }" v-bind="forward">
    <SliderAreaTrack>
      <SliderAreaRegion />
    </SliderAreaTrack>

    <SliderAreaThumb
      v-for="(_, i) in modelValue"
      :key="i"
    >
      <SliderAreaThumbX />
      <SliderAreaThumbY />
    </SliderAreaThumb>
  </SliderAreaRoot>
</template>
```

## Caveats

### Mouse events are not fired

Because of a limitation in the implementation, the following example won't work as expected and the `@mousedown` and `@mouseup` event handlers won't be fired:

```vue
<SliderAreaRoot
  @mousedown="() => { console.log('onMouseDown')  }"
  @mouseup="() => { console.log('onMouseUp')  }"
>
  …
</SliderAreaRoot>
```

We recommend using pointer events instead (eg. `@pointerdown`, `@pointerup`). Regardless of the above limitation, these events are better suited for cross-platform/device handling as they are fired for all pointer input types (mouse, touch, pen, etc.).
