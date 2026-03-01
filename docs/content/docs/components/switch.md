---

title: Switch
description: A control that allows the user to toggle between checked and not checked.
name: switch
aria: https://www.w3.org/WAI/ARIA/apg/patterns/switch
---

# Switch

<Description>
A control that allows the user to toggle between checked and not checked.
</Description>

<ComponentPreview name="Switch" />

## Features

<Highlights
  :features="[
    'Full keyboard navigation.',
    'Can be controlled or uncontrolled.',
    'Supports custom true/false values.',
  ]"
/>

## Installation

Install the component from your command line.

<InstallationTabs value="reka-ui" />

## Anatomy

Import all parts and piece them together.

```vue
<script setup>
import { SwitchRoot, SwitchThumb } from 'reka-ui'
</script>

<template>
  <SwitchRoot>
    <SwitchThumb />
  </SwitchRoot>
</template>
```

## API Reference

### Root

Contains all the parts of a switch. An `input` will also render when used within a `form` to ensure events propagate correctly.

<!-- @include: @/meta/SwitchRoot.md -->

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

### Thumb

The thumb that is used to visually indicate whether the switch is on or off.

<!-- @include: @/meta/SwitchThumb.md -->

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

### Custom Values

Use the `trueValue` and `falseValue` props to specify custom values for the on and off states instead of the default `true`/`false`.

```vue line=4-5,9-10
<script setup>
import { SwitchRoot, SwitchThumb } from 'reka-ui'
import { ref } from 'vue'

// With string values
const status = ref('inactive')

// With number values
const enabled = ref(0)
</script>

<template>
  <!-- String values -->
  <SwitchRoot v-model="status" true-value="active" false-value="inactive">
    <SwitchThumb />
  </SwitchRoot>
  <span>Status: {{ status }}</span> <!-- "active" or "inactive" -->

  <!-- Number values -->
  <SwitchRoot v-model="enabled" :true-value="1" :false-value="0">
    <SwitchThumb />
  </SwitchRoot>
  <span>Enabled: {{ enabled }}</span> <!-- 1 or 0 -->
</template>
```

## Accessibility

Adheres to the [`switch` role requirements](https://www.w3.org/WAI/ARIA/apg/patterns/switch).

### Keyboard Interactions

<KeyboardTable
  :data="[
    {
      keys: ['Space'],
      description: 'Toggles the component\'s state.',
    },
    {
      keys: ['Enter'],
      description: 'Toggles the component\'s state.',
    },
  ]"
/>
