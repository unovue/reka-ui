---

title: Drawer
description: A panel that slides in from the edge of the screen, with support for swipe-to-dismiss, snap points, and nested drawers.
name: drawer
aria: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
---

# Drawer

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
  DrawerBackdrop,
  DrawerClose,
  DrawerDescription,
  DrawerGrabber,
  DrawerPopup,
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
      <DrawerBackdrop />
      <DrawerPopup>
        <DrawerGrabber />
        <DrawerTitle />
        <DrawerDescription />
        <DrawerClose />
      </DrawerPopup>
    </DrawerPortal>
  </DrawerRoot>
</template>
```

## Animating the drawer

The Drawer is unstyled, so the enter/exit transitions and the swipe gesture are
driven entirely by your CSS. The parts expose the gesture and the layout through
CSS custom properties, the same set as Base UI. They are part of the public API:
the names and units below are stable.

| Variable | Set on | Value |
| --- | --- | --- |
| `--drawer-swipe-movement-x` | `DrawerPopup` | Horizontal drag offset while swiping a left/right drawer (length). `0px` at rest. |
| `--drawer-swipe-movement-y` | `DrawerPopup` | Vertical drag offset while swiping a top/bottom drawer (length). `0px` at rest. |
| `--drawer-snap-point-offset` | `DrawerPopup` | Offset of the active snap point (length, negative for `up`/`left` drawers). `0px` without snap points. |
| `--drawer-swipe-strength` | `DrawerPopup` | A `0.1`–`1` scalar from the release velocity: multiply your transition duration by it so a fast flick closes faster. `1` until a swipe is released. `DrawerBackdrop` also declares it, but always as `1`. |
| `--drawer-height` | `DrawerPopup`, `DrawerIndent` | The measured height of the popup (length). On `DrawerIndent`, the height of the frontmost open drawer. |
| `--drawer-frontmost-height` | `DrawerPopup` | The height of the frontmost open drawer in a nested stack (length). |
| `--nested-drawers` | `DrawerPopup` | The number of nested drawers open above this one. |
| `--drawer-swipe-progress` | `DrawerPopup`, `DrawerIndent` | `0` at rest, approaching `1` as a drawer is swiped away. On `DrawerPopup` it tracks a nested child drawer being swiped (to animate the parent back), on `DrawerIndent` the frontmost drawer. |
| `--drawer-keyboard-inset` | `DrawerViewport` | The height the on-screen keyboard covers (length), while `DrawerVirtualKeyboardProvider` is active. See [Soft keyboard](#soft-keyboard). |

```css
.DrawerPopup {
  /* Follow the pointer while dragging. */
  transform: translateY(var(--drawer-swipe-movement-y, 0px));
  transition: transform 450ms cubic-bezier(0.32, 0.72, 0, 1);
}

/* Use the independent `translate` property for the enter/exit keyframes so they
   compose with the `transform` above instead of clobbering the drag offset. */
.DrawerPopup[data-state='open'] {
  animation: slideIn 450ms cubic-bezier(0.32, 0.72, 0, 1);
}
.DrawerPopup[data-state='closed'] {
  animation: slideOut 450ms cubic-bezier(0.32, 0.72, 0, 1);
}

/* Cut the transition while actively dragging so the drawer tracks the pointer. */
.DrawerPopup[data-swiping] {
  transition-duration: 0ms;
}

@keyframes slideIn { from { translate: 0 100%; } }
@keyframes slideOut { to { translate: 0 100%; } }
```

### Bleeding past the edge

Dragging a drawer *away* from the edge it is anchored to doesn't dismiss it —
the gesture is damped and the drawer rubber-bands back on release. Without extra
room the drawer lifts clean off the edge during that pull and the overlay shows
through the gap.

Give the drawer some **bleed**: extra area past its anchored edge, held
off-screen by an equal negative margin. Pulling the drawer now slides the bleed
into view instead of the overlay, so it reads as a stretch rather than a
detachment.

```css
.DrawerPopup {
  --bleed: 48px;
  padding-bottom: calc(env(safe-area-inset-bottom, 0px) + var(--bleed));
  margin-bottom: calc(-1 * var(--bleed));
}

