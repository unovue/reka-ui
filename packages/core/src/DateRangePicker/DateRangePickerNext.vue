<script lang="ts">
import type { RangeCalendarNextProps } from '..'
import type { CalendarPageFunction } from '@/date'
import type { RangeCalendarNextSlot } from '@/RangeCalendar/RangeCalendarNext.vue'
import { RangeCalendarNext } from '..'

export interface DateRangePickerNextProps extends Omit<RangeCalendarNextProps, 'nextPage'> {
  /** A function that returns the next page of the calendar, used instead of the default step. It receives the current placeholder and the active view, and applies in every view; render the button inside a `DateRangePickerView` to scope it to one view. */
  nextPage?: CalendarPageFunction
}
</script>

<script setup lang="ts">
const props = defineProps<DateRangePickerNextProps>()
defineSlots<RangeCalendarNextSlot>()
</script>

<template>
  <RangeCalendarNext
    v-slot="slotProps "
    v-bind="props"
  >
    <slot v-bind="slotProps" />
  </RangeCalendarNext>
</template>
