<script lang="ts">
import type { PopoverArrowProps } from '@/Popover'
import { PopoverArrow } from '@/Popover'

export interface DateRangePickerArrowProps extends PopoverArrowProps {}
</script>

<script setup lang="ts">
import { useForwardElement } from '@/shared'

const props = defineProps<DateRangePickerArrowProps>()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <PopoverArrow
    :ref="forwardRef"
    v-bind="props"
  >
    <slot />
  </PopoverArrow>
</template>
