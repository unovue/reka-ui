---
title: Date Picker
description: Facilitates the selection of dates through an input and calendar-based interface.
name: date-picker
---

# Date Picker

<Description>
Facilitates the selection of dates through an input and calendar-based interface.
</Description>

<ComponentPreview name="DatePicker" />

## Features

<Highlights
  :features="[
    'Full keyboard navigation',
    'Can be controlled or uncontrolled',
    'Focus is fully managed',
    'Localization support',
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
  DatePickerAnchor,
  DatePickerArrow,
  DatePickerCalendar,
  DatePickerCell,
  DatePickerCellTrigger,
  DatePickerClose,
  DatePickerContent,
  DatePickerField,
  DatePickerGrid,
  DatePickerGridBody,
  DatePickerGridHead,
  DatePickerGridRow,
  DatePickerHeadCell,
  DatePickerHeader,
  DatePickerHeading,
  DatePickerInput,
  DatePickerNext,
  DatePickerPrev,
  DatePickerRoot,
  DatePickerTrigger,
} from 'reka-ui'
</script>

<template>
  <DatePickerRoot>
    <DatePickerField>
      <DatePickerInput />
      <DatePickerTrigger />
    </DatePickerField>

    <DatePickerAnchor />
    <DatePickerContent>
      <DatePickerClose />
      <DatePickerArrow />

      <DatePickerCalendar>
        <DatePickerHeader>
          <DatePickerPrev />
          <DatePickerHeading />
          <DatePickerNext />
        </DatePickerHeader>

        <DatePickerGrid>
          <DatePickerGridHead>
            <DatePickerGridRow>
              <DatePickerHeadCell />
            </DatePickerGridRow>
          </DatePickerGridHead>

          <DatePickerGridBody>
            <DatePickerGridRow>
              <DatePickerCell>
                <DatePickerCellTrigger />
              </DatePickerCell>
            </DatePickerGridRow>
          </DatePickerGridBody>
        </DatePickerGrid>
      </DatePickerCalendar>
    </DatePickerContent>
  </DatePickerRoot>
</template>
```

## API Reference

### Root

Contains all the parts of a date picker

<!-- @include: @/meta/DatePickerRoot.md -->

### Field

Contains the date picker date field segments and trigger

<!-- @include: @/meta/DatePickerField.md -->

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

Contains the date picker date field segments

<!-- @include: @/meta/DatePickerInput.md -->

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
    }
  ]"
/>

### Trigger

The button that toggles the popover. By default, the `DatePickerContent` will position itself against the trigger. A trigger that holds only an icon has no accessible name, so give it an `aria-label` (for example `aria-label="Open calendar"`).

<!-- @include: @/meta/DatePickerTrigger.md -->

### Content

The component that pops out when the popover is open.

<!-- @include: @/meta/DatePickerContent.md -->

### Arrow

An optional arrow element to render alongside the popover. This can be used to help visually link the anchor with the `DatePickerContent`. Must be rendered inside `DatePickerContent`.

<!-- @include: @/meta/DatePickerArrow.md -->

### Close

The button that closes an open date picker.

<!-- @include: @/meta/DatePickerClose.md -->

### Anchor

An optional element to position the `DatePickerContent` against. If this part is not used, the content will position alongside the `DatePickerTrigger`.

<!-- @include: @/meta/DatePickerAnchor.md -->

### Calendar

Contains all the parts of a calendar

<!-- @include: @/meta/DatePickerCalendar.md -->

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
      attribute: '[data-readonly]',
      values: 'Present when readonly',
    }
  ]"
/>

### Header

Contains the navigation buttons and the heading segments.

<!-- @include: @/meta/DatePickerHeader.md -->

### Prev Button

Calendar navigation button. It navigates the calendar one month/year/decade in the past based on the current calendar view.

<!-- @include: @/meta/DatePickerPrev.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    },
  ]"
/>

### Next Button

Calendar navigation button. It navigates the calendar one month/year/decade in the future based on the current calendar view.

<!-- @include: @/meta/DatePickerNext.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    }
  ]"
/>

### Heading

Heading for displaying the current month and year/

<!-- @include: @/meta/DatePickerHeading.md -->

### Grid

Container for wrapping the calendar grid.

<!-- @include: @/meta/DatePickerGrid.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    },
    {
      attribute: '[data-readonly]',
      values: 'Present when readonly',
    }
  ]"
/>

### Grid Head

Container for wrapping the grid head.

<!-- @include: @/meta/DatePickerGridHead.md -->

### Grid Body

Container for wrapping the grid body.

<!-- @include: @/meta/DatePickerGridBody.md -->

### Grid Row

Container for wrapping the grid row.

<!-- @include: @/meta/DatePickerGridRow.md -->

### Head Cell

Container for wrapping the head cell. Used for displaying the week days.

<!-- @include: @/meta/DatePickerHeadCell.md -->

### Cell

Container for wrapping the calendar cells.

<!-- @include: @/meta/DatePickerCell.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    },
  ]"
/>

### Cell Trigger

Interactable container for displaying the cell dates. Clicking it selects the date.

<!-- @include: @/meta/DatePickerCellTrigger.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-selected]',
      values: 'Present when selected',
    },
    {
      attribute: '[data-value]',
      values: 'The ISO string value of the date.',
    },
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    },
    {
      attribute: '[data-unavailable]',
      values: 'Present when unavailable',
    },
    {
      attribute: '[data-today]',
      values: 'Present when today',
    },
    {
      attribute: '[data-outside-view]',
      values: 'Present when the date is outside the current month it is displayed in.',
    },
    {
      attribute: '[data-outside-visible-view]',
      values: 'Present when the date is outside the months that are visible on the calendar.',
    },
    {
      attribute: '[data-focused]',
      values: 'Present when focused',
    }
  ]"
/>

### View

Renders its content only while the calendar's `view` matches. Wrap each of the day, month and year grids in one to let users drill between them; a picker that only shows the day grid can omit it.

<!-- @include: @/meta/DatePickerView.md -->

### View Trigger

The calendar heading as a button that switches to the next coarser view (day → month → year) up to `maxView`. Selecting a cell in a coarser view drills back down without changing the value or closing the popover.

<!-- @include: @/meta/DatePickerViewTrigger.md -->

## Examples

### Booking a day

`min-value` and `max-value` bound the dates, and `is-date-unavailable` strikes out days that can't be picked, here weekends (with `isWeekend` from `reka-ui/date`, which follows the locale) and fully booked days. Inside a [`FieldRoot`](field) the picker's field takes the field's `name` and `required`, and a `validate` function explains what's wrong with a date the user typed into the segments. Inside a [`FormRoot`](form) the submitted value is a `Temporal.PlainDate`.

<ComponentPreview name="DatePickerBooking" />

### Picking a date and time

The type of the value sets the segments. A `Temporal.PlainDateTime` (or a `placeholder` of that type) adds hour and minute segments; `granularity` sets the smallest one (`'day'`, `'hour'`, `'minute'` or `'second'`), and `hour-cycle` forces a 12 or 24 hour clock instead of the locale's. The calendar keeps the time of day when the user picks another day.

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

const startsAt = shallowRef(Temporal.PlainDateTime.from('2026-11-04T09:30'))
</script>

<template>
  <DatePickerRoot
    v-model="startsAt"
    granularity="minute"
    :hour-cycle="24"
  >
    <!-- ... -->
  </DatePickerRoot>
</template>
```

