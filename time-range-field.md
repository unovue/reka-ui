---
title: Time Range Field
description: Allows users to input a range of times within a designated field.
name: time-range-field
---

# Time Range Field
<Badge>Alpha</Badge>

<Description>
Allows users to input a range of times within a designated field.
</Description>

<ComponentPreview name="TimeRangeField" />

## Features
<Highlights
  :features="[
    'Full keyboard navigation',
    'Can be controlled or uncontrolled',
    'Focus is fully managed',
    'Localization support',
    'Highly composable',
    'Accessible by default',
    'Supports various time formats (hour, minute, second)',
    'Time range validation'
  ]"
/>

## Preface

The Time Range Field component relies on the `@internationalized/date` package for date and time manipulation. This package provides a robust, locale-aware way to handle dates and times across different cultures and time zones.

[Learn more about @internationalized/date](https://internationalized.date/)

## Installation

Install the date package with <InstallationTabs value="@internationalized/date" />

Install the component with <InstallationTabs value="reka-ui" />

## Anatomy

Import all parts and piece them together.

```vue
<script setup>
import {
  TimeRangeFieldInput,
  TimeRangeFieldRoot,
} from 'reka-ui'
</script>

<template>
  <TimeRangeFieldRoot>
    <TimeRangeFieldInput part="hour" type="start" />
    <TimeRangeFieldInput part="minute" type="start" />
    <TimeRangeFieldInput part="hour" type="end" />
    <TimeRangeFieldInput part="minute" type="end" />
  </TimeRangeFieldRoot>
</template>
```

## API Reference

### Root

Contains all the parts of a time range field.

<!-- @include: @/meta/TimeRangeFieldRoot.md -->

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
    },
  ]"
/>

### Input

Contains the time field segments.

<!-- @include: @/meta/TimeRangeFieldInput.md -->

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

The Time Range Field component follows the ARIA design pattern for time inputs and includes:

- Proper ARIA attributes for time inputs
- Screen reader announcements for time values
- Full keyboard navigation support
- Focus management between segments
- Visual indicators for invalid states

Each segment is properly labeled and associated with the time range field as a group, ensuring screen reader users understand the relationship between the segments.

## Keyboard Interactions

<KeyboardTable
  :interactions="[
    {
      keys: ['Tab'],
      description: 'When focus moves onto the time range field, focuses the first segment',
    },
    {
      keys: ['ArrowLeft', 'ArrowRight'],
      description: 'Navigates between the time field segments',
    },
    {
      keys: ['ArrowUp', 'ArrowDown'],
      description: 'Increments/changes the value of the segment',
    },
    {
      keys: ['0-9'],
      description: 'Types in the number and focuses the next segment if the next input would result in an invalid value',
    },
    {
      keys: ['Backspace'],
      description: 'Deletes a digit from the focused numeric segments',
    },
    {
      keys: ['A', 'P'],
      description: 'When the focus is on the day period, it sets it to AM or PM',
    },
  ]"
/>

## Examples

### Basic Usage

```vue
<script setup>
import { Label, TimeRangeFieldInput, TimeRangeFieldRoot } from 'reka-ui'
</script>

<template>
  <div class="flex flex-col gap-2">
    <Label for="appointment-time">Appointment Time</Label>
    <TimeRangeFieldRoot
      id="appointment-time"
      v-slot="{ segments, isInvalid }"
      class="flex select-none bg-white items-center rounded text-center border border-gray-300 p-2 data-[invalid]:border-red-500"
    >
      <template v-for="item in segments.start" :key="item.part">
        <TimeRangeFieldInput
          v-if="item.part === 'literal'"
          :part="item.part"
          type="start"
        >
          {{ item.value }}
        </TimeRangeFieldInput>
        <TimeRangeFieldInput
          v-else
          :part="item.part"
          class="rounded px-1 py-1 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 data-[placeholder]:text-gray-500"
          type="start"
        >
          {{ item.value }}
        </TimeRangeFieldInput>
      </template>
      <span class="mx-1">-</span>
      <template v-for="item in segments.end" :key="item.part">
        <TimeRangeFieldInput
          v-if="item.part === 'literal'"
          :part="item.part"
          type="end"
        >
          {{ item.value }}
        </TimeRangeFieldInput>
        <TimeRangeFieldInput
          v-else
          :part="item.part"
          class="rounded px-1 py-1 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 data-[placeholder]:text-gray-500"
          type="end"
        >
          {{ item.value }}
        </TimeRangeFieldInput>
      </template>
      <span v-if="isInvalid" class="ml-2 text-red-500">Invalid time range</span>
    </TimeRangeFieldRoot>
  </div>
</template>
```

