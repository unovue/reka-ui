<script lang="ts">
import type { PopoverCloseProps } from '@/Popover'
import { PopoverClose } from '@/Popover'

export interface DateRangePickerCloseProps extends PopoverCloseProps {}
</script>

<script setup lang="ts">
import { useForwardElement } from '@/shared'

const props = defineProps<DateRangePickerCloseProps>()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <PopoverClose
    :ref="forwardRef"
    v-bind="props"
  >
    <slot />
  </PopoverClose>
</template>
