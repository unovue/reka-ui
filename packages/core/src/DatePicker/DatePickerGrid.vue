<script lang="ts">
import type { CalendarGridProps } from '..'
import { CalendarGrid } from '..'

export interface DatePickerGridProps extends CalendarGridProps {}

export default {
  compatConfig: {
    MODE: 3,
  },
}
</script>

<script setup lang="ts">
const props = defineProps<DatePickerGridProps>()
</script>

<template>
  <CalendarGrid v-bind="props">
    <slot />
  </CalendarGrid>
</template>