/* The bleed already sits below the viewport edge, so the drawer only has to
   travel `height - bleed` to clear it. */
@keyframes slideIn { from { translate: 0 calc(100% - var(--bleed)); } }
@keyframes slideOut { to { translate: 0 calc(100% - var(--bleed)); } }
```

For a side drawer, swap the axis and point the bleed at the edge the drawer is
anchored to — a right-anchored drawer bleeds right, a left-anchored one bleeds
left:

```css
/* Anchored right */
.DrawerPopup {
  padding-inline-end: calc(24px + var(--bleed));
  margin-inline-end: calc(-1 * var(--bleed));
}
@keyframes slideIn { from { translate: calc(100% - var(--bleed)) 0; } }

/* Anchored left */
.DrawerPopup {
  padding-inline-start: calc(24px + var(--bleed));
  margin-inline-start: calc(-1 * var(--bleed));
}
@keyframes slideIn { from { translate: calc(-100% + var(--bleed)) 0; } }
```

## Soft keyboard

On mobile the software keyboard slides over the bottom of the viewport without
resizing it, so a bottom-anchored drawer — and the field the user just tapped —
end up underneath it.

Wrap the drawer in `DrawerVirtualKeyboardProvider` to make it react. It requires
a `DrawerViewport` around `DrawerPopup`: the viewport is the measurement root
and hosts the keyboard variable, which inherits into the popup and everything in
it.

```vue
<template>
  <DrawerRoot>
    <DrawerVirtualKeyboardProvider>
      <DrawerTrigger />
      <DrawerPortal>
        <DrawerBackdrop />
        <DrawerViewport>
          <DrawerPopup>
            <input>
          </DrawerPopup>
        </DrawerViewport>
      </DrawerPortal>
    </DrawerVirtualKeyboardProvider>
  </DrawerRoot>
</template>
```

While a field inside the drawer is focused, the provider scrolls it into the band
left visible above the keyboard and publishes the keyboard's height as
`--drawer-keyboard-inset` on the viewport.

- **Keep the popup frame stable** — put header and footer content outside a plain
  scrollable body so only the body moves.
- **Lift a pinned footer** — offset it by `var(--drawer-keyboard-inset, 0px)`,
  either as padding or as part of its height.
- **Always include the `0px` fallback** — the variable is only set while the
  keyboard is aligned, so a bare `var(--drawer-keyboard-inset)` is invalid before
  the first alignment and after cleanup.

```css
.DrawerFooter {
  padding-bottom: calc(1rem + var(--drawer-keyboard-inset, 0px));
}
```

To lift the whole sheet instead, give up the keyboard's height so its top stays
on screen:

```css
.DrawerPopup {
  height: calc(90dvh - var(--drawer-keyboard-inset, 0px));
  max-height: calc(90dvh - var(--drawer-keyboard-inset, 0px));
}
```

Alignment is suspended while the viewport is pinch-zoomed, and viewport changes
under 60px are treated as browser chrome rather than the keyboard.

## API Reference

Every part below is supported public API, including the parts that mirror Base
UI's Drawer for layout and nesting: `DrawerViewport`, `DrawerSwipeArea`,
`DrawerIndent`, `DrawerIndentBackground`, `DrawerProvider` and
`DrawerVirtualKeyboardProvider`.

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

### Backdrop

A layer that covers the inert portion of the view when the drawer is open. Only
rendered when the drawer is `modal`. `DrawerOverlay` is a deprecated alias.

<PresenceCallout />

<!-- @include: @/meta/DrawerBackdrop.md -->

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

### Popup

Contains the content to be rendered in the open drawer. Owns the swipe gesture
and exposes the drag offset through CSS custom properties (see [Animating the
drawer](#animating-the-drawer)).

`DrawerContent` is a deprecated alias of `DrawerPopup`, kept for v3. Base UI's
`Drawer.Content` is a different part (an inner container inside the popup), so
the alias is removed in a future major rather than kept as a second name.

<PresenceCallout />

<!-- @include: @/meta/DrawerPopup.md -->

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

If you want to hide the description, wrap it inside our Visually Hidden utility like this `<VisuallyHidden asChild>`. If you want to remove the description entirely, remove this part and pass `:aria-describedby="undefined"` to `DrawerPopup`.

<!-- @include: @/meta/DrawerDescription.md -->

### Grabber

A visual grab bar that hints the drawer can be dragged. It is purely
decorative (`aria-hidden`) — the whole popup is draggable regardless. It was
`DrawerHandle` before v3; that name is reserved for the detached-trigger handle,
as in Base UI (`Drawer.Handle`).

<!-- @include: @/meta/DrawerGrabber.md -->

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

An optional wrapper around `DrawerPopup`. Mirrors Base UI's `Drawer.Viewport`
and carries a `data-drawer-viewport` attribute for downstream selectors.
Required when using `VirtualKeyboardProvider`, which measures the keyboard
against it.

<!-- @include: @/meta/DrawerViewport.md -->

### VirtualKeyboardProvider

Makes the drawer react to the software keyboard: it keeps the focused field
visible and exposes `--drawer-keyboard-inset` on `DrawerViewport`, which it
requires (see [Soft keyboard](#soft-keyboard)). Takes no props and renders no
markup of its own.

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
      <DrawerBackdrop />
      <DrawerPopup>...</DrawerPopup>
    </DrawerPortal>
  </DrawerRoot>
</template>
```

