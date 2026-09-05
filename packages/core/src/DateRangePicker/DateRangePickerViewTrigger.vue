<script lang="ts">
import type { RangeCalendarViewTriggerProps, RangeCalendarViewTriggerSlot } from '..'
import { RangeCalendarViewTrigger } from '..'

export interface DateRangePickerViewTriggerProps extends RangeCalendarViewTriggerProps {}
</script>

<script setup lang="ts">
const props = defineProps<DateRangePickerViewTriggerProps>()
defineSlots<RangeCalendarViewTriggerSlot>()
</script>

<template>
  <RangeCalendarViewTrigger
    v-slot="slotProps"
    v-bind="props"
  >
    <slot v-bind="slotProps" />
  </RangeCalendarViewTrigger>
</template>
