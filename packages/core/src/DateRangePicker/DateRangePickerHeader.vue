<script lang="ts">
import type { RangeCalendarHeaderProps } from '..'
import { RangeCalendarHeader } from '..'

export interface DateRangePickerHeaderProps extends RangeCalendarHeaderProps {}

export default {
  compatConfig: {
    MODE: 3,
  },
}
</script>

<script setup lang="ts">
const props = defineProps<DateRangePickerHeaderProps>()
</script>

<template>
  <RangeCalendarHeader v-bind="props">
    <slot />
  </RangeCalendarHeader>
</template>
