---

title: Drawer
description: A panel that slides in from the edge of the screen, with support for swipe-to-dismiss, snap points, and nested drawers.
name: drawer
aria: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
---

# Drawer

<Badge>Alpha</Badge>

<Description>
A panel that slides in from the edge of the screen, with support for swipe-to-dismiss, snap points, and nested drawers.
</Description>

<ComponentPreview name="Drawer" />

## Features

<Highlights
  :features="[
    'Slides in from any edge — bottom, top, left or right.',
    'Swipe-to-dismiss with momentum, plus optional swipe-to-open.',
    'Supports snap points for partially-open resting positions.',
    'Modal, focus-trapped non-modal, and fully non-modal modes.',
    'Can be controlled or uncontrolled.',
    '<span>Manages screen reader announcements with <Code>Title</Code> and <Code>Description</Code> components.</span>',
    'Esc closes the component automatically.',
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
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHandle,
  DrawerOverlay,
  DrawerPortal,
  DrawerRoot,
  DrawerTitle,
  DrawerTrigger,
} from 'reka-ui'
</script>

<template>
  <DrawerRoot>
    <DrawerTrigger />
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerHandle />
        <DrawerTitle />
        <DrawerDescription />
        <DrawerClose />
      </DrawerContent>
    </DrawerPortal>
  </DrawerRoot>
</template>
```

## Animating the drawer

The Drawer is unstyled, so the enter/exit transitions and the swipe gesture are
driven entirely by your CSS. `DrawerContent` exposes the drag offset through CSS
custom properties so you can wire up the live transform:

- `--drawer-swipe-movement-y` — vertical drag offset (for top/bottom drawers)
- `--drawer-swipe-movement-x` — horizontal drag offset (for left/right drawers)
- `--drawer-snap-point-offset` — offset of the active snap point, when snap points are used
- `--drawer-swipe-progress` — `0` at rest, approaching `1` as the drawer is swiped away

```css
.DrawerContent {
  /* Follow the pointer while dragging. */
  transform: translateY(var(--drawer-swipe-movement-y, 0px));
  transition: transform 450ms cubic-bezier(0.32, 0.72, 0, 1);
}

/* Use the independent `translate` property for the enter/exit keyframes so they
   compose with the `transform` above instead of clobbering the drag offset. */
.DrawerContent[data-state='open'] {
  animation: slideIn 450ms cubic-bezier(0.32, 0.72, 0, 1);
}
.DrawerContent[data-state='closed'] {
  animation: slideOut 450ms cubic-bezier(0.32, 0.72, 0, 1);
}

/* Cut the transition while actively dragging so the drawer tracks the pointer. */
.DrawerContent[data-swiping] {
  transition-duration: 0ms;
}

