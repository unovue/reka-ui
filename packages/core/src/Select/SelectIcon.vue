<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface SelectIconProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { useForwardElement } from '@/shared'

withDefaults(defineProps<SelectIconProps>(), {
  as: 'span',
})

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <Primitive
    :ref="forwardRef"
    aria-hidden="true"
    :as="as"
    :as-child="asChild"
  >
    <slot>▼</slot>
  </Primitive>
</template>
