<script lang="ts">
import type { CalendarGridRowProps } from '..'
import { CalendarGridRow } from '..'

export interface DatePickerGridRowProps extends CalendarGridRowProps {}
</script>

<script setup lang="ts">
import { h, useSlots } from 'vue'
import { useForwardElement } from '@/shared'

const props = defineProps<DatePickerGridRowProps>()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
const slots = useSlots()

// The slot content goes straight into the element: no `<slot>` fragment, so
// no empty anchor text nodes (this part renders once per week row).
function renderRoot() {
  return h(CalendarGridRow, { ref: forwardRef, ...props }, slots)
}
</script>

<template>
  <component :is="renderRoot()" />
</template>
