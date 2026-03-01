<script lang="ts">
import type { RangeCalendarGridHeadProps } from '..'
import { RangeCalendarGridHead } from '..'

export interface DateRangePickerGridHeadProps extends RangeCalendarGridHeadProps {}

export default {
  compatConfig: {
    MODE: 3,
  },
}
</script>

<script setup lang="ts">
const props = defineProps<DateRangePickerGridHeadProps>()
</script>

<template>
  <RangeCalendarGridHead v-bind="props">
    <slot />
  </RangeCalendarGridHead>
</template>
