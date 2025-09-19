---

title: Label
description: Renders an accessible label associated with controls.
name: label
---

# Label

<Description>
Renders an accessible label associated with controls.
</Description>

<ComponentPreview name="Label" />

## Features

<Highlights
  :features="[
    'Text selection is prevented when double clicking label.',
    'Supports nested controls.',
  ]"
/>

## Installation

Install the component from your command line.

<InstallationTabs value="reka-ui" />

## Anatomy

Import the component.

```vue
<script setup>
import { Label } from 'reka-ui'
</script>

<template>
  <Label />
</template>
```

## API Reference

### Root

Contains the content for the label.

<!-- @include: @/meta/Label.md -->

## Accessibility

This component is based on the native `label` element, it will automatically apply the correct labelling when wrapping controls or using the `for` attribute. For your own custom controls to work correctly, ensure they use native elements such as `button` or `input` as a base.
