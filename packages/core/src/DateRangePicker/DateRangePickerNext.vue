<script lang="ts">
import type { RangeCalendarNextProps } from '..'
import type { RangeCalendarNextSlot } from '@/RangeCalendar/RangeCalendarNext.vue'
import { RangeCalendarNext } from '..'

export interface DateRangePickerNextProps extends RangeCalendarNextProps {}

export default {
  compatConfig: {
    MODE: 3,
  },
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
