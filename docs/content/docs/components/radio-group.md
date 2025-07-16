---

title: Radio Group
description: A set of checkable buttons—known as radio buttons—where no more than one of the buttons can be checked at a time.
name: radio-group
aria: https://www.w3.org/WAI/ARIA/apg/patterns/radiobutton
---

# RadioGroup

<Description>
A set of checkable buttons—known as radio buttons—where no more than one of the buttons can be checked at a time.
</Description>

<ComponentPreview name="RadioGroup" />

## Features

<Highlights
  :features="[
    'Full keyboard navigation.',
    'Supports horizontal/vertical orientation.',
    'Can be controlled or uncontrolled.',
  ]"
/>

## Installation

Install the component from your command line.

<InstallationTabs value="reka-ui" />

## Anatomy

Import all parts and piece them together.

```vue
<script setup>
import { RadioGroupIndicator, RadioGroupItem, RadioGroupRoot } from 'reka-ui'
</script>

<template>
  <RadioGroupRoot>
    <RadioGroupItem>
      <RadioGroupIndicator />
    </RadioGroupItem>
  </RadioGroupRoot>
</template>
```

## API Reference

### Root

Contains all the parts of a radio group.

<!-- @include: @/meta/RadioGroupRoot.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    },
  ]"
/>

### Item

An item in the group that can be checked. An `input` will also render when used within a `form` to ensure events propagate correctly.

<!-- @include: @/meta/RadioGroupItem.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['checked', 'unchecked'],
    },
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    },
  ]"
/>

### Indicator

Renders when the radio item is in a checked state. You can style this element directly, or you can use it as a wrapper to put an icon into, or both.

<PresenceCallout />

<!-- @include: @/meta/RadioGroupIndicator.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['checked', 'unchecked'],
    },
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    },
  ]"
/>

## Accessibility

Adheres to the [Radio Group WAI-ARIA design pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radiobutton) and uses [roving tabindex](https://www.w3.org/TR/wai-aria-practices-1.2/examples/radio/radio.html) to manage focus movement among radio items.

### Keyboard Interactions

<KeyboardTable
  :data="[
    {
      keys: ['Tab'],
      description: 'Moves focus to either the checked radio item or the first radio item in the group.',
    },
    {
      keys: ['Space'],
      description: 'When focus is on an unchecked radio item, checks it.',
    },
    {
      keys: ['ArrowDown'],
      description: 'Moves focus and checks the next radio item in the group.',
    },
    {
      keys: ['ArrowRight'],
      description: 'Moves focus and checks the next radio item in the group.',
    },
    {
      keys: ['ArrowUp'],
      description: 'Moves focus to the previous radio item in the group.',
    },
    {
      keys: ['ArrowLeft'],
      description: 'Moves focus to the previous radio item in the group.',
    },
  ]"
/>
