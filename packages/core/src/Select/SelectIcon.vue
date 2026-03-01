<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface SelectIconProps extends PrimitiveProps {}

export default {
  compatConfig: {
    MODE: 3,
  },
}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'

withDefaults(defineProps<SelectIconProps>(), {
  as: 'span',
})
</script>

<template>
  <Primitive
    aria-hidden="true"
    :as="as"
    :as-child="asChild"
  >
    <slot>▼</slot>
  </Primitive>
</template>
