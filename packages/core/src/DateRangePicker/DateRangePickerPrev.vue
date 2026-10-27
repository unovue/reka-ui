<script lang="ts">
import type { RangeCalendarPrevProps } from '..'
import type { CalendarPageFunction } from '@/date'
import type { RangeCalendarPrevSlot } from '@/RangeCalendar/RangeCalendarPrev.vue'
import { RangeCalendarPrev } from '..'

export interface DateRangePickerPrevProps extends Omit<RangeCalendarPrevProps, 'prevPage'> {
  /** A function that returns the previous page of the calendar, used instead of the default step. It receives the current placeholder and the active view, and applies in every view; render the button inside a `DateRangePickerView` to scope it to one view. */
  prevPage?: CalendarPageFunction
}
</script>

<script setup lang="ts">
const props = defineProps<DateRangePickerPrevProps>()
defineSlots<RangeCalendarPrevSlot>()
</script>

<template>
  <RangeCalendarPrev
    v-slot="slotProps "
    v-bind="props"
  >
    <slot v-bind="slotProps" />
  </RangeCalendarPrev>
</template>
