---
title: Date Field
description: Enables users to input specific dates within a designated field.
name: date-field
---

# Date Field

<Description>
Enables users to input specific dates within a designated field.
</Description>

<ComponentPreview name="DateField" />

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
  DateFieldInput,
  DateFieldRoot,
} from 'reka-ui'
</script>

<template>
  <DateFieldRoot>
    <DateFieldInput />
  </DateFieldRoot>
</template>
```

## API Reference

### Root

Contains all the parts of a date field

<!-- @include: @/meta/DateFieldRoot.md -->

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

<!-- @include: @/meta/DateFieldInput.md -->

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

## Examples

The examples render the segments from the root's slot, as the demo at the top of the page does:

```vue
<template>
  <DateFieldRoot v-slot="{ segments }">
    <template v-for="(item, index) in segments" :key="item.part === 'literal' ? index : item.part">
      <DateFieldInput :part="item.part">
        {{ item.value }}
      </DateFieldInput>
    </template>
  </DateFieldRoot>
</template>
```

### Date and time

The type of the value, or of the `placeholder` while the field is empty, decides the segments: a `Temporal.PlainDate` shows day, month and year; a `Temporal.PlainDateTime` adds the time down to `granularity` (`'hour'`, `'minute'` by default, or `'second'`); a `Temporal.ZonedDateTime` also shows the time zone, unless `hide-time-zone` is set. `hour-cycle` forces a 12 or 24 hour clock.

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

const departure = shallowRef<Temporal.PlainDateTime>()
// `Temporal` isn't one of the globals Vue exposes to templates: create values in the script.
const placeholder = Temporal.PlainDateTime.from('2026-11-04T08:00')
</script>

<template>
  <DateFieldRoot
    v-slot="{ segments }"
    v-model="departure"
    :placeholder="placeholder"
    granularity="minute"
    :hour-cycle="24"
  >
    <DateFieldInput v-for="(item, index) in segments" :key="item.part === 'literal' ? index : item.part" :part="item.part">
      {{ item.value }}
    </DateFieldInput>
  </DateFieldRoot>
</template>
```

### Limiting the range

A value before `min-value`, after `max-value` or for which `is-date-unavailable` returns `true` stays in the model but marks the field invalid: the root gets `data-invalid` and the segments `aria-invalid`.

```vue
<script setup lang="ts">
import { today } from 'reka-ui/date'

const latest = today().subtract({ years: 18 })
</script>

<template>
  <DateFieldRoot
    v-slot="{ segments }"
    :max-value="latest"
    class="data-[invalid]:border-red-500"
  >
    <DateFieldInput v-for="(item, index) in segments" :key="item.part === 'literal' ? index : item.part" :part="item.part">
      {{ item.value }}
    </DateFieldInput>
  </DateFieldRoot>
</template>
```

### In a form

Inside a [`FieldRoot`](field) the date field takes the field's `name`, `required` and `disabled`, `FieldLabel` labels it, and an incomplete date counts as missing (`valueMissing`). Inside a [`FormRoot`](form), `formSubmit` receives the Temporal value. A date field with a `name` also renders a hidden input holding the value as an ISO string, for native form submission. A `Temporal.ZonedDateTime` value is submitted with its offset and time zone (`2026-11-30T23:59:00-05:00[America/New_York]`). See [Forms and validation](/docs/guides/forms).

```vue
<template>
  <FieldRoot name="birthday" required>
    <FieldLabel>Date of birth</FieldLabel>
    <DateFieldRoot v-slot="{ segments }">
      <DateFieldInput v-for="(item, index) in segments" :key="item.part === 'literal' ? index : item.part" :part="item.part">
        {{ item.value }}
      </DateFieldInput>
    </DateFieldRoot>
    <FieldError match="valueMissing">
      Enter your date of birth.
    </FieldError>
  </FieldRoot>
</template>
```

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
      description: 'Deletes a digit from the focused numeric segments.'
    },
    {
      keys: ['A', 'P'],
      description: 'When the focus is on the day period, it sets it to AM or PM.'
    }
  ]"
/>

In a right-to-left layout (`dir="rtl"` on `DateFieldRoot`, or on a [`ConfigProvider`](/docs/utilities/config-provider)), `ArrowLeft` moves to the next segment and `ArrowRight` to the previous one. See [Internationalization](/docs/guides/i18n#what-changes-in-rtl).

## Headless composable

`useDateField` owns the value, the placeholder and the segments: `segments` (to render), `setModelValue()`, `isInvalid`, the `root` [part surface](/docs/guides/composables#part-surfaces) and `createInputSurface(part)` for each segment, which carries the `spinbutton` role, its `aria-value*` attributes and the typing and arrow-key handling. It registers watchers and collects the segment elements on mount, so call it inside `setup()`. The composable is experimental; see [Headless composables](/docs/guides/composables).
