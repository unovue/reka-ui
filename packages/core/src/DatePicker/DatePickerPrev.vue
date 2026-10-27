<script lang="ts">
import type { CalendarPrevProps } from '..'
import type { CalendarPrevSlot } from '@/Calendar/CalendarPrev.vue'
import type { CalendarPageFunction } from '@/date'
import { CalendarPrev } from '..'

export interface DatePickerPrevProps extends Omit<CalendarPrevProps, 'prevPage'> {
  /** A function that returns the previous page of the calendar, used instead of the default step. It receives the current placeholder and the active view, and applies in every view; render the button inside a `DatePickerView` to scope it to one view. */
  prevPage?: CalendarPageFunction
}
</script>

<script setup lang="ts">
import { useForwardElement } from '@/shared'

const props = defineProps<DatePickerPrevProps>()
defineSlots<CalendarPrevSlot>()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <CalendarPrev
    :ref="forwardRef"
    v-slot="slotProps"
    v-bind="props"
  >
    <slot v-bind="slotProps" />
  </CalendarPrev>
</template>
