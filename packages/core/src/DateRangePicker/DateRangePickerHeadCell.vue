<script lang="ts">
import type { RangeCalendarHeadCellProps } from '..'
import { RangeCalendarHeadCell } from '..'

export interface DateRangePickerHeadCellProps extends RangeCalendarHeadCellProps {}

export default {
  compatConfig: {
    MODE: 3,
  },
}
</script>

<script setup lang="ts">
const props = defineProps<DateRangePickerHeadCellProps>()
</script>

<template>
  <RangeCalendarHeadCell v-bind="props">
    <slot />
  </RangeCalendarHeadCell>
</template>
