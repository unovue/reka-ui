---

title: Toolbar
description: A container for grouping a set of controls, such as buttons, toggle groups or dropdown menus.
name: toolbar
aria: https://www.w3.org/WAI/ARIA/apg/patterns/toolbar
---

# Toolbar

<Description>
A container for grouping a set of controls, such as buttons, Toolbar groups or
dropdown menus.
</Description>

<ComponentPreview name="Toolbar" />

## Features

<Highlights :features="['Full keyboard navigation.']" />

## Installation

Install the component from your command line.

<InstallationTabs value="reka-ui" />

## Anatomy

Import the component.

```vue
<script setup lang="ts">
import {
  ToolbarButton,
  ToolbarLink,
  ToolbarRoot,
  ToolbarSeparator,
  ToolbarToggleGroup,
  ToolbarToggleItem,
} from 'reka-ui'
</script>

<template>
  <ToolbarRoot>
    <ToolbarButton />
    <ToolbarSeparator />
    <ToolbarLink />
    <ToolbarToggleGroup>
      <ToolbarToggleItem />
    </ToolbarToggleGroup>
  </ToolbarRoot>
</template>
```

## API Reference

### Root

Contains all the toolbar component parts.

<!-- @include: @/meta/ToolbarRoot.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-orientation]',
      values: ['vertical', 'horizontal'],
    },
  ]"
/>

### Button

A button item.

<!-- @include: @/meta/ToolbarButton.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-orientation]',
      values: ['vertical', 'horizontal'],
    },
  ]"
/>

### Link

A link item.

<!-- @include: @/meta/ToolbarLink.md -->

### ToggleGroup

A set of two-state buttons that can be toggled on or off.

<!-- @include: @/meta/ToolbarToggleGroup.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-orientation]',
      values: ['vertical', 'horizontal'],
    },
  ]"
/>

### ToggleItem

An item in the group.

<!-- @include: @/meta/ToolbarToggleItem.md -->

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

### Separator

Used to visually separate items in the toolbar

<!-- @include: @/meta/ToolbarSeparator.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-orientation]',
      values: ['vertical', 'horizontal'],
    },
  ]"
/>

## Examples

### Use with other primitives

All our primitives which expose a `Trigger` part, such as `Dialog`, `AlertDialog`, `Popover`, `DropdownMenu` can be composed within a toolbar by using the [`asChild` prop](/docs/guides/composition).

Here is an example using our `DropdownMenu` primitive.

```vue line=20-22
<script setup lang="ts">
import {
  DropdownMenuContent,
  DropdownMenuRoot,
  DropdownMenuTrigger,
  ToolbarButton,
  ToolbarLink,
  ToolbarRoot,
  ToolbarSeparator,
  ToolbarToggleGroup,
  ToolbarToggleItem,
} from 'reka-ui'
</script>

<template>
  <ToolbarRoot>
    <ToolbarButton>Action 1</ToolbarButton>
    <ToolbarSeparator />
    <DropdownMenuRoot>
      <ToolbarButton as-child>
        <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
      </ToolbarButton>
      <DropdownMenuContent>…</DropdownMenuContent>
    </DropdownMenuRoot>
  </ToolbarRoot>
</template>
```

## Accessibility

Uses [roving tabindex](https://www.w3.org/TR/wai-aria-practices-1.2/examples/radio/radio.html) to manage focus movement among items.

### Keyboard Interactions

<KeyboardTable
  :data="[
    {
      keys: ['Tab'],
      description: 'Moves focus to the first item in the group.',
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
      description: '<span> Moves focus to the next item depending on <Code>orientation</Code>.</span>',
    },
    {
      keys: ['ArrowRight'],
      description: '<span> Moves focus to the next item depending on <Code>orientation</Code>.</span>',
    },
    {
      keys: ['ArrowUp'],
      description: '<span> Moves focus to the previous item depending on <Code>orientation</Code> .</span>',
    },
    {
      keys: ['ArrowLeft'],
      description: '<span> Moves focus to the previous item depending on <Code>orientation</Code> .</span>',
    },
    {
      keys: ['Home'],
      description: '<span>Moves focus to the first item.</span>',
    },
    {
      keys: ['End'],
      description: '<span>Moves focus to the last item.</span>',
    },
  ]"
/>
