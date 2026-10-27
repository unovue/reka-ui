<script lang="ts">
import type { PopoverCloseProps } from '..'
import { PopoverClose } from '..'

export interface DatePickerCloseProps extends PopoverCloseProps {}
</script>

<script setup lang="ts">
import { useForwardElement } from '@/shared'

const props = defineProps<DatePickerCloseProps>()

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
