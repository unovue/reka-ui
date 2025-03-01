---
title: Visually Hidden 视觉隐藏
description: 以可访问的方式从屏幕中隐藏内容。
---

# Visually Hidden 视觉隐藏

<Description>
以可访问的方式从屏幕中隐藏内容。
</Description>

<Highlights
  :features="[
    '在视觉上隐藏内容，同时保留内容以供辅助技术使用。',
  ]"
/>

## 组件解析

导入组件。

```vue
<script setup lang="ts">
import { VisuallyHidden } from 'reka-ui'
</script>

<template>
  <VisuallyHidden>
    <slot />
  </VisuallyHidden>
</template>
```

## 基本使用

使用视觉上隐藏的 primitive.

```vue
<script setup lang="ts">
import { VisuallyHidden } from 'reka-ui'
import { GearIcon } from '@radix-icons/vue'
</script>

<template>
  <button>
    <GearIcon />
    <VisuallyHidden>Settings</VisuallyHidden>
  </button>
</template>
```

## API 参考

### Root

您放入此组件中的任何内容都将从屏幕上隐藏，但将由屏幕阅读器声明。

<PropsTable
  :data="[
    {
      name: 'as',
      type: 'string | Component',
      default: 'span',
      description: '<p>此组件应呈现为的元素或组件。可以被<Code>asChild</Code>覆盖</p>'
    },
    {
      name: 'asChild',
      required: false,
      type: 'boolean',
      default: 'false',
      description:  `<p>将默认渲染的元素更改为作为子元素传递的元素，合并它们的 props 和行为。
          <br />
          <br />
          阅读我们的<a href=&quot;../guides/composition&quot;>合成</a>指南了解更多详情。</p>`
    },
  ]"
/>

## 无障碍

这在某些情况下很有用，可以作为使用 `aria-label` 或 `aria-labelledby` 的传统标签的替代方案。
