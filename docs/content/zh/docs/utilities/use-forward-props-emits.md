---
title: useForwardPropsEmits
description: 结合 useForwardProps 和 useEmitAsProps

---

# useForwardPropsEmits

<Description>
结合 useForwardProps 和 useEmitAsProps
</Description>

此组合式函数只是 [useForwardProps](/zh/docs/utilities/use-forward-props) 和 [useEmitAsProps](/zh/docs/utilities/use-emit-as-props.html) 组合式函数的包装器。这样做，它只返回 1 个被设计为直接与 `v-bind` 一起使用的对象。

## Usage

```vue
<script setup lang="ts">
import { useForwardPropsEmits } from 'reka-ui'

const props = defineProps<CompEmitProps>()
const emits = defineEmits<CompEmitEmits>()
const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <Comp v-bind="forwarded">
    ...
  </Comp>
</template>
```
