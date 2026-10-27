<script lang="ts">
import type { DateRangeFieldInputProps } from '..'
import { DateRangeFieldInput } from '..'

export interface DateRangePickerInputProps extends DateRangeFieldInputProps {}
</script>

<script setup lang="ts">
import { useForwardElement } from '@/shared'

const props = defineProps<DateRangePickerInputProps>()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <DateRangeFieldInput
    :ref="forwardRef"
    v-bind="props"
  >
    <slot />
  </DateRangeFieldInput>
</template>
