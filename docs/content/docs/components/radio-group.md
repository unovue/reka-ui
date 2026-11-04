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

## Examples

### Card options

Render anything inside a `RadioGroupItem`: it is the radio, so its text becomes its accessible name and the whole card is clickable. Style the selected card with `[data-state=checked]` and a disabled one with `[data-disabled]`.

<ComponentPreview name="RadioGroupCards" />

### Orientation and direction

Without `orientation`, all four arrow keys move between the items. Set `orientation="horizontal"` to use only Left and Right (or `vertical` for Up and Down), so the other keys stay free, for example for scrolling. In a right-to-left layout, set `dir="rtl"` (or wrap the app in a [`ConfigProvider`](/docs/utilities/config-provider)) so Left and Right follow the reading direction. Set `:loop="false"` to stop at the first and last item.

```vue
<template>
  <RadioGroupRoot
    v-model="alignment"
    orientation="horizontal"
    dir="rtl"
    :loop="false"
  >
    <!-- ... -->
  </RadioGroupRoot>
</template>
```

### In a form

With a `name`, each item inside a `form` renders a hidden native radio, so the browser submits the selected `value`. Inside a [`FieldRoot`](field), the group takes the field's `name`, `required` and `disabled`, `FieldLabel` labels it, and an invalid submission focuses the selected item (or the first enabled one). Outside a field, label it with `aria-labelledby` (or `aria-label`). See [Forms and validation](/docs/guides/forms#reka-ui-controls-inside-a-field).

```vue
<template>
  <form @submit.prevent="onSubmit">
    <span id="shipping-label">Shipping</span>
    <RadioGroupRoot
      name="shipping"
      default-value="standard"
      aria-labelledby="shipping-label"
    >
      <RadioGroupItem value="standard" aria-label="Standard" />
      <RadioGroupItem value="express" aria-label="Express" />
    </RadioGroupRoot>
    <button type="submit">
      Continue
    </button>
  </form>
</template>
```

### Reacting to changes

`update:modelValue` receives a second argument with the `reason` (`'item-press'`, also for arrow-key selection, or `'imperative-action'`) and the native `event`. `beforeUpdate:modelValue` fires first; call `details.cancel()` to keep the current value.

```vue
<template>
  <RadioGroupRoot
    v-model="plan"
    @before-update:model-value="(value, details) => {
      if (value === 'free' && hasPaidFeatures)
        details.cancel()
    }"
  >
    <!-- ... -->
  </RadioGroupRoot>
</template>
```

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

## Headless composable

`useRadioGroup` holds the selected value (`modelValue`, `selectValue()`), the `root` [part surface](/docs/guides/composables#part-surfaces) and `getItemSurface(value, disabled?)`, which returns the surface of one radio: `role="radio"`, `aria-checked`, `data-state` and the press handler. Arrow-key navigation between the radios is not part of it: render the items in a [`RovingFocusGroup`](/docs/utilities/roving-focus), or use the components. The composable is experimental; see [Headless composables](/docs/guides/composables).
