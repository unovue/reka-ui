---
title: Tooltip
description: A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it.
name: tooltip
aria: https://www.w3.org/WAI/ARIA/apg/patterns/tooltip
---

# Tooltip

<Description>
A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it.
</Description>

<ComponentPreview name="Tooltip" />

## Features

<Highlights
  :features="[
    'Provider to control display delay globally.',
    'Opens when the trigger is focused or hovered.',
    'Closes when the trigger is activated or when pressing escape.',
    'Supports custom timings.']"
/>

## Anatomy

Import all parts and piece them together.

```vue
<script setup lang="ts">
import { TooltipArrow, TooltipContent, TooltipPortal, TooltipProvider, TooltipRoot, TooltipTrigger } from 'reka-ui'
</script>

<template>
  <TooltipProvider>
    <TooltipRoot>
      <TooltipTrigger />
      <TooltipPortal>
        <TooltipContent>
          <TooltipArrow />
        </TooltipContent>
      </TooltipPortal>
    </TooltipRoot>
  </TooltipProvider>
</template>
```

## API Reference

### Provider

Wraps your app to provide global functionality to your tooltips.

<!-- @include: @/meta/TooltipProvider.md -->

### Root

Contains all the parts of a tooltip.

<!-- @include: @/meta/TooltipRoot.md -->

### Trigger

The button that toggles the tooltip. By default, the `TooltipContent` will position itself against the trigger.

<!-- @include: @/meta/TooltipTrigger.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['closed', 'delayed-open', 'instant-open'],
    },
  ]"
/>

### Portal

When used, portals the content part into the `body`.

<!-- @include: @/meta/TooltipPortal.md -->

### Content

The component that pops out when the tooltip is open.

<PresenceCallout />

<!-- @include: @/meta/TooltipContent.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['closed', 'delayed-open', 'instant-open'],
    },
    {
      attribute: '[data-side]',
      values: ['left', 'right', 'bottom', 'top'],
    },
    {
      attribute: '[data-align]',
      values: ['start', 'end', 'center'],
    },
  ]"
/>

<CssVariablesTable
  :data="[
    {
      cssVariable: '--reka-tooltip-content-transform-origin',
      description: ' The <Code>transform-origin</Code> computed from the content and arrow positions/offsets',
    },
    {
      cssVariable: '--reka-tooltip-content-available-width',
      description: 'The remaining width between the trigger and the boundary edge',
    },
    {
      cssVariable: '--reka-tooltip-content-available-height',
      description: 'The remaining height between the trigger and the boundary edge',
    },
    {
      cssVariable: '--reka-tooltip-trigger-width',
      description: 'The width of the trigger',
    },
    {
      cssVariable: '--reka-tooltip-trigger-height',
      description: 'The height of the trigger',
    },
  ]"
/>

### Arrow

An optional arrow element to render alongside the tooltip. This can be used to help visually link the trigger with the `TooltipContent`. Must be rendered inside `TooltipContent`.

<!-- @include: @/meta/TooltipArrow.md -->

## Examples

### Configure globally

Use the `Provider` to control `delayDuration` and `skipDelayDuration` globally.

```vue line=7-8
<script setup>
import { TooltipContent, TooltipProvider, TooltipRoot, TooltipTrigger } from 'reka-ui'
</script>

<template>
  <TooltipProvider
    :delay-duration="800"
    :skip-delay-duration="500"
  >
    <TooltipRoot>
      <TooltipTrigger>…</TooltipTrigger>
      <TooltipContent>…</TooltipContent>
    </TooltipRoot>
    <TooltipRoot>
      <TooltipTrigger>…</TooltipTrigger>
      <TooltipContent>…</TooltipContent>
    </TooltipRoot>
  </TooltipProvider>
</template>
```

### Show instantly

Use the `delayDuration` prop to control the time it takes for the tooltip to open.

```vue line=6
<script setup>
import { TooltipContent, TooltipProvider, TooltipRoot, TooltipTrigger } from 'reka-ui'
</script>

<template>
  <TooltipRoot :delay-duration="0">
    <TooltipTrigger>…</TooltipTrigger>
    <TooltipContent>…</TooltipContent>
  </TooltipRoot>
</template>
```

### Displaying a tooltip from a disabled button

Since disabled buttons don't fire events, you need to:

- Render the `Trigger` as `span`.
- Ensure the `button` has no `pointerEvents`.

