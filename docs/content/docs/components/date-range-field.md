---
title: Date Range Field
description: Allows users to input a range of dates within a designated field.
name: date-range-field
---

# Date Range Field

<Badge>Alpha</Badge>

<Description>
Allows users to input a range of dates within a designated field.
</Description>

<ComponentPreview name="DateRangeField" />

## Features

<Highlights
  :features="[
    'Full keyboard navigation',
    'Can be controlled or uncontrolled',
    'Focus is fully managed',
    'Localization support',
    'Highly composable',
    'Accessible by default',
    'Supports both date and date-time formats'
  ]"
/>

## Preface

The component works with the [Temporal API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal): its values are `Temporal.PlainDate`, `Temporal.PlainDateTime` or `Temporal.ZonedDateTime`. Reka UI does not bundle a Temporal implementation, so on runtimes without native Temporal your app loads a polyfill. See [Dates & Times](/docs/guides/dates) for the setup and how the components treat calendars and time zones.

## Installation

On runtimes without native Temporal, install a polyfill and load it once, before the app mounts.

<InstallationTabs value="temporal-polyfill-lite" />

```ts
// main.ts
import { install } from 'temporal-polyfill-lite/shim'

install(false) // keeps the native Temporal when the browser has one
```

Install the component from your command line.

<InstallationTabs value="reka-ui" />

## Anatomy

Import all parts and piece them together.

```vue
<script setup>
import {
  DateRangeFieldInput,
  DateRangeFieldRoot,
} from 'reka-ui'
</script>

<template>
  <DateRangeFieldRoot>
    <DateRangeFieldInput />
  </DateRangeFieldRoot>
</template>
```

## API Reference

### Root

Contains all the parts of a date field

<!-- @include: @/meta/DateRangeFieldRoot.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-readonly]',
      values: 'Present when readonly',
    },
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    },
    {
      attribute: '[data-invalid]',
      values: 'Present when invalid',
    }
  ]"
/>

### Input

Contains the date field segments

<!-- @include: @/meta/DateRangeFieldInput.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    },
    {
      attribute: '[data-invalid]',
      values: 'Present when invalid',
    },
    {
      attribute: '[data-placeholder]',
      values: 'Present when no value is set',
    },
  ]"
/>

## Accessibility

### Keyboard Interactions

<KeyboardTable
  :data="[
    {
      keys: ['Tab'],
      description: 'When focus moves onto the date field, focuses the first segment.'
    },
    {
      keys: ['ArrowLeft', 'ArrowRight'],
      description:
      `
       Navigates between the date field segments.
      `
    },
    {
      keys: ['ArrowUp', 'ArrowDown'],
      description: 'Increments/changes the value of the segment.'
    },
    {
      keys: ['0-9'],
      description: `
          When the focus is on a numeric <Code>DateFieldInput</Code>, it types in the number and focuses the next segment if the next input would result in an invalid value.
      `
    },
    {
      keys: ['Backspace'],
      description:  'Deletes a digit from the focused numeric segments.'
    },
    {
      keys: ['A', 'P'],
      description: 'When the focus is on the day period, it sets it to AM or PM.'
    }
  ]"
/>
