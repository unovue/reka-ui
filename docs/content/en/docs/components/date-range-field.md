---
title: Date Range Field
description: Allows users to input a range of dates within a designated field.
name: date-range-field
---

# Date Range Field

<Badge>Alpha</Badge>

<Description>
Allows users to input a range of dates within a designated field.
</Description>

<ComponentPreview name="DateRangeField" />

## Features

<Highlights
  :features="[
    'Full keyboard navigation',
    'Can be controlled or uncontrolled',
    'Focus is fully managed',
    'Localization support',
    'Highly composable',
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
  DateRangeFieldInput,
  DateRangeFieldRoot,
} from 'reka-ui'
</script>

<template>
  <DateRangeFieldRoot>
    <DateRangeFieldInput />
  </DateRangeFieldRoot>
</template>
```

## API Reference

### Root

Contains all the parts of a date field

<!-- @include: @/meta/DateRangeFieldRoot.md -->

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

Contains the date field segments

<!-- @include: @/meta/DateRangeFieldInput.md -->

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
      description: 'When focus moves onto the date field, focuses the first segment.'
    },
    {
      keys: ['ArrowLeft', 'ArrowRight'],
      description:
      `
       Navigates between the date field segments.
      `
    },
    {
      keys: ['ArrowUp', 'ArrowDown'],
      description: 'Increments/changes the value of the segment.'
    },
    {
      keys: ['0-9'],
      description: `
          When the focus is on a numeric <Code>DateFieldInput</Code>, it types in the number and focuses the next segment if the next input would result in an invalid value.
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
