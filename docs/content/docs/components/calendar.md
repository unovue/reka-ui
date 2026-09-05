---

title: Calendar
description: Displays dates and days of the week, facilitating date-related interactions.
name: calendar
---

# Calendar

<Badge>Alpha</Badge>

<Description>
Displays dates and days of the week, facilitating date-related interactions.
</Description>

<ComponentPreview name="Calendar" />

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
  CalendarCell,
  CalendarCellTrigger,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHead,
  CalendarGridRow,
  CalendarHeadCell,
  CalendarHeader,
  CalendarHeading,
  CalendarNext,
  CalendarPrev,
  CalendarRoot,
  CalendarView,
  CalendarViewTrigger,
} from 'reka-ui'
</script>

<template>
  <CalendarRoot>
    <CalendarHeader>
      <CalendarPrev />
      <CalendarHeading />
      <CalendarViewTrigger />
      <CalendarNext />
    </CalendarHeader>
    <CalendarView>
      <CalendarGrid>
        <CalendarGridHead>
          <CalendarGridRow>
            <CalendarHeadCell />
          </CalendarGridRow>
        </CalendarGridHead>
        <CalendarGridBody>
          <CalendarGridRow>
            <CalendarCell>
              <CalendarCellTrigger />
            </CalendarCell>
          </CalendarGridRow>
        </CalendarGridBody>
      </CalendarGrid>
    </CalendarView>
  </CalendarRoot>
</template>
```

`CalendarView` and `CalendarViewTrigger` are optional. A calendar that only ever shows one unit (the default day grid, or a month or year picker via `granularity`) can put `CalendarGrid` straight under the root and use `CalendarHeading` for a static heading.

## API Reference

### Root

Contains all the parts of a calendar

<!-- @include: @/meta/CalendarRoot.md -->

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

<!-- @include: @/meta/CalendarHeader.md -->

### Prev Button

Calendar navigation button. It navigates the calendar one month/year/decade in the past based on the current calendar view.

<!-- @include: @/meta/CalendarPrev.md -->

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

<!-- @include: @/meta/CalendarNext.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    },
  ]"
/>

### Heading

Heading for displaying the current month and year

<!-- @include: @/meta/CalendarHeading.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    }
  ]"
/>

### Grid

Container for wrapping the calendar grid.

<!-- @include: @/meta/CalendarGrid.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-readonly]',
      values: 'Present when readonly',
    },
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    }
  ]"
/>

### Grid Head

Container for wrapping the grid head.

<!-- @include: @/meta/CalendarGridHead.md -->

### Grid Body

Container for wrapping the grid body.

<!-- @include: @/meta/CalendarGridBody.md -->

### Grid Row

Container for wrapping the grid row.

<!-- @include: @/meta/CalendarGridRow.md -->

### Head Cell

Container for wrapping the head cell. Used for displaying the week days.

<!-- @include: @/meta/CalendarHeadCell.md -->

### Cell

Container for wrapping the calendar cells.

<!-- @include: @/meta/CalendarCell.md -->

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

<!-- @include: @/meta/CalendarCellTrigger.md -->

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

Renders its content only while the root's `view` matches, and tells the cells inside which unit they render. Optional: a single-view calendar can place `CalendarGrid` directly under the root.

<!-- @include: @/meta/CalendarView.md -->

### View Trigger

The heading as a button. Each press switches to the next coarser view (day → month → year) up to `maxView`; selecting a cell in a coarser view drills back down.

<!-- @include: @/meta/CalendarViewTrigger.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-view]',
      values: ['day', 'month', 'year'],
    },
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled or at maxView',
    },
  ]"
/>

## Examples

### Month picker

Set `granularity="month"` to commit months instead of days. The grid then holds the twelve months of the placeholder's year, `columns` per row, and Prev / Next move a year at a time. The selected value keeps the placeholder's day.

<ComponentPreview name="CalendarMonth" />

### Year picker

Set `granularity="year"`. The grid holds `yearsPerPage` years starting at the placeholder's decade, and Prev / Next move a page at a time.

<ComponentPreview name="CalendarYear" />

### Day, month and year views

Wrap each grid in a `CalendarView` and put a `CalendarViewTrigger` in the header to let users drill from the day grid up to the month and year grids and back. See the [view switching example](/examples/date-picker-view-switching).

### Calendar with Year Incrementation

This example showcases a calendar which allows incrementing the year.

<ComponentPreview name="CalendarYearIncrement" />

### Calendar with Locale and Calendar System Selection

This example showcases some of the available locales and how the calendar systems are displayed.

<ComponentPreview name="CalendarSelect" />

### Calendar swipe gesture navigation

This component demonstrates intuitive calendar navigation using touch-based swipe gestures, user-friendly way to browse through months.

<ComponentPreview name="CalendarSwipe" />

### Calendar week numbers

This example showcases usage of the CalendarWeek component used to display the number of the week.

<ComponentPreview name="CalendarWeeks" />

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
        When the focus is on <Code>CalendarCellTrigger</Code>, it moves by one cell or one row (a week of days, or a row of months / years), changing the page if necessary.
      `
    },
    {
      keys: ['PageUp', 'PageDown'],
      description:
      `
        When the focus is on <Code>CalendarCellTrigger</Code>, it moves to the same cell on the previous / next page.
      `
    }
  ]"
/>