```vue line=7-11
<script setup>
import { TooltipContent, TooltipProvider, TooltipRoot, TooltipTrigger } from 'reka-ui'
</script>

<template>
  <TooltipRoot>
    <TooltipTrigger as-child>
      <span tabindex="0">
        <button
          disabled
          style="{ pointerEvents: 'none' }"
        >…</button>
      </span>
    </TooltipTrigger>
    <TooltipContent>…</TooltipContent>
  </TooltipRoot>
</template>
```

### Constrain the content size

You may want to constrain the width of the content so that it matches the trigger width. You may also want to constrain its height to not exceed the viewport.

We expose several CSS custom properties such as `--reka-tooltip-trigger-width` and `--reka-tooltip-content-available-height` to support this. Use them to constrain the content dimensions.

```vue line=10
<script setup>
import { TooltipContent, TooltipProvider, TooltipRoot, TooltipTrigger } from 'reka-ui'
</script>

<template>
  <TooltipRoot>
    <TooltipTrigger>…</TooltipTrigger>
    <TooltipPortal>
      <TooltipContent
        class="TooltipContent"
        :side-offset="5"
      >
        …
      </TooltipContent>
    </TooltipPortal>
  </TooltipRoot>
</template>
```

```css line=3,4
/* styles.css */
.TooltipContent {
  width: var(--reka-tooltip-trigger-width);
  max-height: var(--reka-tooltip-content-available-height);
}
```

### Origin-aware animations

We expose a CSS custom property `--reka-tooltip-content-transform-origin`. Use it to animate the content from its computed origin based on `side`, `sideOffset`, `align`, `alignOffset` and any collisions.

```vue line=8
<script setup>
import { TooltipContent, TooltipProvider, TooltipRoot, TooltipTrigger } from 'reka-ui'
</script>

<template>
  <TooltipRoot>
    <TooltipTrigger>…</TooltipTrigger>
    <TooltipContent class="TooltipContent">
      …
    </TooltipContent>
  </TooltipRoot>
</template>
```

```css line=3-4
/* styles.css */
.TooltipContent {
  transform-origin: var(--reka-tooltip-content-transform-origin);
  animation: scaleIn 0.5s ease-out;
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

### Collision-aware animations

We expose `data-side` and `data-align` attributes. Their values will change at runtime to reflect collisions. Use them to create collision and direction-aware animations.

```vue line=8
<script setup>
import { TooltipContent, TooltipProvider, TooltipRoot, TooltipTrigger } from 'reka-ui'
</script>

<template>
  <TooltipRoot>
    <TooltipTrigger>…</TooltipTrigger>
    <TooltipContent class="TooltipContent">
      …
    </TooltipContent>
  </TooltipRoot>
</template>
```

```css line=6,9
/* styles.css */
.TooltipContent {
  animation-duration: 0.6s;
  animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
}
.TooltipContent[data-side="top"] {
  animation-name: slideUp;
}
.TooltipContent[data-side="bottom"] {
  animation-name: slideDown;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

## Accessibility

### Keyboard Interactions

<KeyboardTable
:data="[
{
keys: ['Tab'],
description: 'Opens/closes the tooltip without delay.',
},
{
keys: ['Space'],
description: 'If open, closes the tooltip without delay.',
},
{
keys: ['Enter'],
description: 'If open, closes the tooltip without delay.',
},
{
keys: ['Escape'],
description: 'If open, closes the tooltip without delay.',
},
]"
/>

## Custom APIs

Create your own API by abstracting the primitive parts into your own component.

### Abstract parts and introduce a content prop

This example abstracts all of the `Tooltip` parts and introduces a new `content` prop.

#### Usage

```vue
<script setup lang="ts">
import { Tooltip } from './your-tooltip'
</script>

<template>
  <Tooltip content="Tooltip content">
    <button>Tooltip trigger</button>
  </Tooltip>
</template>
```

#### Implementation

Use the [`asChild` prop](/docs/guides/composition) to convert the trigger part into a slottable area. It will replace the trigger with the child that gets passed to it.

```vue line=13-15
<!-- your-tooltip.vue  -->
<script setup lang="ts">
import { TooltipArrow, TooltipContent, TooltipRoot, type TooltipRootEmits, type TooltipRootProps, TooltipTrigger, useForwardPropsEmits } from 'reka-ui'

const props = defineProps<TooltipRootProps & { content?: string }>()
const emits = defineEmits<TooltipRootEmits>()

const forward = useForwardPropsEmits(props, emits)
</script>

<template>
  <TooltipRoot v-bind="forward">
    <TooltipTrigger as-child>
      <slot />
    </TooltipTrigger>
    <TooltipContent
      side="top"
      align="center"
    >
      {{ content }}
      <TooltipArrow
        :width="11"
        :height="5"
      />
    </TooltipContent>
  </TooltipRoot>
</template>
```
