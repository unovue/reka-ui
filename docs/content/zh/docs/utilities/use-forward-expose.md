---
title: useForwardExpose
description: 穿透组件的暴露值、props 和 $el。
---

# useForwardExpose

<Description>
穿透组件的暴露值、props 和 $el。
</Description>

在构建组件时，如果我们有一个非单根节点的组件，模板 refs 不会通过 `$el` 返回 DOM 元素（[阅读更多](https://cn.vuejs.org/api/component-instance.html#el)），因此，我们需要手动转发该组件的模板 ref 中的 `$el`。或者在某些情况下，您希望将某个元素作为暴露元素..

此外，此组合式函数扩展了模板 ref 中缺少的公开 `props`。

## 用法

```vue
<script setup lang="ts">
import { useForwardExpose } from 'reka-ui'

const selectedElementId = ref(1)
const { forwardRef } = useForwardExpose()
</script>

<template>
  <span>
    <!-- We want to expose div as the template ref's element -->
    <div :ref="forwardRef">
      ...
    </div>
  </span>
</template>
```
