---
title: Tag Group
description: A tag group organizes a list of removable tags.
name: tag-group
---

# Tag Group

<Badge>Alpha</Badge>

<Description>
A tag group organizes a list of removable tags. It is useful for selected filters, labels, or values from a multi-select control.
</Description>

<ComponentPreview name="TagGroup" />

## Features

<Highlights
  :features="[
    'Can be controlled or uncontrolled.',
    'Supports removing tags with pointer or keyboard interactions.',
    'Supports disabled group and disabled item states.',
    'Form integration with hidden inputs.',
  ]"
/>

## Installation

Install the component from your command line.

<InstallationTabs value="reka-ui" />

## Anatomy

Import all parts and piece them together.

```vue
<script setup>
import { TagGroupItem, TagGroupItemDelete, TagGroupItemText, TagGroupRoot } from 'reka-ui'
</script>

<template>
  <TagGroupRoot>
    <TagGroupItem>
      <TagGroupItemText />
      <TagGroupItemDelete />
    </TagGroupItem>
  </TagGroupRoot>
</template>
```

## API Reference

### Root

Contains all the tag group component parts.

<!-- @include: @/meta/TagGroupRoot.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    },
  ]"
/>

### Item

The component that contains the tag.

<!-- @include: @/meta/TagGroupItem.md -->

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

### ItemText

The textual part of the tag. Important for accessibility.

<!-- @include: @/meta/TagGroupItemText.md -->

### ItemDelete

The button that deletes the associated tag.

<!-- @include: @/meta/TagGroupItemDelete.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    },
  ]"
/>

## Accessibility

### Keyboard Interactions

<KeyboardTable
  :data="[
    {
      keys: ['Delete'],
      description: '<span>When focus is on a tag item, removes it.</span>',
    },
    {
      keys: ['Backspace'],
      description: '<span>When focus is on a tag item, removes it.</span>',
    },
  ]"
/>
