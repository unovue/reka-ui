<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface RangeCalendarGridBodyProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { renderAs } from '@/Primitive/renderAs'
import { useForwardElement } from '@/shared'

const props = withDefaults(defineProps<RangeCalendarGridBodyProps>(), { as: 'tbody' })

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="forwardRef"
  >
    <slot />
  </component>
</template>
