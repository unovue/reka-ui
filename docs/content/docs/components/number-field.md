---

title: Number Field
description: A number field allows a user to enter a number and increment or decrement the value using stepper buttons.
name: number field
aria: https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton
---

# Number Field

<Description>
A number field allows a user to enter a number and increment or decrement the value using stepper buttons.
</Description>

<ComponentPreview name="NumberField" />

## Features

<Highlights
  :features="[
    'Full keyboard navigation.',
    'Can be controlled or uncontrolled.',
    'Support button hold and wheel event.',
    'Support numbering systems in different locale.',
    'Customizable formatting.'
  ]"
/>

## Installation

Install the number package.

<InstallationTabs value="@internationalized/number" />

Install the component from your command line.

<InstallationTabs value="reka-ui" />

## Anatomy

Import all parts and piece them together.

```vue
<script setup>
import { NumberFieldDecrement, NumberFieldIncrement, NumberFieldInput, NumberFieldRoot } from 'reka-ui'
</script>

<template>
  <NumberFieldRoot>
    <NumberFieldDecrement />
    <NumberFieldInput />
    <NumberFieldIncrement />
  </NumberFieldRoot>
</template>
```

## API Reference

### Root

Contains all the parts of a number field. An `input` will also render when used within a `form` to ensure events propagate correctly.

<!-- @include: @/meta/NumberFieldRoot.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    },
  ]"
/>

### Input

Input

The input component that renders the text value based on value and format options.

<!-- @include: @/meta/NumberFieldInput.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    },
  ]"
/>

### Increment

The button that increases the value.

<!-- @include: @/meta/NumberFieldIncrement.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-pressed]',
      values: 'Present when pressed',
    },
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    },
  ]"
/>

### Decrement

The button that decreases the value.

<!-- @include: @/meta/NumberFieldDecrement.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-pressed]',
      values: 'Present when pressed',
    },
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    },
  ]"
/>

## Example

### Decimal

All options supported by `Intl.NumberFormat` are supported, including configuration of minimum and maximum fraction digits, sign display, grouping separators, etc.

```vue line=3-7
<template>
  <NumberFieldRoot
    :default-value="5"
    :format-options="{
      signDisplay: 'exceptZero',
      minimumFractionDigits: 1,
    }"
  >
    …
  </NumberFieldRoot>
</template>
```

### Percentage

You can set `formatOptions.style` to `percent` to treat the value as a percentage. You need to set the step to 0.01 manually to allow an appropriate step size in this mode.

```vue line=3-7
<template>
  <NumberFieldRoot
    :default-value="0.05"
    :step="0.01"
    :format-options="{
      style: 'percent',
    }"
  >
    …
  </NumberFieldRoot>
</template>
```

### Currency

You can set `formatOptions.style` to `currency` to treat the value as a currency value. The currency option must also be passed to set the currency code (e.g., USD).

If you need to allow the user to change the currency, you should include a separate dropdown next to the number field. The number field itself will not determine the currency from the user input.

```vue line=4-9
<template>
  <NumberFieldRoot
    :default-value="5"
    :format-options="{
      style: 'currency',
      currency: 'EUR',
      currencyDisplay: 'code',
      currencySign: 'accounting',
    }"
  >
    …
  </NumberFieldRoot>
</template>
```

## Accessibility

Adheres to the [Spinbutton WAI-ARIA design pattern](https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton).

### Keyboard Interactions

<KeyboardTable
  :data="[
    {
      keys: ['Arrow Up'],
      description: 'Increase the value',
    },
    {
      keys: ['Arrow Down'],
      description: 'Decrease the value',
    },
    {
      keys: ['Page Up'],
      description: 'Increase the value by scale of 10',
    },
    {
      keys: ['Page Down'],
      description: 'Decrease the value by scale of 10',
    },
    {
      keys: ['Home'],
      description: 'Set value to minimum (if <code>min</code> is provided)',
    },
    {
      keys: ['End'],
      description: 'Set value to maximum (if <code>max</code> is provided)',
    },
  ]"
/>
