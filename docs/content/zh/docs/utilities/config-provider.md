---
title: Config Provider 配置下发
description: 包装您的应用程序以提供全局配置。
---

# Config Provider 配置下发

<Description>
包装您的应用程序以提供全局配置。
</Description>

<Highlights
  :features="[
    '使所有 primitives 都能继承全局读取方向。',
    '允许在设置主体锁定时更改滚动主体的行为。',
    '更多控件可防止布局偏移。',
  ]"
/>

## 组件解析

导入组件。

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

## API 参考

### Config Provider

当创建需要从右到左 （RTL） 读取方向的本地化应用程序时，你需要使用 `ConfigProvider` 组件包装你的应用程序，以确保所有 primitives 都根据 `dir` 属性调整它们的行为。

您还可以更改 `Alert`、`DropdownMenu` 等组件的 `bodylock` 的全局行为，以适应您的布局，以防止任何[内容偏移](https://github.com/unovue/radix-vue/issues/385)。

<!-- @include: @/zh/meta/ConfigProvider.md -->

## 示例

使用 config provider.

将全局方向设置为 `rtl`，并将滚动行为（scroll body behavior）设置为 `false`（不会设置任何填充/边距）。

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

## 水合问题 （View < 3.5）

我们公开了一个临时解决方法，允许当前的 Nuxt（版本 >3.10）项目使用 Nuxt 提供的 [`useId`](https://nuxt.com/docs/api/composables/use-id) 修复当前的水合问题。

> 受 [Headless UI](https://github.com/tailwindlabs/headlessui/pull/2959) 的启发

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