```css
/* A right-anchored drawer slides along the X axis instead. */
.DrawerPopup {
  position: fixed;
  inset-block: 0;
  right: 0;
  width: 20rem;
  transform: translateX(var(--drawer-swipe-movement-x, 0px));
  transition: transform 450ms cubic-bezier(0.32, 0.72, 0, 1);
}
.DrawerPopup[data-state='open'] { animation: slideInRight 450ms cubic-bezier(0.32, 0.72, 0, 1); }
.DrawerPopup[data-state='closed'] { animation: slideOutRight 450ms cubic-bezier(0.32, 0.72, 0, 1); }
.DrawerPopup[data-swiping] { transition-duration: 0ms; }

@keyframes slideInRight { from { translate: 100% 0; } }
@keyframes slideOutRight { to { translate: 100% 0; } }
```

### Where a swipe can start

A touch swipe can start anywhere on the drawer, including on buttons, links and
labels. A tap that doesn't move past the drag threshold still registers as a
click. Mouse and pen swipes skip interactive elements so that clicks and text
selection keep working.

Add `data-reka-swipe-ignore` to an element to stop swipes from starting on it
with any input type. Use it for controls that handle their own drag gestures.

```vue line=4
<template>
  <DrawerPopup>
    <nav>...</nav>
    <div data-reka-swipe-ignore>
      <!-- A carousel, map, or signature pad -->
    </div>
  </DrawerPopup>
</template>
```

### Snap points

Provide `snapPoints` to give the drawer intermediate resting positions. Each point
is a fraction (`0`–`1`), a pixel value (`> 1`), or a string like `'148px'` /
`'30rem'`. Use `v-model:snapPoint` to read or control the active one.

A swipe that changes the snap point emits the cancellable
`beforeUpdate:snapPoint`, then `update:snapPoint`, both with a `details` object
(`details.reason` is `'swipe'`). Swiping past the last point first requests the
`null` snap point: cancel it to keep the drawer open where it was. When the
close that follows is cancelled, the previous snap point is restored. Closing
the drawer resets the snap point to `defaultSnapPoint` (else the first point),
as in Base UI.

```vue line=5-9
<script setup>
import { DrawerBackdrop, DrawerPopup, DrawerPortal, DrawerRoot, DrawerTrigger } from 'reka-ui'
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
      <DrawerBackdrop />
      <DrawerPopup>...</DrawerPopup>
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
      <DrawerPopup>...</DrawerPopup>
    </DrawerPortal>
  </DrawerRoot>
</template>
```