### Controlled Component

```vue
<script setup>
import { Time } from '@internationalized/date'
import { Label, TimeRangeFieldInput, TimeRangeFieldRoot } from 'reka-ui'
import { ref } from 'vue'

const timeRange = ref({
  start: new Time(9, 0),
  end: new Time(17, 0)
})

function handleTimeRangeChange(newTimeRange) {
  timeRange.value = newTimeRange
  console.log('Time range changed:', newTimeRange)
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <Label for="work-hours">Work Hours</Label>
    <TimeRangeFieldRoot
      id="work-hours"
      v-slot="{ segments, isInvalid }"
      v-model="timeRange"
      class="flex select-none bg-white items-center rounded text-center border border-gray-300 p-2 data-[invalid]:border-red-500"
    >
      <template v-for="item in segments.start" :key="item.part">
        <TimeRangeFieldInput
          v-if="item.part === 'literal'"
          :part="item.part"
          type="start"
        >
          {{ item.value }}
        </TimeRangeFieldInput>
        <TimeRangeFieldInput
          v-else
          :part="item.part"
          class="rounded px-1 py-1 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 data-[placeholder]:text-gray-500"
          type="start"
        >
          {{ item.value }}
        </TimeRangeFieldInput>
      </template>
      <span class="mx-1">-</span>
      <template v-for="item in segments.end" :key="item.part">
        <TimeRangeFieldInput
          v-if="item.part === 'literal'"
          :part="item.part"
          type="end"
        >
          {{ item.value }}
        </TimeRangeFieldInput>
        <TimeRangeFieldInput
          v-else
          :part="item.part"
          class="rounded px-1 py-1 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 data-[placeholder]:text-gray-500"
          type="end"
        >
          {{ item.value }}
        </TimeRangeFieldInput>
      </template>
      <span v-if="isInvalid" class="ml-2 text-red-500">Invalid time range</span>
    </TimeRangeFieldRoot>
    <div class="text-sm text-gray-600">
      Selected: {{ timeRange.start?.toString() }} - {{ timeRange.end?.toString() }}
    </div>
  </div>
</template>
```

### With Validation

```vue
<script setup>
import { Time } from '@internationalized/date'
import { Label, TimeRangeFieldInput, TimeRangeFieldRoot } from 'reka-ui'
import { ref } from 'vue'

const businessHours = ref({
  start: new Time(9, 0),
  end: new Time(17, 0)
})

// Only allow times between 8:00 AM and 6:00 PM
function isTimeUnavailable(time) {
  const hour = time.hour
  return hour < 8 || hour > 18
}

// Only allow time ranges within business hours
function isTimeRangeValid(timeRange) {
  if (!timeRange.start || !timeRange.end)
    return true

  // Start time must be before end time
  if (timeRange.start.compare(timeRange.end) >= 0)
    return false

  // Both times must be within business hours
  if (isTimeUnavailable(timeRange.start) || isTimeUnavailable(timeRange.end))
    return false

  return true
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <Label for="meeting-time">Meeting Time</Label>
    <TimeRangeFieldRoot
      id="meeting-time"
      v-slot="{ segments, isInvalid }"
      v-model="businessHours"
      :is-time-unavailable="isTimeUnavailable"
      class="flex select-none bg-white items-center rounded text-center border border-gray-300 p-2 data-[invalid]:border-red-500"
    >
      <template v-for="item in segments.start" :key="item.part">
        <TimeRangeFieldInput
          v-if="item.part === 'literal'"
          :part="item.part"
          type="start"
        >
          {{ item.value }}
        </TimeRangeFieldInput>
        <TimeRangeFieldInput
          v-else
          :part="item.part"
          class="rounded px-1 py-1 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 data-[placeholder]:text-gray-500"
          type="start"
        >
          {{ item.value }}
        </TimeRangeFieldInput>
      </template>
      <span class="mx-1">-</span>
      <template v-for="item in segments.end" :key="item.part">
        <TimeRangeFieldInput
          v-if="item.part === 'literal'"
          :part="item.part"
          type="end"
        >
          {{ item.value }}
        </TimeRangeFieldInput>
        <TimeRangeFieldInput
          v-else
          :part="item.part"
          class="rounded px-1 py-1 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 data-[placeholder]:text-gray-500"
          type="end"
        >
          {{ item.value }}
        </TimeRangeFieldInput>
      </template>
      <span v-if="isInvalid" class="ml-2 text-red-500">
        Must be within business hours (8:00 AM - 6:00 PM)
      </span>
    </TimeRangeFieldRoot>
    <div class="text-sm text-gray-600">
      Business hours only (8:00 AM - 6:00 PM)
    </div>
  </div>
</template>
```

