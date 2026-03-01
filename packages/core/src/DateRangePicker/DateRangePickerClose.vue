<script lang="ts">
import type { PopoverCloseProps } from '..'
import { PopoverClose } from '..'

export interface DateRangePickerCloseProps extends PopoverCloseProps {}

export default {
  compatConfig: {
    MODE: 3,
  },
}
</script>

<script setup lang="ts">
const props = defineProps<DateRangePickerCloseProps>()
</script>

<template>
  <PopoverClose v-bind="props">
    <slot />
  </PopoverClose>
</template>
