---

title: MonthRangePicker
description: Presents a calendar view tailored for selecting month ranges.
name: month-range-picker
---

# Month Range Picker

<Badge>Alpha</Badge>

<Description>
Presents a calendar view tailored for selecting month ranges.
</Description>

<ComponentPreview name="MonthRangePicker" />

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
  MonthRangePickerCell,
  MonthRangePickerCellTrigger,
  MonthRangePickerGrid,
  MonthRangePickerGridBody,
  MonthRangePickerGridRow,
  MonthRangePickerHeader,
  MonthRangePickerHeading,
  MonthRangePickerNext,
  MonthRangePickerPrev,
  MonthRangePickerRoot,
} from 'reka-ui'
</script>

<template>
  <MonthRangePickerRoot>
    <MonthRangePickerHeader>
      <MonthRangePickerPrev />
      <MonthRangePickerHeading />
      <MonthRangePickerNext />
    </MonthRangePickerHeader>
    <MonthRangePickerGrid>
      <MonthRangePickerGridBody>
        <MonthRangePickerGridRow>
          <MonthRangePickerCell>
            <MonthRangePickerCellTrigger />
          </MonthRangePickerCell>
        </MonthRangePickerGridRow>
      </MonthRangePickerGridBody>
    </MonthRangePickerGrid>
  </MonthRangePickerRoot>
</template>
```

## API Reference

### Root

Contains all the parts of a month range picker

<!-- @include: @/meta/MonthRangePickerRoot.md -->

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

<!-- @include: @/meta/MonthRangePickerHeader.md -->

### Prev Button

Calendar navigation button. It navigates the calendar one year in the past.

<!-- @include: @/meta/MonthRangePickerPrev.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    },
  ]"
/>

### Next Button

Calendar navigation button. It navigates the calendar one year in the future.

<!-- @include: @/meta/MonthRangePickerNext.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    },
  ]"
/>

### Heading

Heading for displaying the current year.

<!-- @include: @/meta/MonthRangePickerHeading.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    },
  ]"
/>

### Grid

Container for wrapping the month range picker grid.

<!-- @include: @/meta/MonthRangePickerGrid.md -->

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

### Grid Body

Container for wrapping the grid body.

<!-- @include: @/meta/MonthRangePickerGridBody.md -->

### Grid Row

Container for wrapping the grid row.

<!-- @include: @/meta/MonthRangePickerGridRow.md -->

### Cell

Container for wrapping the month range picker cells.

<!-- @include: @/meta/MonthRangePickerCell.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    },
  ]"
/>

### Cell Trigger

Interactable container for displaying the cell months. Clicking it selects the month.

<!-- @include: @/meta/MonthRangePickerCellTrigger.md -->

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
      values: 'Present when the month is the current month',
    },
    {
      attribute: '[data-selection-start]',
      values: 'Present when the month is the start of the selection.',
    },
    {
      attribute: '[data-selection-end]',
      values: 'Present when the month is the end of the selection.',
    },
    {
      attribute: '[data-highlighted]',
      values: 'Present when the month is highlighted by the user as they select a range.',
    },
    {
      attribute: '[data-highlighted-start]',
      values: 'Present when the month is the start of the range that is highlighted by the user.',
    },
    {
      attribute: '[data-highlighted-end]',
      values: 'Present when the month is the end of the range that is highlighted by the user.',
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
      description: 'When focus moves onto the month range picker, focuses the first navigation button.'
    },
    {
      keys: ['Space'],
      description:`
      <span>
          When the focus is on either <Code>MonthRangePickerNext</Code> or <Code>MonthRangePickerPrev</Code>, it navigates the calendar. Otherwise, it selects the month.
      </span>
    ` ,
    },
    {
      keys: ['Enter'],
      description:`
      <span>
          When the focus is on either <Code>MonthRangePickerNext</Code> or <Code>MonthRangePickerPrev</Code>, it navigates the calendar. Otherwise, it selects the month.
      </span>
    ` ,
    },
    {
      keys: ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'],
      description:
      `
        When the focus is on <Code>MonthRangePickerCellTrigger</Code>, it navigates the months, changing the year if necessary.
      `
    },
    {
      keys: ['PageUp'],
      description: 'When the focus is on <Code>MonthRangePickerCellTrigger</Code>, it navigates to the same month in the previous year.'
    },
    {
      keys: ['PageDown'],
      description: 'When the focus is on <Code>MonthRangePickerCellTrigger</Code>, it navigates to the same month in the next year.'
    },
    {
      keys: ['Escape'],
      description: 'Cancels the current range selection and restores the previous valid range.'
    }
  ]"
/>
