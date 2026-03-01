<script lang="ts">
import type { CalendarNextProps } from '..'
import type { CalendarNextSlot } from '@/Calendar/CalendarNext.vue'
import { CalendarNext } from '..'

export interface DatePickerNextProps extends CalendarNextProps {}

export default {
  compatConfig: {
    MODE: 3,
  },
}
</script>

<script setup lang="ts">
const props = defineProps<DatePickerNextProps>()

defineSlots<CalendarNextSlot>()
</script>

<template>
  <CalendarNext
    v-slot="slotProps"
    v-bind="props"
  >
    <slot v-bind="slotProps" />
  </CalendarNext>
</template>
