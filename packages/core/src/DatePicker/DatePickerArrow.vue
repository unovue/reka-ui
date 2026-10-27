<script lang="ts">
import type { PopoverArrowProps } from '..'
import { PopoverArrow } from '..'

export interface DatePickerArrowProps extends PopoverArrowProps {}
</script>

<script setup lang="ts">
import { useForwardElement } from '@/shared'

const props = defineProps<DatePickerArrowProps>()

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
