<script lang="ts">
import type { RangeCalendarCellTriggerProps, RangeCalendarCellTriggerSlot } from '@/RangeCalendar/RangeCalendarCellTrigger.vue'
import { RangeCalendarCellTrigger } from '..'

export interface DateRangePickerCellTriggerProps extends RangeCalendarCellTriggerProps {}
</script>

<script setup lang="ts">
import type { Slots } from 'vue'
import { h } from 'vue'
import { useForwardElement } from '@/shared'

const props = defineProps<DateRangePickerCellTriggerProps>()

const slots = defineSlots<RangeCalendarCellTriggerSlot>()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)

// The slot content goes straight into the element: no `<slot>` fragment, so
// no empty anchor text nodes (this part renders once per calendar cell).
function renderRoot() {
  return h(RangeCalendarCellTrigger, { ref: forwardRef, ...props }, slots as Slots)
}
</script>

<template>
  <component :is="renderRoot()" />
</template>
