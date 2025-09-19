---
title: Time Field
description: Enables users to input specific times within a designated field.
name: time-field
---

# Time Field

<Badge>Alpha</Badge>

<Description>
Enables users to input specific times within a designated field.
</Description>

<ComponentPreview name="TimeField" />

## Features

<Highlights
  :features="[
    'Full keyboard navigation',
    'Can be controlled or uncontrolled',
    'Focus is fully managed',
    'Localization support',
    'Highly composable',
    'Accessible by default',
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
  TimeFieldInput,
  TimeFieldRoot,
} from 'reka-ui'
</script>

<template>
  <TimeFieldRoot>
    <TimeFieldInput />
  </TimeFieldRoot>
</template>
```

## API Reference

### Root

Contains all the parts of a time field

<!-- @include: @/meta/TimeFieldRoot.md -->

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

Contains the time field segments

<!-- @include: @/meta/TimeFieldInput.md -->

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
      description: 'When focus moves onto the time field, focuses the first segment.'
    },
    {
      keys: ['ArrowLeft', 'ArrowRight'],
      description:
      `
         Navigates between the time field segments.
      `
    },
    {
      keys: ['ArrowUp', 'ArrowDown'],
      description: 'Increments/changes the value of the segment.'
    },
    {
      keys: ['0-9'],
      description: `
          When the focus is on a numeric <Code>TimeFieldInput</Code>, it types in the number and focuses the next segment if the next input would result in an invalid value.
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
