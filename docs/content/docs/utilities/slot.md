---
title: Slot
description: Merges its props onto its immediate child.
---

# Slot

<Description>
Merges its props onto its immediate child.
</Description>

<Callout type="info" title="Question">

How is this component different from [Vue's native slot](https://vuejs.org/guide/components/slots.html)?

A: `<Slot />` merges the attributes assigned to it onto its immediate child, instead of exposing them as slot props.

</Callout>

Vue's native slot treats any bound value as [Scoped Slots](https://vuejs.org/guide/components/slots.html#scoped-slots), where the values will be exposed to the parent template to be consumed.

Reka UI's slot behaves differently. Instead, it merges all the assigned attributes onto its immediate child.

## Example

Say we want to assign an `id` attribute to whatever component/element that was rendered. Vue's native slot will convert it into a scoped slot, and you will need to assign that id manually.

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
    <button :id="slotProps.id">...</button>
  </Comp>
</template>
```
(You can check out
[Vue SFC Playground](https://play.vuejs.org/#eNp9UrFOwzAQ/ZWTly4oUelWhUgFdYABKmD0EpJr45LYln1JK1X5d84OTQEB2/m9d+fnez6JlbVJ36FYisyXTlkCj9TZXGrVWuMITuBwCwNsnWlhxtLZRN2Z1o64FEkaTmGUFFKD1Fk6zuNJfCBsbVMQ8gkgq+f5xhnr0xWRU28doQelwTeG4FB4PSMoC+cUVmB6dFnKDbEx3BErrrmNjM4VO65N11RQFz2Cqm6kmF8vpMjST0XsjPa4zNLJirgS5Eujt2qX7L3RvINT0EpRslY16J4sKaO9FEuITOCKpjGHh4iR6/DqjJc1lu+/4Ht/DJgUG4ceXc/7mTgq3A5ppNcvj3jkeiJbU3UNq/8hn9GbpgseR9ltpyu2/UUX3d7HuJTevfr1kVD786OC0aAcol4KTi+s6a+nX+wukkXsk3rgLZ6TD5/oW9C895jpJZScvwUjP4IYPgAfN9Yc) and see that the `id` wasn't inherited.)

This can be troublesome and takes more boilerplate if you want to ensure some attributes are being passed onto a certain element, for example for accessibility.

---

Alternatively, if you use `Slot` from Reka UI, the attributes assigned to the Slot component will be inherited by the immediate child element.

<Callout type="warning" title="Warning">

Attributes assigned to `<Slot />` are merged onto the child and are not exposed as slot props.

</Callout>

```vue
<!-- Reka UI Slot -->
<script setup lang="ts">
import { Slot } from 'reka-ui'
</script>

<!-- Comp.vue -->
<template>
  <div id="my-component">
    <Slot id="reka-01" class="inherit-me">
      <slot />
    </Slot>
  </div>
</template>

<!-- parent template -->
<template>
  <Comp>
    <!-- id and class will be inherited -->
    <button>...</button>
  </Comp>
</template>
```

```html
<!-- final output -->
<div id="my-component">
  <button id="reka-01" class="inherit-me">...</button>
</div>
```
