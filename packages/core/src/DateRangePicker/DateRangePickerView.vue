<script lang="ts">
import type { RangeCalendarViewProps } from '..'
import type { CalendarGridData, CalendarUnit } from '@/date'
import { RangeCalendarView } from '..'

export interface DateRangePickerViewProps extends RangeCalendarViewProps {}

export interface DateRangePickerViewSlot {
  default?: (props: {
    /** The rendered page(s) of this view */
    grid: CalendarGridData[]
    /** The days of the week (day view only) */
    weekDays: string[]
    /** This view's unit */
    view: CalendarUnit
  }) => any
}
</script>

<script setup lang="ts">
const props = defineProps<DateRangePickerViewProps>()
defineSlots<DateRangePickerViewSlot>()
</script>

<template>
  <RangeCalendarView
    v-slot="slotProps"
    v-bind="props"
  >
    <slot v-bind="slotProps" />
  </RangeCalendarView>
</template>
