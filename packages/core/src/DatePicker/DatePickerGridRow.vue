<script lang="ts">
import type { CalendarGridRowProps } from '..'
import { CalendarGridRow } from '..'

export interface DatePickerGridRowProps extends CalendarGridRowProps {}

export default {
  compatConfig: {
    MODE: 3,
  },
}
</script>

<script setup lang="ts">
const props = defineProps<DatePickerGridRowProps>()
</script>

<template>
  <CalendarGridRow v-bind="props">
    <slot />
  </CalendarGridRow>
</template>
