---

title: Separator
description: Visually or semantically separates content.
name: separator
aria: https://www.w3.org/TR/wai-aria-1.2/#separator
---

# Separator

<Description>
Visually or semantically separates content.
</Description>

<ComponentPreview name="Separator" />

## Features

<Highlights :features="['Supports horizontal and vertical orientations.']" />

## Installation

Install the component from your command line.

<InstallationTabs value="reka-ui" />

## Anatomy

Import all parts and piece them together.

```vue
<script setup>
import { Separator } from 'reka-ui'
</script>

<template>
  <Separator />
</template>
```

## API Reference

### Root

The separator.

<!-- @include: @/meta/Separator.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-orientation]',
      values: ['vertical', 'horizontal'],
    },
  ]"
/>

## Accessibility

Adheres to the [`separator` role requirements](https://www.w3.org/TR/wai-aria-1.2/#separator).
