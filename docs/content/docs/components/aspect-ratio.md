---

title: Aspect Ratio
description: Displays content within a desired ratio.
name: aspect-ratio
---

# Aspect Ratio

<Description>
Displays content within a desired ratio.
</Description>

<ComponentPreview type="demo" name="AspectRatio" />

## Features

<Highlights
  :features="[
    'Accepts any custom ratio.'
  ]"
/>

## Installation

Install the component from your command line.

<InstallationTabs value="reka-ui" />

## Anatomy

Import the component.

```vue
<script setup>
import { AspectRatio } from 'reka-ui'
</script>

<template>
  <AspectRatio />
</template>
```

## API Reference

### Root

Contains the content you want to constrain to a given ratio.

<!-- @include: @/meta/AspectRatio.md -->

## Headless composable

`useAspectRatio` returns the `aspect` percentage, the `wrapper` surface that reserves the space and the `root` surface that fills it.

```vue
<script setup lang="ts">
import { useAspectRatio } from 'reka-ui'

const ratio = useAspectRatio({ ratio: 16 / 9 })
</script>

<template>
  <div v-bind="ratio.wrapper.attrs.value">
    <img
      v-bind="ratio.root.attrs.value"
      src="/landscape.jpg"
      alt="Landscape"
    >
  </div>
</template>
```

The composable is experimental and callable outside component setup.
