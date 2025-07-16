---
title: Date Picker
description: Facilitates the selection of dates through an input and calendar-based interface.
name: date-picker
---

# Date Picker

<Badge>Alpha</Badge>

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

The button that toggles the popover. By default, the `DatePickerContent` will position itself against the trigger.

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
