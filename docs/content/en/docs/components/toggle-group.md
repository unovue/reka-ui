---

title: Toggle Group
description: A set of two-state buttons that can be toggled on or off.
name: toggle-group
aria: https://www.w3.org/WAI/ARIA/apg/patterns/button
---

# ToggleGroup

<Description>
A set of two-state buttons that can be toggled on or off.
</Description>

<ComponentPreview name="ToggleGroup" />

## Features

<Highlights
  :features="[
    'Full keyboard navigation.',
    'Supports horizontal/vertical orientation.',
    'Support single and multiple pressed buttons.',
    'Can be controlled or uncontrolled.',
  ]"
/>

## Installation

Install the component from your command line.

<InstallationTabs value="reka-ui" />

## Anatomy

Import the component.

```vue
<script setup>
import { ToggleGroupItem, ToggleGroupRoot } from 'reka-ui'
</script>

<template>
  <ToggleGroupRoot>
    <ToggleGroupItem />
  </ToggleGroupRoot>
</template>
```

## API Reference

### Root

Contains all the parts of a toggle group.

<!-- @include: @/meta/ToggleGroupRoot.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-orientation]',
      values: ['vertical', 'horizontal'],
    },
  ]"
/>

### Item

An item in the group.

<!-- @include: @/meta/ToggleGroupItem.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['on', 'off'],
    },
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    },
    {
      attribute: '[data-orientation]',
      values: ['vertical', 'horizontal'],
    },
  ]"
/>

## Examples

### Ensuring there is always a value

You can control the component to ensure a value.

```vue line=5,10-13
<script setup>
import { ref } from 'vue'
import { ToggleGroupItem, ToggleGroupRoot } from 'reka-ui'

const value = ref('left')
</script>

<template>
  <ToggleGroupRoot
    :model-value="value"
    @update:model-value="(val) => {
      if (val) value = val
    }"
  >
    <ToggleGroupItem value="left">
      <TextAlignLeftIcon />
    </ToggleGroupItem>
    <ToggleGroupItem value="center">
      <TextAlignCenterIcon />
    </ToggleGroupItem>
    <ToggleGroupItem value="right">
      <TextAlignRightIcon />
    </ToggleGroupItem>
  </ToggleGroupRoot>
</template>
```

## Accessibility

Uses [roving tabindex](https://www.w3.org/TR/wai-aria-practices-1.2/examples/radio/radio.html) to manage focus movement among items.

### Keyboard Interactions

<KeyboardTable
  :data="[
    {
      keys: ['Tab'],
      description:
        'Moves focus to either the pressed item or the first item in the group.',
    },
    {
      keys: ['Space'],
      description: 'Activates/deactivates the item.',
    },
    {
      keys: ['Enter'],
      description: 'Activates/deactivates the item.',
    },
    {
      keys: ['ArrowDown'],
      description: 'Moves focus to the next item in the group.',
    },
    {
      keys: ['ArrowRight'],
      description: 'Moves focus to the next item in the group.',
    },
    {
      keys: ['ArrowUp'],
      description: 'Moves focus to the previous item in the group.',
    },
    {
      keys: ['ArrowLeft'],
      description: 'Moves focus to the previous item in the group.',
    },
    {
      keys: ['Home'],
      description: 'Moves focus to the first item.',
    },
    {
      keys: ['End'],
      description: 'Moves focus to the last item.',
    },
  ]"
/>
