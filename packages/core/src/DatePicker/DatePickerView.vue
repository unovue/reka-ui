<script lang="ts">
import type { CalendarViewProps } from '..'
import type { CalendarGridData, CalendarUnit } from '@/date'
import { CalendarView } from '..'

export interface DatePickerViewProps extends CalendarViewProps {}

export interface DatePickerViewSlot {
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
const props = defineProps<DatePickerViewProps>()
defineSlots<DatePickerViewSlot>()
</script>

<template>
  <CalendarView
    v-slot="slotProps"
    v-bind="props"
  >
    <slot v-bind="slotProps" />
  </CalendarView>
</template>