@keyframes slideIn { from { translate: 0 100%; } }
@keyframes slideOut { to { translate: 0 100%; } }
```

## API Reference

### Root

Contains all the parts of a drawer. Manages open state, modality, swipe direction
and snap points, and provides the context consumed by every other part.

<!-- @include: @/meta/DrawerRoot.md -->

### Trigger

The button that opens the drawer.

<!-- @include: @/meta/DrawerTrigger.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['open', 'closed'],
    },
  ]"
/>

### Portal

When used, portals your overlay and content parts into the `body`.

<!-- @include: @/meta/DrawerPortal.md -->

### Overlay

A layer that covers the inert portion of the view when the drawer is open. Only
rendered when the drawer is `modal`.

<PresenceCallout />

<!-- @include: @/meta/DrawerOverlay.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['open', 'closed'],
    },
    {
      attribute: '[data-swipe-direction]',
      values: ['up', 'down', 'left', 'right'],
    },
    {
      attribute: '[data-swiping]',
      values: ['Present when the drawer is being dragged'],
    },
  ]"
/>

### Content

Contains the content to be rendered in the open drawer. Owns the swipe gesture
and exposes the drag offset through CSS custom properties (see [Animating the
drawer](#animating-the-drawer)). Also aliased as `DrawerPopup` for Base UI parity.

<PresenceCallout />

<!-- @include: @/meta/DrawerContent.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['open', 'closed'],
    },
    {
      attribute: '[data-swipe-direction]',
      values: ['up', 'down', 'left', 'right'],
    },
    {
      attribute: '[data-swiping]',
      values: ['Present while the drawer is being dragged'],
    },
    {
      attribute: '[data-nested-drawer-open]',
      values: ['Present when a nested drawer is open'],
    },
  ]"
/>

### Close

The button that closes the drawer.

<!-- @include: @/meta/DrawerClose.md -->

### Title

An accessible title to be announced when the drawer is opened.

If you want to hide the title, wrap it inside our Visually Hidden utility like this `<VisuallyHidden asChild>`.

<!-- @include: @/meta/DrawerTitle.md -->

### Description

An optional accessible description to be announced when the drawer is opened.

If you want to hide the description, wrap it inside our Visually Hidden utility like this `<VisuallyHidden asChild>`. If you want to remove the description entirely, remove this part and pass `:aria-describedby="undefined"` to `DrawerContent`.

<!-- @include: @/meta/DrawerDescription.md -->

### Handle

A visual grab handle that hints the drawer can be dragged. It is purely
decorative (`aria-hidden`) — the whole content is draggable regardless.

<!-- @include: @/meta/DrawerHandle.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['open', 'closed'],
    },
  ]"
/>

### SwipeArea

An off-screen edge area that lets users swipe the drawer **open**. By default it
listens on the opposite side of the Root's `swipeDirection`.

<!-- @include: @/meta/DrawerSwipeArea.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['open', 'closed'],
    },
    {
      attribute: '[data-swipe-direction]',
      values: ['up', 'down', 'left', 'right'],
    },
  ]"
/>

### Viewport

An optional scrollable wrapper for the drawer content. Mirrors Base UI's
`Drawer.Viewport` and carries a `data-drawer-viewport` attribute for downstream
selectors.

<!-- @include: @/meta/DrawerViewport.md -->

### Indent

Wraps page content that should visually shift (scale/indent) as the drawer is
swiped, mimicking the native iOS "card stack" effect. Reads the visual state
from a parent `DrawerProvider` and syncs the `--drawer-swipe-progress` and
`--drawer-height` CSS variables onto its element.

<!-- @include: @/meta/DrawerIndent.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-active]',
      values: ['Present when a drawer is open'],
    },
    {
      attribute: '[data-inactive]',
      values: ['Present when no drawer is open'],
    },
  ]"
/>

### IndentBackground

The backdrop layer revealed behind an indented page (typically a solid colour
that peeks out as the page scales down). Companion to `Indent`.

<!-- @include: @/meta/DrawerIndentBackground.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-active]',
      values: ['Present when a drawer is open'],
    },
    {
      attribute: '[data-inactive]',
      values: ['Present when no drawer is open'],
    },
  ]"
/>

## Examples

### Choosing a side

`DrawerRoot` slides up from the bottom by default. Set `swipeDirection` to change
the edge the drawer attaches to and the direction users swipe to dismiss it.

```vue line=2
<template>
  <DrawerRoot swipe-direction="right">
    <DrawerTrigger>Open</DrawerTrigger>
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerContent>...</DrawerContent>
    </DrawerPortal>
  </DrawerRoot>
</template>
```

```css
/* A right-anchored drawer slides along the X axis instead. */
.DrawerContent {
  position: fixed;
  inset-block: 0;
  right: 0;
  width: 20rem;
  transform: translateX(var(--drawer-swipe-movement-x, 0px));
  transition: transform 450ms cubic-bezier(0.32, 0.72, 0, 1);
}
.DrawerContent[data-state='open'] { animation: slideInRight 450ms cubic-bezier(0.32, 0.72, 0, 1); }
.DrawerContent[data-state='closed'] { animation: slideOutRight 450ms cubic-bezier(0.32, 0.72, 0, 1); }
.DrawerContent[data-swiping] { transition-duration: 0ms; }

@keyframes slideInRight { from { translate: 100% 0; } }
@keyframes slideOutRight { to { translate: 100% 0; } }
```

### Snap points

Provide `snapPoints` to give the drawer intermediate resting positions. Each point
is a fraction (`0`–`1`), a pixel value (`> 1`), or a string like `'148px'` /
`'30rem'`. Use `v-model:snapPoint` to read or control the active one.

```vue line=5-9
<script setup>
import { DrawerContent, DrawerOverlay, DrawerPortal, DrawerRoot, DrawerTrigger } from 'reka-ui'
import { ref } from 'vue'

