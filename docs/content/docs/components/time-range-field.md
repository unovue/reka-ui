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
    'Supports various time formats',
    'Time range validation',
    'Configurable granularity'
  ]"
/>

## Preface

The component depends on the [@internationalized/date](https://react-spectrum.adobe.com/internationalized/date/index.html) package, which solves a lot of the problems that come with working with dates and times in JavaScript.

We highly recommend reading through the documentation for the package to get a solid feel for how it works, and you'll need to install it in your project to use the time-related components.

## Installation

Install the date package.

<InstallationTabs value="@internationalized/date" />

Install the component from your command line.

<InstallationTabs value="reka-ui" />

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
    }
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

### Keyboard Interactions

<KeyboardTable
  :data="[
    {
      keys: ['Tab'],
      description: 'When focus moves onto the time field, focuses the first segment.'
    },
    {
      keys: ['ArrowLeft', 'ArrowRight'],
      description:
      `
       Navigates between the time field segments.
      `
    },
    {
      keys: ['ArrowUp', 'ArrowDown'],
      description: 'Increments/changes the value of the segment.'
    },
    {
      keys: ['0-9'],
      description: `
          When the focus is on a numeric <Code>TimeRangeFieldInput</Code>, it types in the number and focuses the next segment if the next input would result in an invalid value.
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

## Usage Examples

### Basic Usage

```vue
<script setup>
import { Time } from '@internationalized/date'
import { TimeRangeFieldInput, TimeRangeFieldRoot } from 'reka-ui'
import { ref } from 'vue'

const timeRange = ref({
  start: new Time(9, 0),
  end: new Time(17, 0)
})
</script>

<template>
  <TimeRangeFieldRoot v-model="timeRange">
    <div class="flex items-center gap-2">
      <TimeRangeFieldInput part="hour" type="start" />
      <span>:</span>
      <TimeRangeFieldInput part="minute" type="start" />
      <span class="mx-2">to</span>
      <TimeRangeFieldInput part="hour" type="end" />
      <span>:</span>
      <TimeRangeFieldInput part="minute" type="end" />
    </div>
  </TimeRangeFieldRoot>
</template>
```

### Controlled Component

```vue
<script setup>
import { TimeRangeFieldInput, TimeRangeFieldRoot } from 'reka-ui'
import { ref } from 'vue'

const timeRange = ref({
  start: undefined,
  end: undefined
})

function handleTimeRangeChange(newRange) {
  console.log('Time range changed:', newRange)
  timeRange.value = newRange
}
</script>

<template>
  <TimeRangeFieldRoot
    :model-value="timeRange"
    @update:model-value="handleTimeRangeChange"
  >
    <div class="flex items-center gap-2">
      <TimeRangeFieldInput part="hour" type="start" />
      <span>:</span>
      <TimeRangeFieldInput part="minute" type="start" />
      <span class="mx-2">to</span>
      <TimeRangeFieldInput part="hour" type="end" />
      <span>:</span>
      <TimeRangeFieldInput part="minute" type="end" />
    </div>
  </TimeRangeFieldRoot>
</template>
```

### With Validation

```vue
<script setup>
import { Time } from '@internationalized/date'
import { TimeRangeFieldInput, TimeRangeFieldRoot } from 'reka-ui'
import { ref } from 'vue'

const timeRange = ref({
  start: new Time(9, 0),
  end: new Time(17, 0)
})

// Disable times before 8 AM and after 6 PM
function isTimeUnavailable(time) {
  const hour = time.hour
  return hour < 8 || hour > 18
}
</script>

<template>
  <TimeRangeFieldRoot
    v-model="timeRange"
    :is-time-unavailable="isTimeUnavailable"
  >
    <div class="flex items-center gap-2">
      <TimeRangeFieldInput part="hour" type="start" />
      <span>:</span>
      <TimeRangeFieldInput part="minute" type="start" />
      <span class="mx-2">to</span>
      <TimeRangeFieldInput part="hour" type="end" />
      <span>:</span>
      <TimeRangeFieldInput part="minute" type="end" />
    </div>
    <p v-if="timeRange.start && isTimeUnavailable(timeRange.start)" class="text-red-500 text-sm mt-1">
      Start time is unavailable
    </p>
    <p v-if="timeRange.end && isTimeUnavailable(timeRange.end)" class="text-red-500 text-sm mt-1">
      End time is unavailable
    </p>
  </TimeRangeFieldRoot>
</template>
```

### With Different Granularity

```vue
<script setup>
import { Time } from '@internationalized/date'
import { TimeRangeFieldInput, TimeRangeFieldRoot } from 'reka-ui'
import { ref } from 'vue'

const timeRange = ref({
  start: new Time(9, 0, 30),
  end: new Time(17, 30, 0)
})
</script>

<template>
  <div class="space-y-4">
    <!-- Hour and minute only -->
    <div>
      <label class="block text-sm font-medium mb-2">Hour and Minute</label>
      <TimeRangeFieldRoot v-model="timeRange" granularity="minute">
        <div class="flex items-center gap-2">
          <TimeRangeFieldInput part="hour" type="start" />
          <span>:</span>
          <TimeRangeFieldInput part="minute" type="start" />
          <span class="mx-2">to</span>
          <TimeRangeFieldInput part="hour" type="end" />
          <span>:</span>
          <TimeRangeFieldInput part="minute" type="end" />
        </div>
      </TimeRangeFieldRoot>
    </div>

    <!-- Hour only -->
    <div>
      <label class="block text-sm font-medium mb-2">Hour Only</label>
      <TimeRangeFieldRoot v-model="timeRange" granularity="hour">
        <div class="flex items-center gap-2">
          <TimeRangeFieldInput part="hour" type="start" />
          <span class="mx-2">to</span>
          <TimeRangeFieldInput part="hour" type="end" />
        </div>
      </TimeRangeFieldRoot>
    </div>

    <!-- Hour, minute, and second -->
    <div>
      <label class="block text-sm font-medium mb-2">Hour, Minute, and Second</label>
      <TimeRangeFieldRoot v-model="timeRange" granularity="second">
        <div class="flex items-center gap-2">
          <TimeRangeFieldInput part="hour" type="start" />
          <span>:</span>
          <TimeRangeFieldInput part="minute" type="start" />
          <span>:</span>
          <TimeRangeFieldInput part="second" type="start" />
          <span class="mx-2">to</span>
          <TimeRangeFieldInput part="hour" type="end" />
          <span>:</span>
          <TimeRangeFieldInput part="minute" type="end" />
          <span>:</span>
          <TimeRangeFieldInput part="second" type="end" />
        </div>
      </TimeRangeFieldRoot>
    </div>
  </div>
</template>
```

### With Locale and Hour Cycle

```vue
<script setup>
import { Time } from '@internationalized/date'
import { TimeRangeFieldInput, TimeRangeFieldRoot } from 'reka-ui'
import { ref } from 'vue'

const timeRange = ref({
  start: new Time(9, 0),
  end: new Time(17, 0)
})
</script>

<template>
  <div class="space-y-4">
    <!-- 24-hour format (default) -->
    <div>
      <label class="block text-sm font-medium mb-2">24-hour format</label>
      <TimeRangeFieldRoot v-model="timeRange" hour-cycle="h23">
        <div class="flex items-center gap-2">
          <TimeRangeFieldInput part="hour" type="start" />
          <span>:</span>
          <TimeRangeFieldInput part="minute" type="start" />
          <span class="mx-2">to</span>
          <TimeRangeFieldInput part="hour" type="end" />
          <span>:</span>
          <TimeRangeFieldInput part="minute" type="end" />
        </div>
      </TimeRangeFieldRoot>
    </div>

    <!-- 12-hour format with AM/PM -->
    <div>
      <label class="block text-sm font-medium mb-2">12-hour format</label>
      <TimeRangeFieldRoot v-model="timeRange" hour-cycle="h12">
        <div class="flex items-center gap-2">
          <TimeRangeFieldInput part="hour" type="start" />
          <span>:</span>
          <TimeRangeFieldInput part="minute" type="start" />
          <TimeRangeFieldInput part="dayPeriod" type="start" />
          <span class="mx-2">to</span>
          <TimeRangeFieldInput part="hour" type="end" />
          <span>:</span>
          <TimeRangeFieldInput part="minute" type="end" />
          <TimeRangeFieldInput part="dayPeriod" type="end" />
        </div>
      </TimeRangeFieldRoot>
    </div>

    <!-- French locale -->
    <div>
      <label class="block text-sm font-medium mb-2">French locale</label>
      <TimeRangeFieldRoot v-model="timeRange" locale="fr">
        <div class="flex items-center gap-2">
          <TimeRangeFieldInput part="hour" type="start" />
          <span>:</span>
          <TimeRangeFieldInput part="minute" type="start" />
          <span class="mx-2">à</span>
          <TimeRangeFieldInput part="hour" type="end" />
          <span>:</span>
          <TimeRangeFieldInput part="minute" type="end" />
        </div>
      </TimeRangeFieldRoot>
    </div>
  </div>
</template>
```

### With Min and Max Values

```vue
<script setup>
import { Time } from '@internationalized/date'
import { TimeRangeFieldInput, TimeRangeFieldRoot } from 'reka-ui'
import { ref } from 'vue'

const timeRange = ref({
  start: new Time(9, 0),
  end: new Time(17, 0)
})

// Restrict times between 8 AM and 6 PM
const minTime = new Time(8, 0)
const maxTime = new Time(18, 0)
</script>

<template>
  <TimeRangeFieldRoot
    v-model="timeRange"
    :min-value="minTime"
    :max-value="maxTime"
  >
    <div class="flex items-center gap-2">
      <TimeRangeFieldInput part="hour" type="start" />
      <span>:</span>
      <TimeRangeFieldInput part="minute" type="start" />
      <span class="mx-2">to</span>
      <TimeRangeFieldInput part="hour" type="end" />
      <span>:</span>
      <TimeRangeFieldInput part="minute" type="end" />
    </div>
    <p class="text-gray-500 text-sm mt-1">
      Business hours: 8:00 AM - 6:00 PM
    </p>
  </TimeRangeFieldRoot>
</template>
```

### With Step Increment

```vue
<script setup>
import { Time } from '@internationalized/date'
import { TimeRangeFieldInput, TimeRangeFieldRoot } from 'reka-ui'
import { ref } from 'vue'

const timeRange = ref({
  start: new Time(9, 0),
  end: new Time(17, 0)
})

// Increment minutes by 15
const step = { minute: 15 }
</script>

<template>
  <TimeRangeFieldRoot
    v-model="timeRange"
    :step="step"
  >
    <div class="flex items-center gap-2">
      <TimeRangeFieldInput part="hour" type="start" />
      <span>:</span>
      <TimeRangeFieldInput part="minute" type="start" />
      <span class="mx-2">to</span>
      <TimeRangeFieldInput part="hour" type="end" />
      <span>:</span>
      <TimeRangeFieldInput part="minute" type="end" />
    </div>
    <p class="text-gray-500 text-sm mt-1">
      Minutes increment by 15
    </p>
  </TimeRangeFieldRoot>
</template>
```

### Disabled State

```vue
<script setup>
import { Time } from '@internationalized/date'
import { TimeRangeFieldInput, TimeRangeFieldRoot } from 'reka-ui'
import { ref } from 'vue'

const timeRange = ref({
  start: new Time(9, 0),
  end: new Time(17, 0)
})

const isDisabled = ref(true)
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center gap-2">
      <input id="disable" v-model="isDisabled" type="checkbox">
      <label for="disable">Disable time range field</label>
    </div>

    <TimeRangeFieldRoot
      v-model="timeRange"
      :disabled="isDisabled"
    >
      <div class="flex items-center gap-2">
        <TimeRangeFieldInput part="hour" type="start" />
        <span>:</span>
        <TimeRangeFieldInput part="minute" type="start" />
        <span class="mx-2">to</span>
        <TimeRangeFieldInput part="hour" type="end" />
        <span>:</span>
        <TimeRangeFieldInput part="minute" type="end" />
      </div>
    </TimeRangeFieldRoot>
  </div>
</template>
```

### Read-only State

```vue
<script setup>
import { Time } from '@internationalized/date'
import { TimeRangeFieldInput, TimeRangeFieldRoot } from 'reka-ui'
import { ref } from 'vue'

const timeRange = ref({
  start: new Time(9, 0),
  end: new Time(17, 0)
})

const isReadonly = ref(true)
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center gap-2">
      <input id="readonly" v-model="isReadonly" type="checkbox">
      <label for="readonly">Make time range field read-only</label>
    </div>

    <TimeRangeFieldRoot
      v-model="timeRange"
      :readonly="isReadonly"
    >
      <div class="flex items-center gap-2">
        <TimeRangeFieldInput part="hour" type="start" />
        <span>:</span>
        <TimeRangeFieldInput part="minute" type="start" />
        <span class="mx-2">to</span>
        <TimeRangeFieldInput part="hour" type="end" />
        <span>:</span>
        <TimeRangeFieldInput part="minute" type="end" />
      </div>
    </TimeRangeFieldRoot>
  </div>
</template>
```

### Advanced Keyboard Navigation

The TimeRangeField provides intuitive keyboard navigation for efficient time input. Users can seamlessly move between time segments, increment or decrement values, and type numbers directly.

```vue
<script setup>
import { Time } from '@internationalized/date'
import { TimeRangeFieldInput, TimeRangeFieldRoot } from 'reka-ui'
import { ref } from 'vue'

const timeRange = ref({
  start: new Time(9, 0),
  end: new Time(17, 0)
})
</script>

<template>
  <div class="space-y-4">
    <p class="text-sm text-gray-600">
      Try navigating with Tab, Arrow keys, and typing numbers. Focus moves automatically between segments.
    </p>
    <TimeRangeFieldRoot v-model="timeRange">
      <div class="flex items-center gap-2">
        <TimeRangeFieldInput part="hour" type="start" />
        <span>:</span>
        <TimeRangeFieldInput part="minute" type="start" />
        <span class="mx-2">to</span>
        <TimeRangeFieldInput part="hour" type="end" />
        <span>:</span>
        <TimeRangeFieldInput part="minute" type="end" />
      </div>
    </TimeRangeFieldRoot>
    <div class="text-xs text-gray-500">
      <strong>Keyboard shortcuts:</strong> Tab to navigate, Arrow Up/Down to change values, type numbers to input.
    </div>
  </div>
</template>
```

### Form Integration

Integrate TimeRangeField with HTML forms to handle submissions and validation.

```vue
<script setup>
import { Time } from '@internationalized/date'
import { TimeRangeFieldInput, TimeRangeFieldRoot } from 'reka-ui'
import { ref } from 'vue'

const timeRange = ref({
  start: new Time(9, 0),
  end: new Time(17, 0)
})

function handleSubmit() {
  console.log('Form submitted with time range:', timeRange.value)
  // Handle form submission
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">
    <div>
      <label class="block text-sm font-medium mb-2">Select Time Range</label>
      <TimeRangeFieldRoot v-model="timeRange">
        <div class="flex items-center gap-2">
          <TimeRangeFieldInput part="hour" type="start" />
          <span>:</span>
          <TimeRangeFieldInput part="minute" type="start" />
          <span class="mx-2">to</span>
          <TimeRangeFieldInput part="hour" type="end" />
          <span>:</span>
          <TimeRangeFieldInput part="minute" type="end" />
        </div>
      </TimeRangeFieldRoot>
    </div>
    <button type="submit" class="px-4 py-2 bg-blue-500 text-white rounded">
      Submit
    </button>
  </form>
</template>
```

### Custom Styling

Customize the appearance of the TimeRangeField using CSS classes or Tailwind utilities.

```vue
<script setup>
import { Time } from '@internationalized/date'
import { TimeRangeFieldInput, TimeRangeFieldRoot } from 'reka-ui'
import { ref } from 'vue'

const timeRange = ref({
  start: new Time(9, 0),
  end: new Time(17, 0)
})
</script>

<template>
  <TimeRangeFieldRoot v-model="timeRange">
    <div class="flex items-center gap-2 p-4 border border-gray-300 rounded-lg bg-gray-50">
      <TimeRangeFieldInput
        part="hour"
        type="start"
        class="w-12 text-center border border-blue-300 rounded px-2 py-1 focus:border-blue-500 focus:outline-none"
      />
      <span class="text-gray-500">:</span>
      <TimeRangeFieldInput
        part="minute"
        type="start"
        class="w-12 text-center border border-blue-300 rounded px-2 py-1 focus:border-blue-500 focus:outline-none"
      />
      <span class="mx-2 text-gray-500">to</span>
      <TimeRangeFieldInput
        part="hour"
        type="end"
        class="w-12 text-center border border-blue-300 rounded px-2 py-1 focus:border-blue-500 focus:outline-none"
      />
      <span class="text-gray-500">:</span>
      <TimeRangeFieldInput
        part="minute"
        type="end"
        class="w-12 text-center border border-blue-300 rounded px-2 py-1 focus:border-blue-500 focus:outline-none"
      />
    </div>
  </TimeRangeFieldRoot>
</template>
```

### Advanced Validation

Implement complex validation rules, such as ensuring the end time is after the start time and within business hours.

```vue
<script setup>
import { Time } from '@internationalized/date'
import { TimeRangeFieldInput, TimeRangeFieldRoot } from 'reka-ui'
import { ref, watch } from 'vue'

const timeRange = ref({
  start: new Time(9, 0),
  end: new Time(17, 0)
})

const errors = ref([])

watch(timeRange, (newRange) => {
  errors.value = []
  if (newRange.start && newRange.end) {
    if (newRange.start.compare(newRange.end) >= 0) {
      errors.value.push('End time must be after start time')
    }
    if (newRange.start.hour < 8 || newRange.start.hour > 18) {
      errors.value.push('Start time must be between 8 AM and 6 PM')
    }
    if (newRange.end.hour < 8 || newRange.end.hour > 18) {
      errors.value.push('End time must be between 8 AM and 6 PM')
    }
  }
}, { deep: true })
</script>

<template>
  <TimeRangeFieldRoot v-model="timeRange">
    <div class="flex items-center gap-2">
      <TimeRangeFieldInput part="hour" type="start" />
      <span>:</span>
      <TimeRangeFieldInput part="minute" type="start" />
      <span class="mx-2">to</span>
      <TimeRangeFieldInput part="hour" type="end" />
      <span>:</span>
      <TimeRangeFieldInput part="minute" type="end" />
    </div>
    <div v-if="errors.length" class="mt-2">
      <p v-for="error in errors" :key="error" class="text-red-500 text-sm">
        {{ error }}
      </p>
    </div>
  </TimeRangeFieldRoot>
</template>
```

### Accessibility Features

The TimeRangeField is built with accessibility in mind. Enhance it further with ARIA labels and descriptions for screen readers.

```vue
<script setup>
import { Time } from '@internationalized/date'
import { TimeRangeFieldInput, TimeRangeFieldRoot } from 'reka-ui'
import { ref } from 'vue'

const timeRange = ref({
  start: new Time(9, 0),
  end: new Time(17, 0)
})
</script>

<template>
  <div>
    <label for="time-range" class="block text-sm font-medium mb-2">Meeting Time Range</label>
    <TimeRangeFieldRoot id="time-range" v-model="timeRange" aria-describedby="time-range-help">
      <div class="flex items-center gap-2">
        <TimeRangeFieldInput
          part="hour"
          type="start"
          aria-label="Start hour"
        />
        <span aria-hidden="true">:</span>
        <TimeRangeFieldInput
          part="minute"
          type="start"
          aria-label="Start minute"
        />
        <span class="mx-2" aria-hidden="true">to</span>
        <TimeRangeFieldInput
          part="hour"
          type="end"
          aria-label="End hour"
        />
        <span aria-hidden="true">:</span>
        <TimeRangeFieldInput
          part="minute"
          type="end"
          aria-label="End minute"
        />
      </div>
    </TimeRangeFieldRoot>
    <p id="time-range-help" class="text-xs text-gray-500 mt-1">
      Select the start and end times for your meeting. Use Tab to navigate between fields.
    </p>
  </div>
</template>
```

### Real-world Use Cases

Use TimeRangeField in practical scenarios like scheduling appointments or booking resources.

```vue
<script setup>
import { Time } from '@internationalized/date'
import { TimeRangeFieldInput, TimeRangeFieldRoot } from 'reka-ui'
import { ref } from 'vue'

const appointment = ref({
  date: new Date(),
  timeRange: {
    start: new Time(10, 0),
    end: new Time(11, 0)
  },
  title: ''
})

function bookAppointment() {
  console.log('Booking appointment:', appointment.value)
  // API call to book appointment
}
</script>

<template>
  <div class="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
    <h2 class="text-xl font-bold mb-4">
      Book an Appointment
    </h2>
    <form class="space-y-4" @submit.prevent="bookAppointment">
      <div>
        <label class="block text-sm font-medium mb-2">Appointment Title</label>
        <input v-model="appointment.title" type="text" class="w-full px-3 py-2 border border-gray-300 rounded" required>
      </div>
      <div>
        <label class="block text-sm font-medium mb-2">Date</label>
        <input v-model="appointment.date" type="date" class="w-full px-3 py-2 border border-gray-300 rounded" required>
      </div>
      <div>
        <label class="block text-sm font-medium mb-2">Time Range</label>
        <TimeRangeFieldRoot v-model="appointment.timeRange">
          <div class="flex items-center gap-2">
            <TimeRangeFieldInput part="hour" type="start" class="w-12 text-center border border-gray-300 rounded px-2 py-1" />
            <span>:</span>
            <TimeRangeFieldInput part="minute" type="start" class="w-12 text-center border border-gray-300 rounded px-2 py-1" />
            <span class="mx-2">to</span>
            <TimeRangeFieldInput part="hour" type="end" class="w-12 text-center border border-gray-300 rounded px-2 py-1" />
            <span>:</span>
            <TimeRangeFieldInput part="minute" type="end" class="w-12 text-center border border-gray-300 rounded px-2 py-1" />
          </div>
        </TimeRangeFieldRoot>
      </div>
      <button type="submit" class="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
        Book Appointment
      </button>
    </form>
  </div>
</template>
