<script lang="ts">
import type { RangeCalendarCellTriggerProps, RangeCalendarCellTriggerSlot } from '@/RangeCalendar/RangeCalendarCellTrigger.vue'
import { RangeCalendarCellTrigger } from '..'

export interface DateRangePickerCellTriggerProps extends RangeCalendarCellTriggerProps {}
</script>

<script setup lang="ts">
import { useForwardElement } from '@/shared'

const props = defineProps<DateRangePickerCellTriggerProps>()

defineSlots<RangeCalendarCellTriggerSlot>()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <RangeCalendarCellTrigger
    :ref="forwardRef"
    v-slot="slotProps"
    v-bind="props"
  >
    <slot v-bind="slotProps" />
  </RangeCalendarCellTrigger>
</template>
