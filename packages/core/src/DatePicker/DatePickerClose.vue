<script lang="ts">
import type { PopoverCloseProps } from '..'
import { PopoverClose } from '..'

export interface DatePickerCloseProps extends PopoverCloseProps {}

export default {
  compatConfig: {
    MODE: 3,
  },
}
</script>

<script setup lang="ts">
const props = defineProps<DatePickerCloseProps>()
</script>

<template>
  <PopoverClose v-bind="props">
    <slot />
  </PopoverClose>
</template>