### With Custom Granularity

```vue
<script setup>
import { Time } from '@internationalized/date'
import { Label, TimeRangeFieldInput, TimeRangeFieldRoot } from 'reka-ui'
import { ref } from 'vue'

const preciseTime = ref({
  start: new Time(9, 0, 30),
  end: new Time(17, 30, 0)
})

const hourOnlyTime = ref({
  start: new Time(9, 0),
  end: new Time(17, 0)
})
</script>

<template>
  <div class="space-y-6">
    <!-- With seconds -->
    <div class="flex flex-col gap-2">
      <Label for="precise-time">Precise Time (with seconds)</Label>
      <TimeRangeFieldRoot
        id="precise-time"
        v-slot="{ segments, isInvalid }"
        v-model="preciseTime"
        granularity="second"
        class="flex select-none bg-white items-center rounded text-center border border-gray-300 p-2 data-[invalid]:border-red-500"
      >
        <template v-for="item in segments.start" :key="item.part">
          <TimeRangeFieldInput
            v-if="item.part === 'literal'"
            :part="item.part"
            type="start"
          >
            {{ item.value }}
          </TimeRangeFieldInput>
          <TimeRangeFieldInput
            v-else
            :part="item.part"
            class="rounded px-1 py-1 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 data-[placeholder]:text-gray-500"
            type="start"
          >
            {{ item.value }}
          </TimeRangeFieldInput>
        </template>
        <span class="mx-1">-</span>
        <template v-for="item in segments.end" :key="item.part">
          <TimeRangeFieldInput
            v-if="item.part === 'literal'"
            :part="item.part"
            type="end"
          >
            {{ item.value }}
          </TimeRangeFieldInput>
          <TimeRangeFieldInput
            v-else
            :part="item.part"
            class="rounded px-1 py-1 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 data-[placeholder]:text-gray-500"
            type="end"
          >
            {{ item.value }}
          </TimeRangeFieldInput>
        </template>
        <span v-if="isInvalid" class="ml-2 text-red-500">Invalid time range</span>
      </TimeRangeFieldRoot>
    </div>

    <!-- Hours only -->
    <div class="flex flex-col gap-2">
      <Label for="hour-only-time">Hour Only</Label>
      <TimeRangeFieldRoot
        id="hour-only-time"
        v-slot="{ segments, isInvalid }"
        v-model="hourOnlyTime"
        granularity="hour"
        class="flex select-none bg-white items-center rounded text-center border border-gray-300 p-2 data-[invalid]:border-red-500"
      >
        <template v-for="item in segments.start" :key="item.part">
          <TimeRangeFieldInput
            v-if="item.part === 'literal'"
            :part="item.part"
            type="start"
          >
            {{ item.value }}
          </TimeRangeFieldInput>
          <TimeRangeFieldInput
            v-else
            :part="item.part"
            class="rounded px-1 py-1 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 data-[placeholder]:text-gray-500"
            type="start"
          >
            {{ item.value }}
          </TimeRangeFieldInput>
        </template>
        <span class="mx-1">-</span>
        <template v-for="item in segments.end" :key="item.part">
          <TimeRangeFieldInput
            v-if="item.part === 'literal'"
            :part="item.part"
            type="end"
          >
            {{ item.value }}
          </TimeRangeFieldInput>
          <TimeRangeFieldInput
            v-else
            :part="item.part"
            class="rounded px-1 py-1 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 data-[placeholder]:text-gray-500"
            type="end"
          >
            {{ item.value }}
          </TimeRangeFieldInput>
        </template>
        <span v-if="isInvalid" class="ml-2 text-red-500">Invalid time range</span>
      </TimeRangeFieldRoot>
    </div>
  </div>
</template>
```