### In a time zone

With a `Temporal.ZonedDateTime`, the field shows the wall-clock time in the value's zone with the zone's name, and the value keeps its zone when the user picks another day. Set `hide-time-zone` to leave the zone name out of the field. Convert a value to show it in another zone: `startsAt.withTimeZone('Europe/Paris')`. See [Time zones](/docs/guides/dates#time-zones).

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

const meeting = shallowRef(Temporal.ZonedDateTime.from('2026-11-04T15:00[America/New_York]'))
</script>

<template>
  <DatePickerRoot v-model="meeting" granularity="minute">
    <!-- ... -->
  </DatePickerRoot>
</template>
```

### Closing on select

By default the calendar stays open after a date is picked, so the user can check the field before leaving. Set `close-on-select` to close it as soon as a date is picked; that close carries the reason `'date-select'` in the `update:open` details.

```vue
<template>
  <DatePickerRoot v-model="date" close-on-select>
    <!-- ... -->
  </DatePickerRoot>
</template>
```

## Real-world examples

- [Date Picker View Switching](/examples/date-picker-view-switching): One Calendar with day, month and year views: click the heading to drill up, select a cell to drill back down.
- [Date Picker Selection](/examples/date-picker-selection): Date pickers let users select a date or a range of dates. They commonly use in booking systems.

## Accessibility

### Keyboard Interactions

<KeyboardTable
  :data="[
    {
      keys: ['Tab'],
      description: 'When focus moves onto the date field, focuses the first segment.'
    },
    {
      keys: ['Space'],
      description:`
      <span>
          When the focus is on either <Code>DatePickerNext</Code> or <Code>DatePickerPrev</Code>, it navigates the calendar. Otherwise, it selects the date. If the focus is on <Code>DatePickerTrigger</Code>, it opens/closes the popover.
      </span>
    ` ,
    },
    {
      keys: ['Enter'],
      description:`
      <span>
          When the focus is on either <Code>DatePickerNext</Code> or <Code>DatePickerPrev</Code>, it navigates the calendar. Otherwise, it selects the date. If the focus is on <Code>DatePickerTrigger</Code>, it opens/closes the popover.
      </span>
    ` ,
    },
    {
      keys: ['ArrowLeft', 'ArrowRight'],
      description:
      `
         Navigates between the date field segments. If the focus is on the <Code>DatePickerCalendar</Code>, it navigates between the dates.
      `
    },
    {
      keys: ['ArrowUp', 'ArrowDown'],
      description: 'Increments/changes the value of the segment. If the focus is on the <Code>DatePickerCalendar</Code>, it navigates between the dates.'
    },
    {
      keys: ['0-9'],
      description: `
          When the focus is on a numeric <Code>DatePickerInput</Code>, it types in the number and focuses the next segment if the next input would result in an invalid value.
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

## Headless composable

`useDatePicker` owns the value, the placeholder, the open state and the calendar view, and returns `getFieldProps()` and `getCalendarProps()`: the options that make a [`useDateField`](date-field#headless-composable) and a [`useCalendar`](calendar) its field and its calendar. Positioning, the popover and focus management stay in the components. It registers watchers, so call it inside `setup()`. The composable is experimental; see [Headless composables](/docs/guides/composables).
