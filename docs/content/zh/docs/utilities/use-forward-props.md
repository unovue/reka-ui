---
title: useForwardProps
description: 穿透组件的 props，不进行布尔转换（Boolean 类型转换）。
---

# useForwardProps

<Description>
穿透组件的 props，不进行布尔转换（Boolean 类型转换）。
</Description>

当你为组件构建包装器时，在某些情况下，你会想忽略 Vue [Props Boolean 类型转换](https://cn.vuejs.org/guide/components/props.html#boolean-casting)。

您可以将所有布尔字段的默认值设为 `undefined`，也可以使用此可组合项。

## Usage

```vue
<script setup lang="ts">
import { useForwardProps } from 'reka-ui'

const props = defineProps<CompEmitProps>()
const forwarded = useForwardProps(props)
</script>

<template>
  <Comp v-bind="forwarded">
    ...
  </Comp>
</template>
```
