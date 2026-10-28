<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface SelectSeparatorProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { renderAs } from '@/Primitive/renderAs'
import { useForwardElement } from '@/shared'

const props = defineProps<SelectSeparatorProps>()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <component
    :is="renderAs(props.as, props.asChild)"
    :ref="forwardRef"
    aria-hidden="true"
  >
    <slot />
  </component>
</template>
