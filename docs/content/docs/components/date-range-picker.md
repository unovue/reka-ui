---
title: Date Range Picker
description: Facilitates the selection of date ranges through an input and calendar-based interface.
name: date-range-picker
---

# Date Range Picker

<Badge>Alpha</Badge>

<Description>
Facilitates the selection of date ranges through an input and calendar-based interface.
</Description>

<ComponentPreview name="DateRangePicker" />

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
  DateRangePickerAnchor,
  DateRangePickerArrow,
  DateRangePickerCalendar,
  DateRangePickerCell,
  DateRangePickerCellTrigger,
  DateRangePickerClose,
  DateRangePickerContent,
  DateRangePickerField,
  DateRangePickerGrid,
  DateRangePickerGridBody,
  DateRangePickerGridHead,
  DateRangePickerGridRow,
  DateRangePickerHeadCell,
  DateRangePickerHeader,
  DateRangePickerHeading,
  DateRangePickerInput,
  DateRangePickerNext,
  DateRangePickerPrev,
  DateRangePickerRoot,
  DateRangePickerTrigger,
} from 'reka-ui'
</script>

<template>
  <DateRangePickerRoot>
    <DateRangePickerField>
      <DateRangePickerInput />
      <DateRangePickerTrigger />
    </DateRangePickerField>

    <DateRangePickerAnchor />

    <DateRangePickerContent>
      <DateRangePickerClose />
      <DateRangePickerArrow />

      <DateRangePickerCalendar>
        <DateRangePickerHeader>
          <DateRangePickerPrev />
          <DateRangePickerHeading />
          <DateRangePickerNext />
        </DateRangePickerHeader>

        <DateRangePickerGrid>
          <DateRangePickerGridHead>
            <DateRangePickerGridRow>
              <DateRangePickerHeadCell />
            </DateRangePickerGridRow>
          </DateRangePickerGridHead>

          <DateRangePickerGridBody>
            <DateRangePickerGridRow>
              <DateRangePickerCell>
                <DateRangePickerCellTrigger />
              </DateRangePickerCell>
            </DateRangePickerGridRow>
          </DateRangePickerGridBody>
        </DateRangePickerGrid>
      </DateRangePickerCalendar>
    </DateRangePickerContent>
  </DateRangePickerRoot>
</template>
```

## API Reference

### Root

Contains all the parts of a date picker

<!-- @include: @/meta/DateRangePickerRoot.md -->

### Field

Contains the date picker date field segments and trigger

<!-- @include: @/meta/DateRangePickerField.md -->

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

<!-- @include: @/meta/DateRangePickerInput.md -->

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

The button that toggles the popover. By default, the `DateRangePickerContent` will position itself against the trigger.

<!-- @include: @/meta/DateRangePickerTrigger.md -->

### Content

The component that pops out when the popover is open.

<!-- @include: @/meta/DateRangePickerContent.md -->

### Arrow

An optional arrow element to render alongside the popover. This can be used to help visually link the anchor with the `DateRangePickerContent`. Must be rendered inside `DateRangePickerContent`.

<!-- @include: @/meta/DateRangePickerArrow.md -->

### Close

The button that closes an open date picker.

<!-- @include: @/meta/DateRangePickerClose.md -->

### Anchor

An optional element to position the `DateRangePickerContent` against. If this part is not used, the content will position alongside the `DateRangePickerTrigger`.

<!-- @include: @/meta/DateRangePickerAnchor.md -->

### Calendar

Contains all the parts of a calendar

<!-- @include: @/meta/DateRangePickerCalendar.md -->

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

<!-- @include: @/meta/DateRangePickerHeader.md -->

### Prev Button

Calendar navigation button. It navigates the calendar one month/year/decade in the past based on the current calendar view.

<!-- @include: @/meta/DateRangePickerPrev.md -->

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

<!-- @include: @/meta/DateRangePickerNext.md -->

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

<!-- @include: @/meta/DateRangePickerHeading.md -->

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

<!-- @include: @/meta/DateRangePickerGrid.md -->

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

<!-- @include: @/meta/DateRangePickerGridHead.md -->

### Grid Body

Container for wrapping the grid body.

<!-- @include: @/meta/DateRangePickerGridBody.md -->

### Grid Row

Container for wrapping the grid row.

<!-- @include: @/meta/DateRangePickerGridRow.md -->

### Head Cell

Container for wrapping the head cell. Used for displaying the week days.

<!-- @include: @/meta/DateRangePickerHeadCell.md -->

### Cell

Container for wrapping the calendar cells.

<!-- @include: @/meta/DateRangePickerCell.md -->

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

<!-- @include: @/meta/DateRangePickerCellTrigger.md -->

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
      description: 'When focus moves onto the date field, focuses the first segment.'
    },
    {
      keys: ['Space'],
      description:`
      <span>
          When the focus is on either <Code>DateRangePickerNext</Code> or <Code>DateRangePickerPrev</Code>, it navigates the calendar. Otherwise, it selects the date. If the focus is on <Code>DateRangePickerTrigger</Code>, it opens/closes the popover.
      </span>
    ` ,
    },
    {
      keys: ['Enter'],
      description:`
      <span>
          When the focus is on either <Code>DateRangePickerNext</Code> or <Code>DateRangePickerPrev</Code>, it navigates the calendar. Otherwise, it selects the date. If the focus is on <Code>DateRangePickerTrigger</Code>, it opens/closes the popover.
      </span>
    ` ,
    },
    {
      keys: ['ArrowLeft', 'ArrowRight'],
      description:
      `
         Navigates between the date field segments. If the focus is on the <Code>DateRangePickerCalendar</Code>, it navigates between the dates.
      `
    },
    {
      keys: ['ArrowUp', 'ArrowDown'],
      description: 'Increments/changes the value of the segment. If the focus is on the <Code>DateRangePickerCalendar</Code>, it navigates between the dates.'
    },
    {
      keys: ['0-9'],
      description: `
          When the focus is on a numeric <Code>DateRangePickerInput</Code>, it types in the number and focuses the next segment if the next input would result in an invalid value.
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
