<script lang="ts">
import type { RangeCalendarViewTriggerProps, RangeCalendarViewTriggerSlot } from '..'
import { RangeCalendarViewTrigger } from '..'

export interface DateRangePickerViewTriggerProps extends RangeCalendarViewTriggerProps {}
</script>

<script setup lang="ts">
import { useForwardElement } from '@/shared'

const props = defineProps<DateRangePickerViewTriggerProps>()
defineSlots<RangeCalendarViewTriggerSlot>()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <RangeCalendarViewTrigger
    :ref="forwardRef"
    v-slot="slotProps"
    v-bind="props"
  >
    <slot v-bind="slotProps" />
  </RangeCalendarViewTrigger>
</template>
