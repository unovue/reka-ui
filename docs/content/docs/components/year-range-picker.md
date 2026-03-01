---

title: YearRangePicker
description: Presents a calendar view tailored for selecting year ranges.
name: year-range-picker
---

# Year Range Picker

<Badge>Alpha</Badge>

<Description>
Presents a calendar view tailored for selecting year ranges.
</Description>

<ComponentPreview name="YearRangePicker" />

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
  YearRangePickerCell,
  YearRangePickerCellTrigger,
  YearRangePickerGrid,
  YearRangePickerGridBody,
  YearRangePickerGridRow,
  YearRangePickerHeader,
  YearRangePickerHeading,
  YearRangePickerNext,
  YearRangePickerPrev,
  YearRangePickerRoot,
} from 'reka-ui'
</script>

<template>
  <YearRangePickerRoot>
    <YearRangePickerHeader>
      <YearRangePickerPrev />
      <YearRangePickerHeading />
      <YearRangePickerNext />
    </YearRangePickerHeader>
    <YearRangePickerGrid>
      <YearRangePickerGridBody>
        <YearRangePickerGridRow>
          <YearRangePickerCell>
            <YearRangePickerCellTrigger />
          </YearRangePickerCell>
        </YearRangePickerGridRow>
      </YearRangePickerGridBody>
    </YearRangePickerGrid>
  </YearRangePickerRoot>
</template>
```

## API Reference

### Root

Contains all the parts of a year range picker

<!-- @include: @/meta/YearRangePickerRoot.md -->

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

<!-- @include: @/meta/YearRangePickerHeader.md -->

### Prev Button

Calendar navigation button. It navigates the calendar one page (12 years by default) in the past.

<!-- @include: @/meta/YearRangePickerPrev.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    },
  ]"
/>

### Next Button

Calendar navigation button. It navigates the calendar one page (12 years by default) in the future.

<!-- @include: @/meta/YearRangePickerNext.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    },
  ]"
/>

### Heading

Heading for displaying the current year range.

<!-- @include: @/meta/YearRangePickerHeading.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    },
  ]"
/>

### Grid

Container for wrapping the year range picker grid.

<!-- @include: @/meta/YearRangePickerGrid.md -->

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

<!-- @include: @/meta/YearRangePickerGridBody.md -->

### Grid Row

Container for wrapping the grid row.

<!-- @include: @/meta/YearRangePickerGridRow.md -->

### Cell

Container for wrapping the year range picker cells.

<!-- @include: @/meta/YearRangePickerCell.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    },
  ]"
/>

### Cell Trigger

Interactable container for displaying the cell years. Clicking it selects the year.

<!-- @include: @/meta/YearRangePickerCellTrigger.md -->

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
      values: 'Present when the year is the current year',
    },
    {
      attribute: '[data-selection-start]',
      values: 'Present when the year is the start of the selection.',
    },
    {
      attribute: '[data-selection-end]',
      values: 'Present when the year is the end of the selection.',
    },
    {
      attribute: '[data-highlighted]',
      values: 'Present when the year is highlighted by the user as they select a range.',
    },
    {
      attribute: '[data-highlighted-start]',
      values: 'Present when the year is the start of the range that is highlighted by the user.',
    },
    {
      attribute: '[data-highlighted-end]',
      values: 'Present when the year is the end of the range that is highlighted by the user.',
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
      description: 'When focus moves onto the year range picker, focuses the first navigation button.'
    },
    {
      keys: ['Space'],
      description:`
      <span>
          When the focus is on either <Code>YearRangePickerNext</Code> or <Code>YearRangePickerPrev</Code>, it navigates the calendar. Otherwise, it selects the year.
      </span>
    ` ,
    },
    {
      keys: ['Enter'],
      description:`
      <span>
          When the focus is on either <Code>YearRangePickerNext</Code> or <Code>YearRangePickerPrev</Code>, it navigates the calendar. Otherwise, it selects the year.
      </span>
    ` ,
    },
    {
      keys: ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'],
      description:
      `
        When the focus is on <Code>YearRangePickerCellTrigger</Code>, it navigates the years, changing the page if necessary.
      `
    },
    {
      keys: ['PageUp'],
      description: 'When the focus is on <Code>YearRangePickerCellTrigger</Code>, it navigates to the previous page of years.'
    },
    {
      keys: ['PageDown'],
      description: 'When the focus is on <Code>YearRangePickerCellTrigger</Code>, it navigates to the next page of years.'
    },
    {
      keys: ['Escape'],
      description: 'Cancels the current range selection and restores the previous valid range.'
    }
  ]"
/>