const snapPoints = [0.4, 0.75, 1]
const activeSnapPoint = ref(0.4)
</script>

<template>
  <DrawerRoot
    v-model:snap-point="activeSnapPoint"
    :snap-points="snapPoints"
  >
    <DrawerTrigger>Open</DrawerTrigger>
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerContent>...</DrawerContent>
    </DrawerPortal>
  </DrawerRoot>
</template>
```

### Non-modal drawer

By default the drawer is `modal`: it traps focus, locks scroll, and dismisses on
outside press. Set `modal` to `'trap-focus'` to keep the focus trap while still
allowing interaction with the rest of the page (no overlay is rendered), or to
`false` for a fully non-modal panel.

```vue line=2
<template>
  <DrawerRoot :modal="false">
    <DrawerTrigger>Open</DrawerTrigger>
    <DrawerPortal>
      <DrawerContent>...</DrawerContent>
    </DrawerPortal>
  </DrawerRoot>
</template>
```

### Reacting to why the drawer closed

The `update:open` event carries a `details` object whose `reason` tells you what
triggered the change — useful for distinguishing a deliberate close from a swipe.

```vue line=4-9
<script setup>
import { DrawerContent, DrawerOverlay, DrawerPortal, DrawerRoot, DrawerTrigger } from 'reka-ui'

function onOpenChange(open, details) {
  if (!open && details?.reason === 'swipe') {
    // user flicked the drawer away
  }
}
</script>

<template>
  <DrawerRoot @update:open="onOpenChange">
    <DrawerTrigger>Open</DrawerTrigger>
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerContent>...</DrawerContent>
    </DrawerPortal>
  </DrawerRoot>
</template>
```

Possible reasons are `swipe`, `escape-key`, `outside-press`, `click`, `cancel`,
`trigger-press` and `close-press`.

### Close using slot props

`DrawerRoot` exposes `open` and `close` via its default slot, so you can close the
drawer programmatically from anywhere inside it.

```vue line=2
<template>
  <DrawerRoot v-slot="{ close }">
    <DrawerTrigger>Open</DrawerTrigger>
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerContent>
        <form @submit.prevent="close">
          <!-- some inputs -->
          <button type="submit">
            Save
          </button>
        </form>
      </DrawerContent>
    </DrawerPortal>
  </DrawerRoot>
</template>
```

## Accessibility

Adheres to the [Dialog WAI-ARIA design pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).

### Keyboard Interactions

<KeyboardTable
  :data="[
    {
      keys: ['Space'],
      description: 'Opens/closes the drawer.',
    },
    {
      keys: ['Enter'],
      description: 'Opens/closes the drawer.',
    },
    {
      keys: ['Tab'],
      description: 'Moves focus to the next focusable element.',
    },
    {
      keys: ['Shift + Tab'],
      description: 'Moves focus to the previous focusable element.',
    },
    {
      keys: ['Esc'],
      description: '<span>Closes the drawer and moves focus to <Code>DrawerTrigger</Code>.</span>',
    },
  ]"
/>

## Custom APIs

Create your own API by abstracting the primitive parts into your own component.

### Abstract the overlay and the portal

This example abstracts the `DrawerPortal` and `DrawerOverlay` parts.

#### Usage

```vue
<script setup>
import { Drawer, DrawerContent, DrawerTrigger } from './your-drawer'
</script>

<template>
  <Drawer>
    <DrawerTrigger>Drawer trigger</DrawerTrigger>
    <DrawerContent>Drawer Content</DrawerContent>
  </Drawer>
</template>
```

#### Implementation

```ts
// your-drawer.ts
export { default as DrawerContent } from 'DrawerContent.vue'
export { DrawerRoot as Drawer, DrawerTrigger } from 'reka-ui'
```

```vue
<!-- DrawerContent.vue -->
<script setup lang="ts">
import type { DrawerContentEmits, DrawerContentProps } from 'reka-ui'
import { DrawerContent, DrawerHandle, DrawerOverlay, DrawerPortal, useForwardPropsEmits } from 'reka-ui'

const props = defineProps<DrawerContentProps>()
const emits = defineEmits<DrawerContentEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <DrawerPortal>
    <DrawerOverlay />
    <DrawerContent v-bind="forwarded">
      <DrawerHandle />
      <slot />
    </DrawerContent>
  </DrawerPortal>
</template>
```
