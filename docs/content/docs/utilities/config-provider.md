---
title: Config Provider
description: Wraps your app to provide global configurations.
---

# Config Provider

<Description>
Wraps your app to provide global configurations.
</Description>

<Highlights
  :features="[
    'Enables all primitives to inherit global reading direction.',
    'Enables changing the behavior of scroll body when setting body lock.',
    'Much more controls to prevent layout shifts.',
  ]"
/>

## Anatomy

Import the component.

```vue
<script setup lang="ts">
import { ConfigProvider } from 'reka-ui'
</script>

<template>
  <ConfigProvider>
    <slot />
  </ConfigProvider>
</template>
```

## API Reference

### Config Provider

When creating localized apps that require right-to-left (RTL) reading direction, you need to wrap your application with the `ConfigProvider` component to ensure all of the primitives adjust their behavior based on the `dir` prop.

You can also change the global behavior of `bodylock` for components such as `Alert`, `DropdownMenu` and etc to fit your layout to prevent any [content shifts](https://github.com/unovue/reka-ui/issues/385).

<!-- @include: @/meta/ConfigProvider.md -->

## Example

Use the config provider.

Set global direction to `rtl`, and scroll body behavior to `false` (will not set any padding/margin).

By default, the scrollbar width is added to the body's own right padding while scroll is locked, and the body's margin is left alone. Both are put back as they were when the lock is released. Pass an object such as `{ padding: 20 }` or `{ margin: true }` to choose what is set: `true` adds the scrollbar width to the existing value, a number is in pixels, and a string is used as written. `{ margin: true }` on its own moves the compensation to the margin and leaves the padding alone; set `padding` as well to change both.

```vue
<script setup lang="ts">
import { ConfigProvider } from 'reka-ui'
</script>

<template>
  <ConfigProvider
    dir="rtl"
    :scroll-body="false"
  >
    <slot />
  </ConfigProvider>
</template>
```

## Hydration issue

`ConfigProvider` can accept a custom `useId` function for frameworks that need to provide their own SSR-stable ID source. Reka UI uses this function before Vue's native `useId`, so every primitive that generates accessibility IDs follows the same app-provided source.

This is useful in Nuxt projects where prerendered HTML and client hydration can use different Vue app ID prefixes. Pass Nuxt's [`useId`](https://nuxt.com/docs/api/composables/use-id) through `ConfigProvider` so Reka-generated IDs stay stable across server and client rendering.

> Inspired by [Headless UI](https://github.com/tailwindlabs/headlessui/pull/2959)

 ```vue
 <!-- in Nuxt's app.vue -->
<script setup lang="ts">
import { ConfigProvider } from 'reka-ui'

const useIdFunction = () => useId()
</script>

<template>
   <ConfigProvider :use-id="useIdFunction">
     …
   </ConfigProvider>
</template>
```
