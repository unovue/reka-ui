<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardExpose } from '@/shared'

export interface ToastTitleProps extends PrimitiveProps {}

export default {
  compatConfig: {
    MODE: 3,
  },
}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'

const props = defineProps<ToastTitleProps>()
useForwardExpose()
</script>

<template>
  <Primitive v-bind="props">
    <slot />
  </Primitive>
</template>
