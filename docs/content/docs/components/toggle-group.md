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
      values: ['checked', 'unchecked'],
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
import { ToggleGroupItem, ToggleGroupRoot } from 'reka-ui'
import { ref } from 'vue'

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

## Real-world examples

- [Toolbar Rich Text](/examples/toolbar-rich-text): A formatting toolbar combining ToggleGroup, DropdownMenu and Tooltip under one roving focus ring.

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

In a right-to-left layout (`dir="rtl"` on `ToggleGroupRoot`, or on a [`ConfigProvider`](/docs/utilities/config-provider)), `ArrowLeft` moves to the next item and `ArrowRight` to the previous one. See [Internationalization](/docs/guides/i18n#what-changes-in-rtl).

## Headless composable

`useToggleGroup` holds the pressed value or values (`type` `single` or `multiple`, `modelValue`, `changeModelValue(value)`), the `root` [part surface](/docs/guides/composables#part-surfaces) and `getItemSurface(value)` for each item. Arrow-key navigation between the items is not part of it: wrap them in a [`RovingFocusGroup`](/docs/utilities/roving-focus), or use the components. It is pure, so it can be called outside `setup()`. The composable is experimental; see [Headless composables](/docs/guides/composables).
