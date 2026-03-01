<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface MenuGroupProps extends PrimitiveProps {}

export default {
  compatConfig: {
    MODE: 3,
  },
}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'

const props = defineProps<MenuGroupProps>()
</script>

<template>
  <Primitive
    role="group"
    v-bind="props"
  >
    <slot />
  </Primitive>
</template>
