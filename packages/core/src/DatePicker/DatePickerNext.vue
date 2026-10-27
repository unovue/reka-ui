<script lang="ts">
import type { CalendarNextProps } from '..'
import type { CalendarNextSlot } from '@/Calendar/CalendarNext.vue'
import type { CalendarPageFunction } from '@/date'
import { CalendarNext } from '..'

export interface DatePickerNextProps extends Omit<CalendarNextProps, 'nextPage'> {
  /** A function that returns the next page of the calendar, used instead of the default step. It receives the current placeholder and the active view, and applies in every view; render the button inside a `DatePickerView` to scope it to one view. */
  nextPage?: CalendarPageFunction
}
</script>

<script setup lang="ts">
const props = defineProps<DatePickerNextProps>()

defineSlots<CalendarNextSlot>()
</script>

<template>
  <CalendarNext
    v-slot="slotProps"
    v-bind="props"
  >
    <slot v-bind="slotProps" />
  </CalendarNext>
</template>
