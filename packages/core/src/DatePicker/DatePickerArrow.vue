<script lang="ts">
import type { PopoverArrowProps } from '..'
import { PopoverArrow } from '..'

export interface DatePickerArrowProps extends PopoverArrowProps {}

export default {
  compatConfig: {
    MODE: 3,
  },
}
</script>

<script setup lang="ts">
const props = defineProps<DatePickerArrowProps>()
</script>

<template>
  <PopoverArrow v-bind="props">
    <slot />
  </PopoverArrow>
</template>
