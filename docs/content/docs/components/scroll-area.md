---

title: Scroll Area
description: Augments native scroll functionality for custom, cross-browser styling.
name: scroll-area
---

# ScrollArea

<Description>
Augments native scroll functionality for custom, cross-browser styling.
</Description>

<ComponentPreview name="ScrollArea" />

## Features

<Highlights
  :features="[
    'Scrollbar sits on top of the scrollable content, taking up no space.',
    'Scrolling is native; no underlying position movements via CSS transformations.',
    'Shims pointer behaviors only when interacting with the controls, so keyboard controls are unaffected.',
    'Supports Right to Left direction.',
  ]"
/>

## Installation

Install the component from your command line.

<InstallationTabs value="reka-ui" />

## Anatomy

Import all parts and piece them together.

```vue
<script setup>
import { ScrollAreaRoot, ScrollAreaScrollbar, ScrollAreaThumb, ScrollAreaViewport } from 'reka-ui'
</script>

<template>
  <ScrollAreaRoot>
    <ScrollAreaViewport />
    <ScrollAreaScrollbar orientation="horizontal">
      <ScrollAreaThumb />
    </ScrollAreaScrollbar>
    <ScrollAreaScrollbar orientation="vertical">
      <ScrollAreaThumb />
    </ScrollAreaScrollbar>
    <ScrollAreaCorner />
  </ScrollAreaRoot>
</template>
```

## API Reference

### Root

Contains all the parts of a scroll area.

<!-- @include: @/meta/ScrollAreaRoot.md -->

### Viewport

The viewport area of the scroll area.

<!-- @include: @/meta/ScrollAreaViewport.md -->

### Scrollbar

The vertical scrollbar. Add a second `Scrollbar` with an `orientation` prop to enable horizontal scrolling.

<PresenceCallout />

<!-- @include: @/meta/ScrollAreaScrollbar.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['open', 'closed'],
    },
    {
      attribute: '[data-orientation]',
      values: ['vertical', 'horizontal'],
    },
  ]"
/>

### Thumb

The thumb to be used in `ScrollAreaScrollbar`.

<!-- @include: @/meta/ScrollAreaThumb.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['open', 'closed'],
    },
  ]"
/>

### Corner

The corner where both vertical and horizontal scrollbars meet.

<!-- @include: @/meta/ScrollAreaCorner.md -->

## Examples
### Custom Scroll
Use the exposed `viewport` to modify / or set the scroll position outside default methods. `$el` on the root's template ref is the root element; it is a reactive ref under the hood, so it always points at the element currently rendered (see [the element-first ref contract](../utilities/use-forward-expose#the-element-first-ref-contract)).
```vue line=4,18
<script setup lang="ts">
import { ScrollAreaRoot, ScrollAreaScrollbar, ScrollAreaThumb, ScrollAreaViewport } from 'reka-ui'

const scrollArea = useTemplateRef('scrollArea')
function scrollToBottom() {
  const viewport = scrollArea.value?.viewport
  if (viewport) {
    const top = scrollArea.value?.$el.scrollHeight
    viewport.scrollTo({
      top,
      behavior: 'smooth'
    })
  }
}
</script>

<template>
  <ScrollAreaRoot ref="scrollArea">
    <ScrollAreaViewport />
    <ScrollAreaScrollbar orientation="horizontal">
      <ScrollAreaThumb />
    </ScrollAreaScrollbar>
    <ScrollAreaScrollbar orientation="vertical">
      <ScrollAreaThumb />
    </ScrollAreaScrollbar>
    <ScrollAreaCorner />
  </ScrollAreaRoot>
</template>
```

## Headless composable

`useScrollArea` returns the root registry (`context`), `scrollTop` / `scrollTopLeft`, and the `root`, `viewport` and `content` surfaces. Bind each surface's `attrs.value` to its element and register the viewport through `context`.

```vue
<script setup lang="ts">
import { useScrollArea } from 'reka-ui'
import { onMounted, ref } from 'vue'

const viewportEl = ref<HTMLElement>()
const scrollArea = useScrollArea({ type: 'always' })

onMounted(() => {
  scrollArea.context.onViewportChange(viewportEl.value!)
  // Lets the viewport scroll vertically.
  scrollArea.context.onScrollbarYEnabledChange(true)
})
</script>

<template>
  <div v-bind="scrollArea.root.attrs.value">
    <div
      ref="viewportEl"
      v-bind="scrollArea.viewport.attrs.value"
      style="height: 200px"
    >
      <div v-bind="scrollArea.content.attrs.value">
        …
      </div>
    </div>
  </div>
</template>
```

The custom scrollbars stay in the components: their ResizeObserver sizing, pointer capture, thumb positioning and the `auto` / `scroll` / `hover` / `glimpse` visibility timers are not part of the composable. Hide the native scrollbars yourself when you render your own. The composable is experimental and callable outside component setup.

## Accessibility

In most cases, it's best to rely on native scrolling and work with the customization options available in CSS. When that isn't enough, `ScrollArea` provides additional customizability while maintaining the browser's native scroll behavior (as well as accessibility features, like keyboard scrolling).

### Keyboard Interactions

Scrolling via keyboard is supported by default because the component relies on native scrolling. Specific keyboard interactions may differ between platforms, so we do not specify them here or add specific event listeners to handle scrolling via key events.
