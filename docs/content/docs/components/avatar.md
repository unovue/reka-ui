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

## Headless composable

`useAvatar` holds the shared image loading status. `useAvatarImage` loads the image off-DOM, reports each status through `onLoadingStatusChange` and returns the image surface, and `useAvatarFallback` decides when the fallback shows.

```vue
<script setup lang="ts">
import { useAvatar, useAvatarFallback, useAvatarImage } from 'reka-ui'

const avatar = useAvatar()
const image = useAvatarImage(avatar.context, { src: '/avatar.png' })
const fallback = useAvatarFallback(avatar.context, { delayMs: 600 })
</script>

<template>
  <span>
    <img
      v-show="image.visible.value"
      v-bind="image.root.attrs.value"
      alt="Colm Tuite"
    >
    <span v-if="fallback.visible.value">CT</span>
  </span>
</template>
```

`useAvatar` is callable outside component setup; `useAvatarImage` and `useAvatarFallback` register mount hooks and a timer, so call them inside `setup()`. The composables are experimental.
