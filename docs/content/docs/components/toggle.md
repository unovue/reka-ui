---

title: Toggle
description: A two-state button that can be either on or off.
name: toggle
aria: https://www.w3.org/WAI/ARIA/apg/patterns/button
---

# Toggle

<Description>
A two-state button that can be either on or off.
</Description>

<ComponentPreview name="Toggle" />

## Features

<Highlights
  :features="['Full keyboard navigation.', 'Can be controlled or uncontrolled.']"
/>

## Installation

Install the component from your command line.

<InstallationTabs value="reka-ui" />

## Anatomy

Import the component.

```vue
<script setup>
import { Toggle } from 'reka-ui'
</script>

<template>
  <Toggle />
</template>
```

## API Reference

### Root

The toggle.

<!-- @include: @/meta/Toggle.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['checked', 'unchecked'],
    },
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    },
  ]"
/>

## Accessibility

### Keyboard Interactions

<KeyboardTable
  :data="[
    {
      keys: ['Space'],
      description: 'Activates/deactivates the toggle.',
    },
    {
      keys: ['Enter'],
      description: 'Activates/deactivates the toggle.',
    },
  ]"
/>

## Headless composable

`useTogglePressed` returns `pressed`, `toggle()`, `setPressed()`, `lastChangeDetails` and the `root` [part surface](/docs/guides/composables#part-surfaces) (`aria-pressed`, `data-state`, the press handler). It takes `modelValue`, `defaultValue`, `disabled`, `onBeforeUpdate` and `onUpdate`. It is pure, so it can be called outside `setup()`. The composable is experimental; see [Headless composables](/docs/guides/composables).
