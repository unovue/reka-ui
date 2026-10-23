---
title: useId
description: Generate random id
---

# useId

<Callout type="warning" title="Deprecated">

[Vue 3.5](https://blog.vuejs.org/posts/vue-3-5#useid) released an official client-server stable solution for `useId`.

</Callout>

<Description>
Generate random id
</Description>

## Source order

`useId` resolves IDs in this order:

1. Explicit ID passed to `useId(id)`.
2. The `useId` function provided by `ConfigProvider`.
3. Vue's native `useId` (Vue 3.5 or later is required).

Use `ConfigProvider` when your framework provides its own SSR-stable ID source, such as Nuxt's `useId`.

## Usage

```vue
<script setup lang="ts">
import { useId } from 'reka-ui'

const buttonId = useId()
const customId = useId('test-id')
</script>

<template>
  <button :id="buttonId">
    Generated ID
  </button>
  <button :id="customId">
    Explicit ID
  </button>
</template>
```
