<script lang="ts">
import type { CalendarPrevSlot } from '@/Calendar/CalendarPrev.vue'
import type { CalendarPrevProps } from '..'
import { CalendarPrev } from '..'

export interface DatePickerPrevProps extends CalendarPrevProps {}
</script>

<script setup lang="ts">
const props = defineProps<DatePickerPrevProps>()
defineSlots<CalendarPrevSlot>()
</script>

<template>
  <CalendarPrev
    v-slot="slotProps"
    v-bind="props"
  >
    <slot v-bind="slotProps" />
  </CalendarPrev>
</template>
