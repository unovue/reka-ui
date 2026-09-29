---

title: YearPicker
description: Presents a calendar view tailored for selecting years.
name: year-picker
---

# Year Picker

<Badge>Alpha</Badge>

<Description>
Presents a calendar view tailored for selecting years.
</Description>

<ComponentPreview name="YearPicker" />

## Features

<Highlights
  :features="[
    'Full keyboard navigation',
    'Can be controlled or uncontrolled',
    'Focus is fully managed',
    'Localization support',
    'Highly composable',
    'Configurable years per page'
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
  YearPickerCell,
  YearPickerCellTrigger,
  YearPickerGrid,
  YearPickerGridBody,
  YearPickerGridRow,
  YearPickerHeader,
  YearPickerHeading,
  YearPickerNext,
  YearPickerPrev,
  YearPickerRoot,
} from 'reka-ui'
</script>

<template>
  <YearPickerRoot>
    <YearPickerHeader>
      <YearPickerPrev />
      <YearPickerHeading />
      <YearPickerNext />
    </YearPickerHeader>
    <YearPickerGrid>
      <YearPickerGridBody>
        <YearPickerGridRow>
          <YearPickerCell>
            <YearPickerCellTrigger />
          </YearPickerCell>
        </YearPickerGridRow>
      </YearPickerGridBody>
    </YearPickerGrid>
  </YearPickerRoot>
</template>
```

## API Reference

### Root

Contains all the parts of a year picker

<!-- @include: @/meta/YearPickerRoot.md -->

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

<!-- @include: @/meta/YearPickerHeader.md -->

### Prev Button

Calendar navigation button. It navigates the calendar one page (default: 12 years) in the past.

<!-- @include: @/meta/YearPickerPrev.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    },
  ]"
/>

### Next Button

Calendar navigation button. It navigates the calendar one page (default: 12 years) in the future.

<!-- @include: @/meta/YearPickerNext.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    },
  ]"
/>

### Heading

Heading for displaying the current year range (e.g., "2020 - 2031").

<!-- @include: @/meta/YearPickerHeading.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    },
  ]"
/>

### Grid

Container for wrapping the year picker grid.

<!-- @include: @/meta/YearPickerGrid.md -->

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

<!-- @include: @/meta/YearPickerGridBody.md -->

### Grid Row

Container for wrapping the grid row.

<!-- @include: @/meta/YearPickerGridRow.md -->

### Cell

Container for wrapping the year picker cells.

<!-- @include: @/meta/YearPickerCell.md -->

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

<!-- @include: @/meta/YearPickerCellTrigger.md -->

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
      description: 'When focus moves onto the year picker, focuses the first navigation button.'
    },
    {
      keys: ['Space'],
      description:`
      <span>
          When the focus is on either <Code>YearPickerNext</Code> or <Code>YearPickerPrev</Code>, it navigates the calendar. Otherwise, it selects the year.
      </span>
    ` ,
    },
    {
      keys: ['Enter'],
      description:`
      <span>
          When the focus is on either <Code>YearPickerNext</Code> or <Code>YearPickerPrev</Code>, it navigates the calendar. Otherwise, it selects the year.
      </span>
    ` ,
    },
    {
      keys: ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'],
      description:
      `
        When the focus is on <Code>YearPickerCellTrigger</Code>, it navigates the years, changing the page if necessary.
      `
    },
    {
      keys: ['PageUp'],
      description: 'When the focus is on <Code>YearPickerCellTrigger</Code>, it navigates to the previous page of years.'
    },
    {
      keys: ['PageDown'],
      description: 'When the focus is on <Code>YearPickerCellTrigger</Code>, it navigates to the next page of years.'
    }
  ]"
/>
