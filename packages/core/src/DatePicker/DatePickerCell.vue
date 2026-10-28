<script lang="ts">
import type { CalendarCellProps } from '..'
import { CalendarCell } from '..'

export interface DatePickerCellProps extends CalendarCellProps {}
</script>

<script setup lang="ts">
import { h, useSlots } from 'vue'
import { useForwardElement } from '@/shared'

const props = defineProps<DatePickerCellProps>()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
const slots = useSlots()

// The slot content goes straight into the element: no `<slot>` fragment, so
// no empty anchor text nodes (this part renders once per calendar cell).
function renderRoot() {
  return h(CalendarCell, { ref: forwardRef, ...props }, slots)
}
</script>

<template>
  <component :is="renderRoot()" />
</template>
