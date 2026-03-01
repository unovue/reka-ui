<script lang="ts">
import type { CalendarHeadCellProps } from '..'
import { CalendarHeadCell } from '..'

export interface DatePickerHeadCellProps extends CalendarHeadCellProps {}

export default {
  compatConfig: {
    MODE: 3,
  },
}
</script>

<script setup lang="ts">
const props = defineProps<DatePickerHeadCellProps>()
</script>

<template>
  <CalendarHeadCell v-bind="props">
    <slot />
  </CalendarHeadCell>
</template>
