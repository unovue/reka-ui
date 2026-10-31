<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface CalendarHeaderProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { renderAs } from '@/Primitive/renderAs'
import { useForwardElement } from '@/shared'

const props = withDefaults(defineProps<CalendarHeaderProps>(), { as: 'div' })

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
