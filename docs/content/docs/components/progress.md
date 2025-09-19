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
