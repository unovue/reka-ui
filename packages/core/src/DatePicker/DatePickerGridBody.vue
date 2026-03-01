<script lang="ts">
import type { CalendarGridBodyProps } from '..'
import { CalendarGridBody } from '..'

export interface DatePickerGridBodyProps extends CalendarGridBodyProps {}

export default {
  compatConfig: {
    MODE: 3,
  },
}
</script>

<script setup lang="ts">
const props = defineProps<DatePickerGridBodyProps>()
</script>

<template>
  <CalendarGridBody v-bind="props">
    <slot />
  </CalendarGridBody>
</template>
