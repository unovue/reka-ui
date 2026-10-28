<script lang="ts">
import type { CalendarCellTriggerProps } from '..'
import type { CalendarCellTriggerSlot } from '@/Calendar/CalendarCellTrigger.vue'
import { CalendarCellTrigger } from '..'

export interface DatePickerCellTriggerProps extends CalendarCellTriggerProps {}
</script>

<script setup lang="ts">
import type { Slots } from 'vue'
import { h } from 'vue'
import { useForwardElement } from '@/shared'

const props = defineProps<DatePickerCellTriggerProps>()
const slots = defineSlots<CalendarCellTriggerSlot>()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)

// The slot content goes straight into the element: no `<slot>` fragment, so
// no empty anchor text nodes (this part renders once per calendar cell).
function renderRoot() {
  return h(CalendarCellTrigger, { ref: forwardRef, ...props }, slots as Slots)
}
</script>

<template>
  <component :is="renderRoot()" />
</template>
