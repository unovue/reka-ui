<script lang="ts">
import type { RangeCalendarCellTriggerProps, RangeCalendarCellTriggerSlot } from '@/RangeCalendar/RangeCalendarCellTrigger.vue'
import { RangeCalendarCellTrigger } from '..'

export interface DateRangePickerCellTriggerProps extends RangeCalendarCellTriggerProps {}

export default {
  compatConfig: {
    MODE: 3,
  },
}
</script>

<script setup lang="ts">
const props = defineProps<DateRangePickerCellTriggerProps>()

defineSlots<RangeCalendarCellTriggerSlot>()
</script>

<template>
  <RangeCalendarCellTrigger
    v-slot="slotProps"
    v-bind="props"
  >
    <slot v-bind="slotProps" />
  </RangeCalendarCellTrigger>
</template>
