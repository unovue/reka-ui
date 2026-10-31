<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface CalendarGridHeadProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { renderAs } from '@/Primitive/renderAs'
import { useForwardElement } from '@/shared'

const props = withDefaults(defineProps<CalendarGridHeadProps>(), { as: 'thead' })

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="forwardRef"
    aria-hidden="true"
  >
    <slot />
  </component>
</template>
