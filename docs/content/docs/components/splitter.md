---
title: Splitter
description: A component that divides your layout into resizable sections.
name: splitter
aria: https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/
---

# Splitter

<Description>
A component that divides your layout into resizable sections.
</Description>

<ComponentPreview name="Splitter" />

## Features

<Highlights
  :features="[
    'Supports keyboard interaction.',
    'Supports horizontal/vertical layout.',
    'Supports nested layout.',
    'Supports Right to Left direction.',
    'Can resize across another panel.',
    'Can be mounted conditionally.'
  ]"
/>

## Installation

Install the component from your command line.

<InstallationTabs value="reka-ui" />

## Anatomy

Import all parts and piece them together.

```vue
<script setup>
import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from 'reka-ui'
</script>

<template>
  <SplitterGroup>
    <SplitterPanel />
    <SplitterResizeHandle />
  </SplitterGroup>
</template>
```

## API Reference

### Group

Contains all the parts of a Splitter.

<!-- @include: @/meta/SplitterGroup.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-orientation]',
      values: ['vertical', 'horizontal'],
    },
    {
      attribute: '[data-state]',
      values: ['collapsed', 'expanded', 'Present when collapsbile'],
    },
  ]"
/>

### Panel

A collapsible section.

<!-- @include: @/meta/SplitterPanel.md -->

### Resize Handle

Handle that use for resizing.

<!-- @include: @/meta/SplitterResizeHandle.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['drag', 'hover', 'inactive'],
    },
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    },
    {
      attribute: '[data-orientation]',
      values: ['vertical', 'horizontal'],
    }
  ]"
/>

## Examples

### Collapsible

Use the `collapsible` prop to allow the panel to collapse into `collapsedSize` when `minSize` is reached.

(`collapsedSize` and `minSize` props are required.)

```vue line=4-6
<template>
  <SplitterGroup>
    <SplitterPanel
      collapsible
      :collapsed-size="10"
      :min-size="35"
    >
      Panel A
    </SplitterPanel>
    <SplitterResizeHandle />
    <SplitterPanel>
      Panel B
    </SplitterPanel>
  </SplitterGroup>
</template>
```

### Persist in localStorage

Use the `autoSaveId` prop to save the layout data into `localStorage`.

```vue line=2
<template>
  <SplitterGroup auto-save-id="any-id">
    …
  </SplitterGroup>
</template>
```

### Persist layout with SSR

By default, Splitter uses `localStorage` to persist layouts. With server rendering, this can cause a flicker when the default layout (rendered on the server) is replaced with the persisted layout (in `localStorage`). The way to avoid this flicker is to also persist the layout with a cookie like so:

```vue line=3,,8-9,11,15
<!-- with Nuxt -->
<script setup lang="ts">
const layout = useCookie<number[]>('splitter:layout')
</script>

<template>
  <SplitterGroup
    direction="horizontal"
    @layout="layout = $event"
  >
    <SplitterPanel :default-size="layout[0]">
      …
    </SplitterPanel>
    <SplitterResizeHandle />
    <SplitterPanel :default-size="layout[1]">
      …
    </SplitterPanel>
  </SplitterGroup>
</template>
```

### Collapse/Expand programmatically

Sometimes panels need to resize or collapse/expand in response to user actions. `SplitterPanel` exposes the `collapse` and `expand` methods to achieve this.

```vue line=2,7,14
<script setup lang="ts">
const panelRef = ref<InstanceType<typeof SplitterPanel>>()
</script>

<template>
  <button
    @click="panelRef?.isCollapsed ? panelRef?.expand() : panelRef?.collapse() "
  >
    {{ panelRef?.isCollapsed ? 'Expand' : 'Collapse' }}
  </button>

  <SplitterGroup>
    <SplitterPanel
      ref="panelRef"
      collapsible
      :collapsed-size="10"
      :min-size="35"
    >
      …
    </SplitterPanel>
    <SplitterResizeHandle />
    <SplitterPanel>
      …
    </SplitterPanel>
  </SplitterGroup>
</template>
```

### Custom handle

Customize the handle by passing any element as the slot.

 ```vue line=6-8
<template>
   <SplitterGroup>
     <SplitterPanel>
       …
     </SplitterPanel>
     <SplitterResizeHandle>
       <Icon icon="radix-icons-drag-handle-dots-2" />
     </SplitterResizeHandle>
     <SplitterPanel>
       …
     </SplitterPanel>
   </SplitterGroup>
</template>
```

### SSR

Splitter component heavily relies on unique `id`, however for Vue<3.4 we don't have a reliable way of generating [SSR-friendly `id`](https://github.com/vuejs/rfcs/discussions/557).

Thus, if you are using Nuxt or other SSR framework, you are required to manually add the `id` for all Splitter components. Alternatively, you can wrap the component with `<ClientOnly>`.

```vue
<template>
  <SplitterGroup id="group-1">
    <SplitterPanel id="group-1-panel-1">
      …
    </SplitterPanel>
    <SplitterResizeHandle id="group-1-resize-1">
      <Icon icon="radix-icons-drag-handle-dots-2" />
    </SplitterResizeHandle>
    <SplitterPanel id="group-1-panel-2">
      …
    </SplitterPanel>
  </SplitterGroup>
</template>
```

## Accessibility

Adheres to the [Window Splitter WAI-ARIA design pattern](https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter).

### Keyboard Interactions

<KeyboardTable :data="[
    {
      keys: ['Enter'],
      description: 'If the primary pane is not collapsed, collapses the pane. If the pane is collapsed, restores the splitter to its previous position.',
    },
    {
      keys: ['ArrowDown'],
      description: 'Moves a horizontal splitter down.',
    },
    {
      keys: ['ArrowUp'],
      description: 'Moves a horizontal splitter up.',
    },
    {
      keys: ['ArrowRight'],
      description: 'Moves a vertical splitter to the right.',
    },
    {
      keys: ['ArrowLeft'],
      description: 'Moves a vertical splitter to the left.',
    },
    {
      keys: ['Home'],
      description: 'Moves splitter to the position that gives the primary pane its smallest allowed size. ',
    },
    {
      keys: ['End'],
      description: 'Moves splitter to the position that gives the primary pane its largest allowed size.',
    }]" />
