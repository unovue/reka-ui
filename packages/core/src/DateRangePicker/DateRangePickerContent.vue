<script lang="ts">
import type { PopoverContentEmits, PopoverContentProps, PopoverPortalProps } from '..'
import { computed } from 'vue'
import { PopoverContent, PopoverPortal, useForwardPropsEmits } from '..'

export interface DateRangePickerContentProps extends PopoverContentProps {
  portal?: PopoverPortalProps
}
export interface DateRangePickerContentEmits extends PopoverContentEmits {}
</script>

<script setup lang="ts">
const props = defineProps<DateRangePickerContentProps>()
const emits = defineEmits<DateRangePickerContentEmits>()

const propsToForward = computed(() => ({
  ...props,
  portal: undefined,
}))
const forwarded = useForwardPropsEmits(propsToForward, emits)
</script>

<template>
  <PopoverPortal v-bind="portal">
    <PopoverContent
      v-bind="{ ...forwarded, ...$attrs }"
    >
      <slot />
    </PopoverContent>
  </PopoverPortal>
</template>
