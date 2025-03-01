---

title: Avatar
description: An image element with a fallback for representing the user.
name: avatar
---

# Avatar

<Description>
An image element with a fallback for representing the user.
</Description>

<ComponentPreview name="Avatar" />

## Features

<Highlights
  :features="[
    'Automatic and manual control over when the image renders.',
    'Fallback part accepts any children.',
    'Optionally delay fallback rendering to avoid content flashing.',
  ]"
/>

## Installation

Install the component from your command line.

<InstallationTabs value="reka-ui" />

## Anatomy

Import all parts and piece them together.

```vue
<script setup>
import { AvatarImage, AvatarRoot } from 'reka-ui'
</script>

<template>
  <AvatarRoot>
    <AvatarImage />
    <AvatarFallback />
  </AvatarRoot>
</template>
```

## API Reference

### Root

Contains all the parts of an avatar

<!-- @include: @/meta/AvatarRoot.md -->

### Image

The image to render. By default it will only render when it has loaded. You can use the `@loadingStatusChange` handler if you need more control.

<!-- @include: @/meta/AvatarImage.md -->

### Fallback

An element that renders when the image hasn't loaded. This means whilst it's loading, or if there was an error. If you notice a flash during loading, you can provide a `delayMs` prop to delay its rendering so it only renders for those with slower connections. For more control, use the `@loadingStatusChange` emit on `AvatarImage`.

<!-- @include: @/meta/AvatarFallback.md -->

## Examples

### Clickable Avatar with tooltip

You can compose the Avatar with a [Tooltip](/docs/components/tooltip) to display extra information.

```vue line=6-7,9,11-15
<script setup>
import { AvatarImage, AvatarRoot, TooltipArrow, TooltipRoot, TooltipTrigger } from 'reka-ui'
</script>

<template>
  <TooltipRoot>
    <TooltipTrigger>
      <AvatarRoot>…</AvatarRoot>
    </TooltipTrigger>

    <TooltipContent side="top">
      Tooltip content
      <TooltipArrow />
    </TooltipContent>
  </TooltipRoot>
</template>
```
