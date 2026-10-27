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
    'Emits a lossless Color object, with an opt-in hex output.',
    'Supports right-to-left direction.',
    'Form integration with hidden inputs.',
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

## Headless composable

These composables are experimental. Reactive options accept refs or getters. Pass a writable `modelValue` ref for ref-owned state, or use `onUpdate` to handle controlled updates. `onBeforeUpdate(value, details)` can synchronously call `details.cancel()` to prevent a change. Component users can use `@before-update:model-value` for the same behavior.

`useColorArea()` exposes the model, exact channel values, background styles, and shared root and thumb surfaces. The channel values and the thumb position are derived from the model, so a controlled parent that rejects an update keeps the thumb where the model is. Create one area surface per element. Render the `xInput` and `yInput` surfaces as two `<input>` elements inside the thumb and bind them with `setInputElement`, so pointer interaction and the arrow keys can focus them; they carry the area's semantics (see [Accessibility](#accessibility)). Pass `dir: 'rtl'` to mirror the x axis.

```vue
<script setup>
import { useColorArea } from 'reka-ui'
import { ref } from 'vue'

const areaElement = ref()
const { root, thumb, xInput, yInput, setInputElement, areaStyles, createAreaSurface, updateValues } = useColorArea({
  defaultValue: '#ff0000',
  xChannel: 'saturation',
  yChannel: 'lightness',
})
const area = createAreaSurface(areaElement)
// Programmatic changes use the same cancellable update path.
updateValues(75, 50)
</script>

<template>
  <div v-bind="root.attrs.value">
    <div
      ref="areaElement"
      v-bind="area.attrs.value"
      :style="[areaStyles, { position: 'relative', width: '200px', height: '200px' }]"
    >
      <span v-bind="thumb.attrs.value">
        <input :ref="el => setInputElement('x', el)" v-bind="xInput.attrs.value">
        <input :ref="el => setInputElement('y', el)" v-bind="yInput.attrs.value">
      </span>
    </div>
  </div>
</template>
```

Hidden form inputs remain part of `ColorAreaRoot`; add them yourself when rendering the composable directly.

`onUpdate`, `onColorUpdate`, `onChange` and `onChangeEnd` receive `Color` objects, and `onHexUpdate` receives the hex serialization of each accepted color. `onChange` fires for every change, `onChangeEnd` once the pointer is released and after each keyboard step. These callbacks work without a component `emit` function. Returned state refs are read-only; use the exposed actions to request changes.

## Color model

`v-model` accepts a color string (`'#3b82f6'`, `'hsl(217, 91%, 60%)'`) or a `Color` object, and every emitted value is a `Color` object: a plain `{ space, ... }` object in the component's color space, such as `{ space: 'hsl', h: 217, s: 91, l: 60, alpha: 1 }`. A string is parsed once on the way in. Keeping the object keeps information a hex string cannot hold, such as the hue of a grey and fractional channel values, so several color components can share one `v-model` without drift.

`update:color` carries the same `Color` as `update:modelValue`. Listen to `update:hex` when you need a hex string, for example for an API or a text label. Hex is lossy: it drops the hue of greys and anything finer than one 8-bit step, so feed the `Color` back into `v-model`, not the hex. For the same reason `update:hex` can repeat the same string when the color moves by less than one step. A form submits the hex value through the hidden input either way.

```vue
<script setup>
import { ColorAreaArea, ColorAreaRoot, ColorAreaThumb } from 'reka-ui'
import { ref } from 'vue'

const color = ref('#3b82f6') // becomes a Color object after the first change
const hex = ref('#3b82f6')
</script>

<template>
  <ColorAreaRoot
    v-slot="{ style }"
    v-model="color"
    @update:hex="hex = $event"
  >
    <ColorAreaArea :style="style">
      <ColorAreaThumb />
    </ColorAreaArea>
  </ColorAreaRoot>
</template>
```

Use `isEqualColor(a, b)` to compare two colors (strings or objects) structurally, and `colorToHex` or `colorToString` to format one.

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

Each channel is a native `input type="range"`, visually hidden inside `ColorAreaThumb`, as in React Aria's ColorArea. The x input is named after the x channel (for example "Saturation") with `aria-orientation="horizontal"`, and the y input after the y channel with `aria-orientation="vertical"`. Each reports its own value, with the other channel as context in `aria-valuetext` ("50, Lightness 40"), and is described as a "2D slider". Screen readers read them like any slider, and mobile screen readers can adjust them with their swipe gestures.

Only one input is in the tab order: the x input, or the y input once it has had focus. An arrow key moves focus to the input of the axis it changes, so the screen reader announces that channel. The area itself has no role; it is the pointer surface.

The thumb does not receive focus itself, so style its focus ring with `:focus-within` (Tailwind: `focus-within:`) on the thumb or the area, or `:has(:focus-visible)` for keyboard focus only. With `<ColorAreaThumb as-child>` the inputs cannot go inside your element: they render next to it, placed at the thumb's position, so put the focus style on `ColorAreaArea`.

Enter on a channel input does not submit an enclosing form.

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
| `Home` | Decreases the x-axis channel value by a larger step. |
| `End` | Increases the x-axis channel value by a larger step. |

In right-to-left mode (`dir="rtl"`, or inherited from `ConfigProvider`) the x axis runs from right to left: `ArrowLeft` increases and `ArrowRight` decreases the x-axis value, and the thumb and the background gradient are mirrored.
