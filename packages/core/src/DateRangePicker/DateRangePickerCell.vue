<script lang="ts">
import type { RangeCalendarCellProps } from '..'
import { RangeCalendarCell } from '..'

export interface DateRangePickerCellProps extends RangeCalendarCellProps {}

export default {
  compatConfig: {
    MODE: 3,
  },
}
</script>

<script setup lang="ts">
const props = defineProps<DateRangePickerCellProps>()
</script>

<template>
  <RangeCalendarCell v-bind="props">
    <slot />
  </RangeCalendarCell>
</template>