### Reacting to why the drawer closed

The `update:open` event carries a `details` object whose `reason` tells you what
triggered the change — useful for distinguishing a deliberate close from a swipe.
It fires after the change; `beforeUpdate:open` fires before it, with the same
`details`.

```vue line=4-9
<script setup>
import { DrawerBackdrop, DrawerPopup, DrawerPortal, DrawerRoot, DrawerTrigger } from 'reka-ui'

function onOpenChange(open, details) {
  if (!open && details.reason === 'swipe') {
    // user flicked the drawer away
  }
}
</script>

<template>
  <DrawerRoot @update:open="onOpenChange">
    <DrawerTrigger>Open</DrawerTrigger>
    <DrawerPortal>
      <DrawerBackdrop />
      <DrawerPopup>...</DrawerPopup>
    </DrawerPortal>
  </DrawerRoot>
</template>
```

Possible reasons are `trigger-press`, `close-press`, `escape-key`,
`outside-press` and `swipe` (a swipe on the popup closes it; one on
`DrawerSwipeArea` opens it), plus `imperative-action` for code that calls the
root context.

### Preventing the drawer from closing

Call `details.cancel()` in `beforeUpdate:open` to keep the drawer in its current
state. This works for every reason, including a swipe: the drawer settles back
open, or back to its snap point. It also works with `v-model:open`, which is
only written when the change was not cancelled.

```vue line=7-10
<script setup>
import { DrawerBackdrop, DrawerPopup, DrawerPortal, DrawerRoot, DrawerTrigger } from 'reka-ui'
import { ref } from 'vue'

const open = ref(false)

function onBeforeOpenChange(value, details) {
  if (!value && hasUnsavedChanges()) {
    details.cancel()
    showDiscardConfirmation()
  }
}
</script>

<template>
  <DrawerRoot v-model:open="open" @before-update:open="onBeforeOpenChange">
    <DrawerTrigger>Open</DrawerTrigger>
    <DrawerPortal>
      <DrawerBackdrop />
      <DrawerPopup>...</DrawerPopup>
    </DrawerPortal>
  </DrawerRoot>
</template>
```

A controlled drawer whose parent leaves `open` unchanged also settles back after
a swipe.

### Close using slot props

`DrawerRoot` exposes `open` and `close` via its default slot, so you can close the
drawer programmatically from anywhere inside it.

```vue line=2
<template>
  <DrawerRoot v-slot="{ close }">
    <DrawerTrigger>Open</DrawerTrigger>
    <DrawerPortal>
      <DrawerBackdrop />
      <DrawerPopup>
        <form @submit.prevent="close">
          <!-- some inputs -->
          <button type="submit">
            Save
          </button>
        </form>
      </DrawerPopup>
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

This example abstracts the `DrawerPortal` and `DrawerBackdrop` parts.

#### Usage

```vue
<script setup>
import { Drawer, DrawerPopup, DrawerTrigger } from './your-drawer'
</script>

<template>
  <Drawer>
    <DrawerTrigger>Drawer trigger</DrawerTrigger>
    <DrawerPopup>Drawer Content</DrawerPopup>
  </Drawer>
</template>
```

#### Implementation

```ts
// your-drawer.ts
export { default as DrawerPopup } from 'DrawerPopup.vue'
export { DrawerRoot as Drawer, DrawerTrigger } from 'reka-ui'
```

```vue
<!-- DrawerPopup.vue -->
<script setup lang="ts">
import type { DrawerPopupEmits, DrawerPopupProps } from 'reka-ui'
import { DrawerBackdrop, DrawerGrabber, DrawerPopup, DrawerPortal, useForwardPropsEmits } from 'reka-ui'

const props = defineProps<DrawerPopupProps>()
const emits = defineEmits<DrawerPopupEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <DrawerPortal>
    <DrawerBackdrop />
    <DrawerPopup v-bind="forwarded">
      <DrawerGrabber />
      <slot />
    </DrawerPopup>
  </DrawerPortal>
</template>
```
