<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface CalendarGridRowProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { h, useSlots } from 'vue'
import { Primitive } from '@/Primitive'
import { useForwardElement } from '@/shared'

const props = withDefaults(defineProps<CalendarGridRowProps>(), { as: 'tr' })

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
const slots = useSlots()

// The slot content goes straight into the element: no `<slot>` fragment, so
// no empty anchor text nodes (this part renders once per week row).
function renderRoot() {
  return h(Primitive, { ref: forwardRef, ...props }, slots)
}
</script>

<template>
  <component :is="renderRoot()" />
</template>