### With Locale and Hour Cycle

```vue
<script setup>
import { Time } from '@internationalized/date'
import { Label, TimeRangeFieldInput, TimeRangeFieldRoot } from 'reka-ui'
import { ref } from 'vue'

const usTime = ref({
  start: new Time(9, 0),
  end: new Time(17, 0)
})

const euTime = ref({
  start: new Time(9, 0),
  end: new Time(17, 0)
})
</script>

<template>
  <div class="space-y-6">
    <!-- US format (12-hour) -->
    <div class="flex flex-col gap-2">
      <Label for="us-time">US Time Format (12-hour)</Label>
      <TimeRangeFieldRoot
        id="us-time"
        v-slot="{ segments, isInvalid }"
        v-model="usTime"
        locale="en-US"
        hour-cycle="h12"
        class="flex select-none bg-white items-center rounded text-center border border-gray-300 p-2 data-[invalid]:border-red-500"
      >
        <template v-for="item in segments.start" :key="item.part">
          <TimeRangeFieldInput
            v-if="item.part === 'literal'"
            :part="item.part"
            type="start"
          >
            {{ item.value }}
          </TimeRangeFieldInput>
          <TimeRangeFieldInput
            v-else
            :part="item.part"
            class="rounded px-1 py-1 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 data-[placeholder]:text-gray-500"
            type="start"
          >
            {{ item.value }}
          </TimeRangeFieldInput>
        </template>
        <span class="mx-1">-</span>
        <template v-for="item in segments.end" :key="item.part">
          <TimeRangeFieldInput
            v-if="item.part === 'literal'"
            :part="item.part"
            type="end"
          >
            {{ item.value }}
          </TimeRangeFieldInput>
          <TimeRangeFieldInput
            v-else
            :part="item.part"
            class="rounded px-1 py-1 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 data-[placeholder]:text-gray-500"
            type="end"
          >
            {{ item.value }}
          </TimeRangeFieldInput>
        </template>
        <span v-if="isInvalid" class="ml-2 text-red-500">Invalid time range</span>
      </TimeRangeFieldRoot>
    </div>

    <!-- EU format (24-hour) -->
    <div class="flex flex-col gap-2">
      <Label for="eu-time">EU Time Format (24-hour)</Label>
      <TimeRangeFieldRoot
        id="eu-time"
        v-slot="{ segments, isInvalid }"
        v-model="euTime"
        locale="de-DE"
        hour-cycle="h23"
        class="flex select-none bg-white items-center rounded text-center border border-gray-300 p-2 data-[invalid]:border-red-500"
      >
        <template v-for="item in segments.start" :key="item.part">
          <TimeRangeFieldInput
            v-if="item.part === 'literal'"
            :part="item.part"
            type="start"
          >
            {{ item.value }}
          </TimeRangeFieldInput>
          <TimeRangeFieldInput
            v-else
            :part="item.part"
            class="rounded px-1 py-1 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 data-[placeholder]:text-gray-500"
            type="start"
          >
            {{ item.value }}
          </TimeRangeFieldInput>
        </template>
        <span class="mx-1">-</span>
        <template v-for="item in segments.end" :key="item.part">
          <TimeRangeFieldInput
            v-if="item.part === 'literal'"
            :part="item.part"
            type="end"
          >
            {{ item.value }}
          </TimeRangeFieldInput>
          <TimeRangeFieldInput
            v-else
            :part="item.part"
            class="rounded px-1 py-1 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 data-[placeholder]:text-gray-500"
            type="end"
          >
            {{ item.value }}
          </TimeRangeFieldInput>
        </template>
        <span v-if="isInvalid" class="ml-2 text-red-500">Invalid time range</span>
      </TimeRangeFieldRoot>
    </div>
  </div>
</template>
