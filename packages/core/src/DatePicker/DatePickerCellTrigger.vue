<script lang="ts">
import type { CalendarCellTriggerProps } from '..'
import type { CalendarCellTriggerSlot } from '@/Calendar/CalendarCellTrigger.vue'
import { CalendarCellTrigger } from '..'

export interface DatePickerCellTriggerProps extends CalendarCellTriggerProps {}
</script>

<script setup lang="ts">
import { useForwardElement } from '@/shared'

const props = defineProps<DatePickerCellTriggerProps>()
defineSlots<CalendarCellTriggerSlot>()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <CalendarCellTrigger
    :ref="forwardRef"
    v-slot="slotProps"
    v-bind="props"
  >
    <slot v-bind="slotProps" />
  </CalendarCellTrigger>
</template>
