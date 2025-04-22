<script lang="ts">
import type { PopoverContentEmits, PopoverContentProps } from '..'
import { PopoverContent, PopoverPortal, useForwardPropsEmits } from '..'

export interface DateRangePickerContentProps extends PopoverContentProps {}
export interface DateRangePickerContentEmits extends PopoverContentEmits {}
</script>

<script setup lang="ts">
const props = defineProps<DateRangePickerContentProps>()
const emits = defineEmits<DateRangePickerContentEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <PopoverPortal>
    <PopoverContent
      v-bind="{ ...forwarded, ...$attrs }"
    >
      <slot />
    </PopoverContent>
  </PopoverPortal>
</template>
