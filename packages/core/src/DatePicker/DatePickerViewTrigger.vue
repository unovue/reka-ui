<script lang="ts">
import type { CalendarViewTriggerProps, CalendarViewTriggerSlot } from '..'
import { CalendarViewTrigger } from '..'

export interface DatePickerViewTriggerProps extends CalendarViewTriggerProps {}
</script>

<script setup lang="ts">
const props = defineProps<DatePickerViewTriggerProps>()
defineSlots<CalendarViewTriggerSlot>()
</script>

<template>
  <CalendarViewTrigger
    v-slot="slotProps"
    v-bind="props"
  >
    <slot v-bind="slotProps" />
  </CalendarViewTrigger>
</template>
