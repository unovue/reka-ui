<script lang="ts">
import type { RangeCalendarPrevSlot } from '@/RangeCalendar/RangeCalendarPrev.vue'
import type { RangeCalendarPrevProps } from '..'
import { RangeCalendarPrev } from '..'

export interface DateRangePickerPrevProps extends RangeCalendarPrevProps {}
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
