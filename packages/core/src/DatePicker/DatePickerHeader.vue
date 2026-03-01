<script lang="ts">
import type { CalendarHeaderProps } from '..'
import { CalendarHeader } from '..'

export interface DatePickerHeaderProps extends CalendarHeaderProps {}

export default {
  compatConfig: {
    MODE: 3,
  },
}
</script>

<script setup lang="ts">
const props = defineProps<DatePickerHeaderProps>()
</script>

<template>
  <CalendarHeader v-bind="props">
    <slot />
  </CalendarHeader>
</template>
