---
title: useEmitAsProps
description: 将 emits 转换为类似于 props 的对象
---

# useEmitAsProps

<Description>
将 emits 转换为类似于 props 的对象
</Description>

当你为组件构建包装器时，最大的痛点之一是转发组件发出的所有事件。

通过使用这个组合式函数，它会将你声明的 `emits` 转换为 Vue 组件可以接受的处理程序对象。

## 用法

```vue
<script setup lang="ts">
import { useEmitAsProps } from 'reka-ui'

const emits = defineEmits<CompEmitType>()
const emitsAsProps = useEmitAsProps(emits)
</script>

<template>
  <Comp v-bind="emitsAsProps">
    ...
  </Comp>
</template>
```
