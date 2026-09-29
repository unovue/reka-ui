---

title: MonthPicker
description: Presents a calendar view tailored for selecting months.
name: month-picker
---

# Month Picker

<Badge>Alpha</Badge>

<Description>
Presents a calendar view tailored for selecting months.
</Description>

<ComponentPreview name="MonthPicker" />

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
  MonthPickerCell,
  MonthPickerCellTrigger,
  MonthPickerGrid,
  MonthPickerGridBody,
  MonthPickerGridRow,
  MonthPickerHeader,
  MonthPickerHeading,
  MonthPickerNext,
  MonthPickerPrev,
  MonthPickerRoot,
} from 'reka-ui'
</script>

<template>
  <MonthPickerRoot>
    <MonthPickerHeader>
      <MonthPickerPrev />
      <MonthPickerHeading />
      <MonthPickerNext />
    </MonthPickerHeader>
    <MonthPickerGrid>
      <MonthPickerGridBody>
        <MonthPickerGridRow>
          <MonthPickerCell>
            <MonthPickerCellTrigger />
          </MonthPickerCell>
        </MonthPickerGridRow>
      </MonthPickerGridBody>
    </MonthPickerGrid>
  </MonthPickerRoot>
</template>
```

## API Reference

### Root

Contains all the parts of a month picker

<!-- @include: @/meta/MonthPickerRoot.md -->

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

<!-- @include: @/meta/MonthPickerHeader.md -->

### Prev Button

Calendar navigation button. It navigates the calendar one year in the past.

<!-- @include: @/meta/MonthPickerPrev.md -->

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

<!-- @include: @/meta/MonthPickerNext.md -->

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

<!-- @include: @/meta/MonthPickerHeading.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    },
  ]"
/>

### Grid

Container for wrapping the month picker grid.

<!-- @include: @/meta/MonthPickerGrid.md -->

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

<!-- @include: @/meta/MonthPickerGridBody.md -->

### Grid Row

Container for wrapping the grid row.

<!-- @include: @/meta/MonthPickerGridRow.md -->

### Cell

Container for wrapping the month picker cells.

<!-- @include: @/meta/MonthPickerCell.md -->

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

<!-- @include: @/meta/MonthPickerCellTrigger.md -->

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
      description: 'When focus moves onto the month picker, focuses the first navigation button.'
    },
    {
      keys: ['Space'],
      description:`
      <span>
          When the focus is on either <Code>MonthPickerNext</Code> or <Code>MonthPickerPrev</Code>, it navigates the calendar. Otherwise, it selects the month.
      </span>
    ` ,
    },
    {
      keys: ['Enter'],
      description:`
      <span>
          When the focus is on either <Code>MonthPickerNext</Code> or <Code>MonthPickerPrev</Code>, it navigates the calendar. Otherwise, it selects the month.
      </span>
    ` ,
    },
    {
      keys: ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'],
      description:
      `
        When the focus is on <Code>MonthPickerCellTrigger</Code>, it navigates the months, changing the year if necessary.
      `
    },
    {
      keys: ['PageUp'],
      description: 'When the focus is on <Code>MonthPickerCellTrigger</Code>, it navigates to the same month in the previous year.'
    },
    {
      keys: ['PageDown'],
      description: 'When the focus is on <Code>MonthPickerCellTrigger</Code>, it navigates to the same month in the next year.'
    }
  ]"
/>
