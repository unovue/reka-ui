<script lang="ts">
import type { RangeCalendarGridBodyProps } from '..'
import { RangeCalendarGridBody } from '..'

export interface DateRangePickerGridBodyProps extends RangeCalendarGridBodyProps {}

export default {
  compatConfig: {
    MODE: 3,
  },
}
</script>

<script setup lang="ts">
const props = defineProps<DateRangePickerGridBodyProps>()
</script>

<template>
  <RangeCalendarGridBody v-bind="props">
    <slot />
  </RangeCalendarGridBody>
</template>
