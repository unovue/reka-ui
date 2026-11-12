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

### Virtualizer

Virtualizes large collections within the viewport. Place `ScrollAreaVirtualizer` inside `ScrollAreaViewport` and render each item through its default slot. The slot renders one root element per item, which the virtualizer positions.

<!-- @include: @/meta/ScrollAreaVirtualizer.md -->

### Scrollbar

The vertical scrollbar. Add a second `Scrollbar` with an `orientation` prop to enable horizontal scrolling.

<PresenceCallout />

<!-- @include: @/meta/ScrollAreaScrollbar.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['visible', 'hidden'],
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
      values: ['visible', 'hidden'],
    },
  ]"
/>

### Corner

The corner where both vertical and horizontal scrollbars meet.

<!-- @include: @/meta/ScrollAreaCorner.md -->

## Examples

### Virtualized list

Use `ScrollAreaVirtualizer` for large collections. Only visible items and the configured overscan are mounted.

```vue
<script setup lang="ts">
import { ScrollAreaRoot, ScrollAreaScrollbar, ScrollAreaThumb, ScrollAreaViewport, ScrollAreaVirtualizer } from 'reka-ui'

const items = Array.from({ length: 10_000 }, (_, index) => `Item ${index + 1}`)
</script>

<template>
  <ScrollAreaRoot class="h-80 overflow-hidden">
    <ScrollAreaViewport class="h-full">
      <ScrollAreaVirtualizer
        v-slot="{ option }"
        :options="items"
        :estimate-size="32"
      >
        <div class="h-8">
          {{ option }}
        </div>
      </ScrollAreaVirtualizer>
    </ScrollAreaViewport>
    <ScrollAreaScrollbar orientation="vertical">
      <ScrollAreaThumb />
    </ScrollAreaScrollbar>
  </ScrollAreaRoot>
</template>
```

To virtualize along the horizontal axis, set the `horizontal` prop and render `<ScrollAreaScrollbar orientation="horizontal">`. The viewport only scrolls on an axis that has a scrollbar.

### Scroll to an item

The underlying [TanStack Virtual](https://tanstack.com/virtual/latest/docs/api/virtualizer) instance is available as the `virtualizer` slot prop, and as `virtualizer` on the component's template ref.

```vue line=5,8,20
<script setup lang="ts">
import { ScrollAreaRoot, ScrollAreaScrollbar, ScrollAreaThumb, ScrollAreaViewport, ScrollAreaVirtualizer } from 'reka-ui'
import { useTemplateRef } from 'vue'

const list = useTemplateRef('list')
const items = Array.from({ length: 10_000 }, (_, index) => `Item ${index + 1}`)
function scrollToItem(index: number) {
  list.value?.virtualizer.scrollToIndex(index, { align: 'start' })
}
</script>

<template>
  <button @click="scrollToItem(5000)">
    Go to item 5001
  </button>

  <ScrollAreaRoot class="h-80 overflow-hidden">
    <ScrollAreaViewport class="h-full">
      <ScrollAreaVirtualizer
        ref="list"
        v-slot="{ option }"
        :options="items"
        :estimate-size="32"
      >
        <div class="h-8">
          {{ option }}
        </div>
      </ScrollAreaVirtualizer>
    </ScrollAreaViewport>
    <ScrollAreaScrollbar orientation="vertical">
      <ScrollAreaThumb />
    </ScrollAreaScrollbar>
  </ScrollAreaRoot>
</template>
```

### Virtualized list with dynamic item sizes

When the size of an item depends on its content, pass `virtualizer.measureElement` as the `ref` of the item. The virtualizer then measures each mounted item and uses `estimateSize` only for the items it has not measured yet.

```vue line=14,18
<script setup lang="ts">
import { ScrollAreaRoot, ScrollAreaScrollbar, ScrollAreaThumb, ScrollAreaViewport, ScrollAreaVirtualizer } from 'reka-ui'

const messages = Array.from({ length: 10_000 }, (_, index) => ({
  author: `User ${index + 1}`,
  text: 'A message of a different length. '.repeat(1 + (index % 5)),
}))
</script>

<template>
  <ScrollAreaRoot class="h-80 overflow-hidden">
    <ScrollAreaViewport class="h-full">
      <ScrollAreaVirtualizer
        v-slot="{ option, virtualizer }"
        :options="messages"
        :estimate-size="64"
      >
        <div :ref="el => virtualizer.measureElement(el as Element | null)">
          <strong>{{ option.author }}</strong>
          <p>{{ option.text }}</p>
        </div>
      </ScrollAreaVirtualizer>
    </ScrollAreaViewport>
    <ScrollAreaScrollbar orientation="vertical">
      <ScrollAreaThumb />
    </ScrollAreaScrollbar>
  </ScrollAreaRoot>
</template>
```

`estimateSize` also accepts a callback that returns the estimate of each item. A change of a numeric `estimateSize` measures the items again. A callback is not watched, because an inline callback is a new function on every render and measuring again discards the measured sizes. When the results of your callback change, call `measure()` on the virtualizer instance.

```vue line=9-13
<script setup lang="ts">
import { ScrollAreaRoot, ScrollAreaScrollbar, ScrollAreaThumb, ScrollAreaViewport, ScrollAreaVirtualizer } from 'reka-ui'
import { nextTick, ref, useTemplateRef } from 'vue'

const list = useTemplateRef('list')
const items = Array.from({ length: 10_000 }, (_, index) => `Item ${index + 1}`)
const compact = ref(false)

async function toggleCompact() {
  compact.value = !compact.value
  await nextTick()
  list.value?.virtualizer.measure()
}
</script>

<template>
  <button @click="toggleCompact">
    Toggle compact rows
  </button>

  <ScrollAreaRoot class="h-80 overflow-hidden">
    <ScrollAreaViewport class="h-full">
      <ScrollAreaVirtualizer
        ref="list"
        v-slot="{ option }"
        :options="items"
        :estimate-size="() => compact ? 24 : 40"
      >
        <div :style="{ height: compact ? '24px' : '40px' }">
          {{ option }}
        </div>
      </ScrollAreaVirtualizer>
    </ScrollAreaViewport>
    <ScrollAreaScrollbar orientation="vertical">
      <ScrollAreaThumb />
    </ScrollAreaScrollbar>
  </ScrollAreaRoot>
</template>
```

### Custom Scroll
Use the exposed `viewport` to modify / or set the scroll position outside default methods
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

## Accessibility

In most cases, it's best to rely on native scrolling and work with the customization options available in CSS. When that isn't enough, `ScrollArea` provides additional customizability while maintaining the browser's native scroll behavior (as well as accessibility features, like keyboard scrolling).

### Virtualized content

`ScrollAreaVirtualizer` mounts only the items near the scroll position, so assistive technologies see only those items.

- The virtualizer adds no role to the items. The items are the elements that you render in the slot, so their semantics are yours to set. When you render the items as a list, for example with `role="list"` on a wrapper and `role="listitem"` on each item, set `aria-setsize` and `aria-posinset` on each item from `options.length` and `virtualItem.index + 1`, so that the position in the whole collection is announced.
- The item that contains the focused element remains mounted when it scrolls out of view, together with the items before and after it. The focus stays on the element, and <kbd>Tab</kbd> and <kbd>Shift + Tab</kbd> move it to the adjacent item, which the browser scrolls into view. The items are released once the focus leaves the virtualizer.

### Keyboard Interactions

Scrolling via keyboard is supported by default because the component relies on native scrolling. Specific keyboard interactions may differ between platforms, so we do not specify them here or add specific event listeners to handle scrolling via key events.
