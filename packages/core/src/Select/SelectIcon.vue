<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface SelectIconProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { renderAs } from '@/Primitive/renderAs'
import { useForwardElement } from '@/shared'

withDefaults(defineProps<SelectIconProps>(), {
  as: 'span',
})

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="forwardRef"
    aria-hidden="true"
  >
    <slot>▼</slot>
  </component>
</template>
