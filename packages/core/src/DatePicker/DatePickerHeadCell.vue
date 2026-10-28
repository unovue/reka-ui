<script lang="ts">
import type { CalendarHeadCellProps } from '..'
import { CalendarHeadCell } from '..'

export interface DatePickerHeadCellProps extends CalendarHeadCellProps {}
</script>

<script setup lang="ts">
import { h, useSlots } from 'vue'
import { useForwardElement } from '@/shared'

const props = defineProps<DatePickerHeadCellProps>()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
const slots = useSlots()

// The slot content goes straight into the element: no `<slot>` fragment, so
// no empty anchor text nodes (this part renders once per weekday).
function renderRoot() {
  return h(CalendarHeadCell, { ref: forwardRef, ...props }, slots)
}
</script>

<template>
  <component :is="renderRoot()" />
</template>
