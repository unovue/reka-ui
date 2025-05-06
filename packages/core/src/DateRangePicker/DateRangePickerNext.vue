<script lang="ts">
import type { RangeCalendarNextSlot } from '@/RangeCalendar/RangeCalendarNext.vue'
import type { RangeCalendarNextProps } from '..'
import { RangeCalendarNext } from '..'

export interface DateRangePickerNextProps extends RangeCalendarNextProps {}
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
