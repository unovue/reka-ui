<script lang="ts">
import type { CalendarViewTriggerProps, CalendarViewTriggerSlot } from '..'
import { CalendarViewTrigger } from '..'

export interface DatePickerViewTriggerProps extends CalendarViewTriggerProps {}
</script>

<script setup lang="ts">
import { useForwardElement } from '@/shared'

const props = defineProps<DatePickerViewTriggerProps>()
defineSlots<CalendarViewTriggerSlot>()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <CalendarViewTrigger
    :ref="forwardRef"
    v-slot="slotProps"
    v-bind="props"
  >
    <slot v-bind="slotProps" />
  </CalendarViewTrigger>
</template>
