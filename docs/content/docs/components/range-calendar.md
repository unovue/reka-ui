---

title: RangeCalendar
description: Presents a calendar view tailored for selecting date ranges.
name: range-calendar
---

# Range Calendar

<Badge>Alpha</Badge>

<Description>
Presents a calendar view tailored for selecting date ranges.
</Description>

<ComponentPreview name="RangeCalendar" />

## Features

<Highlights
  :features="[
    'Full keyboard navigation',
    'Can be controlled or uncontrolled',
    'Focus is fully managed',
    'Localization support',
    'Highly composable'
  ]"
/>

## Preface

The component depends on the [@internationalized/date](https://react-spectrum.adobe.com/internationalized/date/index.html) package, which solves a lot of the problems that come with working with dates and times in JavaScript.

We highly recommend reading through the documentation for the package to get a solid feel for how it works, and you'll need to install it in your project to use the date-related components.

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
  RangeCalendarCell,
  RangeCalendarCellTrigger,
  RangeCalendarGrid,
  RangeCalendarGridBody,
  RangeCalendarGridHead,
  RangeCalendarGridRow,
  RangeCalendarHeadCell,
  RangeCalendarHeader,
  RangeCalendarHeading,
  RangeCalendarNext,
  RangeCalendarPrev,
  RangeCalendarRoot,
} from 'reka-ui'
</script>

<template>
  <RangeCalendarRoot>
    <RangeCalendarHeader>
      <RangeCalendarPrev />
      <RangeCalendarHeading />
      <RangeCalendarNext />
    </RangeCalendarHeader>
    <RangeCalendarGrid>
      <RangeCalendarGridHead>
        <RangeCalendarGridRow>
          <RangeCalendarHeadCell />
        </RangeCalendarGridRow>
      </RangeCalendarGridHead>
      <RangeCalendarGridBody>
        <RangeCalendarGridRow>
          <RangeCalendarCell>
            <RangeCalendarCellTrigger />
          </RangeCalendarCell>
        </RangeCalendarGridRow>
      </RangeCalendarGridBody>
    </RangeCalendarGrid>
  </RangeCalendarRoot>
</template>
```

## API Reference

### Root

Contains all the parts of a calendar

<!-- @include: @/meta/RangeCalendarRoot.md -->

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

### Header

Contains the navigation buttons and the heading segments.

<!-- @include: @/meta/RangeCalendarHeader.md -->

### Prev Button

Calendar navigation button. It navigates the calendar one month/year/decade in the past based on the current calendar view.

<DataAttributesTable
  :data="[
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    },
  ]"
/>

<!-- @include: @/meta/RangeCalendarPrev.md -->

### Next Button

Calendar navigation button. It navigates the calendar one month/year/decade in the future based on the current calendar view.

<!-- @include: @/meta/RangeCalendarNext.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    },
  ]"
/>

### Heading

Heading for displaying the current month and year.

<!-- @include: @/meta/RangeCalendarHeading.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    },
  ]"
/>

### Grid

Container for wrapping the calendar grid.

<!-- @include: @/meta/RangeCalendarGrid.md -->

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
  ]"
/>

### Grid Head

Container for wrapping the grid head.

<!-- @include: @/meta/RangeCalendarGridHead.md -->

### Grid Body

Container for wrapping the grid body.

<!-- @include: @/meta/RangeCalendarGridBody.md -->

### Grid Row

Container for wrapping the grid row.

<!-- @include: @/meta/RangeCalendarGridRow.md -->

### Head Cell

Container for wrapping the head cell. Used for displaying the week days.

<!-- @include: @/meta/RangeCalendarHeadCell.md -->

### Cell

Container for wrapping the calendar cells.

<!-- @include: @/meta/RangeCalendarCell.md -->

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

<!-- @include: @/meta/RangeCalendarCellTrigger.md -->

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
      attribute: '[data-selection-start]',
      values: 'Present when the date is the start of the selection.',
    },
    {
      attribute: '[data-selection-end]',
      values: 'Present when the date is the end of the selection.',
    },
    {
      attribute: '[data-highlighted]',
      values: 'Present when the date is highlighted by the user as they select a range.',
    },
    {
      attribute: '[data-highlighted-start]',
      values: 'Present when the date is the start of the range that is highlighted by the user.',
    },
    {
      attribute: '[data-highlighted-end]',
      values: 'Present when the date is the end of the range that is highlighted by the user.',
    },
    {
      attribute: '[data-focused]',
      values: 'Present when focused',
    }
  ]"
/>

## Accessibility

### Keyboard Interactions

<KeyboardTable
  :data="[
    {
      keys: ['Tab'],
      description: 'When focus moves onto the calendar, focuses the first navigation button.'
    },
    {
      keys: ['Space'],
      description:`
      <span>
          When the focus is on either <Code>CalendarNext</Code> or <Code>CalendarPrev</Code>, it navigates the calendar. Otherwise, it selects the date.
      </span>
    ` ,
    },
    {
      keys: ['Enter'],
      description:`
      <span>
          When the focus is on either <Code>CalendarNext</Code> or <Code>CalendarPrev</Code>, it navigates the calendar. Otherwise, it selects the date.
      </span>
    ` ,
    },
    {
      keys: ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'],
      description:
      `
        When the focus is on <Code>CalendarCellTrigger</Code>, it navigates the dates, changing the month/year/decade if necessary.
      `
    }
  ]"
/>
