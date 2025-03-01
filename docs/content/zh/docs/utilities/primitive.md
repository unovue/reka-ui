---
title: Primitive
description: 将 Reka 的功能组合到替代元素类型或你自己的 Vue 组件上。
---

# Primitive

<Description>
将 Reka 的功能组合到替代元素类型或你自己的 Vue 组件上。
</Description>

当你构建一个组件时，在某些情况下，你可能希望允许用户将一些功能组合到底层元素或替代元素上。这就是 `Primitive` 派上用场的地方，因为它向用户暴露了此功能。

## API 参考

<PropsTable
  :data="[
    {
      name: 'as',
      required: false,
      type: 'string | Component',
      default: 'div',
      description: '<p>当前元素应渲染为的元素或组件。可以被 <code>asChild</code> 覆盖</p>',
    },
    {
      name: 'asChild',
      required: false,
      type: 'boolean',
      default: 'false',
      description: '<p>更改作为子元素传递的元素的默认渲染元素，合并它们的 props 和行为。<br><br>阅读我们的<a href=&quot;../guides/composition&quot;>合成</a>指南了解更多详情。</p>',
    }
  ]"
/>

## 用法

### 更改 `as` 值

如果你想改变正在渲染的默认元素或组件，你可以在定义 props 时设置默认 `as`。

```vue
<script setup lang="ts">
import { Primitive, type PrimitiveProps } from 'reka-ui'

const props = withDefaults(defineProps<PrimitiveProps>(), {
  as: 'span'
})
</script>

<template>
  <!-- Now this element will be rendered as `span` by default -->
  <Primitive v-bind="props">
    ...
  </Primitive>
</template>
```

### 渲染 `asChild`

更改作为子元素传递的元素的默认渲染元素，合并它们的 props 和行为。<br><br>
阅读我们的[合成](../guides/composition)指南了解更多详情。
