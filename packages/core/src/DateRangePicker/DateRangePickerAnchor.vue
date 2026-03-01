<script lang="ts">
import type { PopoverAnchorProps } from '..'
import { PopoverAnchor } from '..'

export interface DateRangePickerAnchorProps extends PopoverAnchorProps {}

export default {
  compatConfig: {
    MODE: 3,
  },
}
</script>

<script setup lang="ts">
const props = defineProps<DateRangePickerAnchorProps>()
</script>

<template>
  <PopoverAnchor v-bind="props">
    <slot />
  </PopoverAnchor>
</template>
