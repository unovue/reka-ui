---

title: Progress
description: Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.
name: progress
aria: https://www.w3.org/WAI/ARIA/apg/patterns/meter
---

# Progress

<Description>
Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.
</Description>

<ComponentPreview name="Progress" />

## Features

<Highlights
  :features="[
    'Provides context for assistive technology to read the progress of a task.',
  ]"
/>

## Installation

Install the component from your command line.

<InstallationTabs value="reka-ui" />

### Anatomy

Import all parts and piece them together.

```vue
<script setup>
import { ProgressIndicator, ProgressRoot } from 'reka-ui'
</script>

<template>
  <ProgressRoot>
    <ProgressIndicator />
  </ProgressRoot>
</template>
```

## Accessibility

Adheres to the [`progressbar` role requirements](https://www.w3.org/WAI/ARIA/apg/patterns/meter).

## API Reference

### Root

Contains all of the progress parts.

<!-- @include: @/meta/ProgressRoot.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['complete', 'indeterminate', 'loading'],
    },
    {
      attribute: '[data-value]',
      values: 'The current value',
    },
    {
      attribute: '[data-max]',
      values: 'The max value',
    },
  ]"
/>

### Indicator

Used to show the progress visually. It also makes progress accessible to assistive technologies.

<!-- @include: @/meta/ProgressIndicator.md -->

## Headless composable

`useProgress` derives the validated value, `state` and the `root` and `indicator` surfaces. Bind each surface's `attrs.value` to its element.

```vue
<script setup lang="ts">
import { useProgress } from 'reka-ui'
import { ref } from 'vue'

const value = ref(40)
const progress = useProgress({ modelValue: value, max: 100 })
</script>

<template>
  <div v-bind="progress.root.attrs.value">
    <!-- Size from the validated value: an invalid one reads `null`. -->
    <div
      v-bind="progress.indicator.attrs.value"
      :style="{ width: `${((progress.value.value ?? 0) / progress.max.value) * 100}%` }"
    />
  </div>
</template>
```

Progress has no change model: the value is display-only, so there is no `beforeUpdate:modelValue` or change details. An invalid value (negative, above `max`, `NaN`) renders as indeterminate and an invalid `max` as `100`, with a console error. The value is validated against the corrected `max`, so lowering `max` below the current value also makes it indeterminate. `ProgressRoot` still emits `update:modelValue(null)` or `update:max(100)` once when it corrects a prop, so a `v-model` follows. The composable is experimental and callable outside component setup.

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['complete', 'indeterminate', 'loading'],
    },
    {
      attribute: '[data-value]',
      values: 'The current value',
    },
    {
      attribute: '[data-max]',
      values: 'The max value',
    },
  ]"
/>
