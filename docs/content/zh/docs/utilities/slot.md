---
title: Slot 插槽
description: 将其 props 合并到其直接子项上。
---

# Slot 插槽

<Description>
将其 props 合并到其直接子项上。
</Description>

<Callout type="info" title="Question">

这个组件和 [Vue 原生 slot](https://cn.vuejs.org/guide/components/slots.html) 有什么不同？

答：最大的区别是它如何处理分配给它的 `attributes`。

</Callout>

原生插槽将任何绑定的值视为[作用域插槽](https://cn.vuejs.org/guide/components/slots.html#scoped-slots)，其中的值将公开给父模板并被使用。

但是 Reka UI 的插槽行为不同，它会将所有分配的属性合并到它的直接子对象上。

## 示例

假设我们想为渲染的任何组件/元素分配一个 `id` 属性，但原生插槽会将其转换为一个有范围的插槽，你需要手动分配该 `id`。

```vue
<!-- Native Slot -->
<!-- Comp.vue -->
<template>
  <slot id="reka-01">
    ...
  </slot>
</template>

<!-- parent template -->
<template>
  <Comp v-slot="slotProps">
    <button :id="slotProps.id">...<button>
  <Comp>
<template>
```
（你可以查看 [Vue SFC Playground](https://play.vuejs.org/#eNp9UrFOwzAQ/ZWTly4oUelWhUgFdYABKmD0EpJr45LYln1JK1X5d84OTQEB2/m9d+fnez6JlbVJ36FYisyXTlkCj9TZXGrVWuMITuBwCwNsnWlhxtLZRN2Z1o64FEkaTmGUFFKD1Fk6zuNJfCBsbVMQ8gkgq+f5xhnr0xWRU28doQelwTeG4FB4PSMoC+cUVmB6dFnKDbEx3BErrrmNjM4VO65N11RQFz2Cqm6kmF8vpMjST0XsjPa4zNLJirgS5Eujt2qX7L3RvINT0EpRslY16J4sKaO9FEuITOCKpjGHh4iR6/DqjJc1lu+/4Ht/DJgUG4ceXc/7mTgq3A5ppNcvj3jkeiJbU3UNq/8hn9GbpgseR9ltpyu2/UUX3d7HuJTevfr1kVD786OC0aAcol4KTi+s6a+nX+wukkXsk3rgLZ6TD5/oW9C895jpJZScvwUjP4IYPgAfN9Yc) 并看到 `id` 没有被继承。）

如果你想确保某些属性被传递到某个元素上（这可能是出于无障碍的原因），这将很麻烦。

---

或者，如果您使用 Reka UI 中的 `Slot`，则分配给 `Slot` 组件的属性将由直接子元素继承，但您将无法再访问作用域插槽。

```vue
<!-- Reka UI Slot -->
<script setup lang="ts">
import { Slot } from 'reka-ui'
</script>

<!-- Comp.vue -->
<template>
  <Slot id="reka-01">
    ...
  </Slot>
</template>

<!-- parent template -->
<template>
  <Comp>
    <!-- id will be inherited -->
    <button>...<button>
  <Comp>
<template>
```
