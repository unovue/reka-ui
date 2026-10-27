<script lang="ts">
import type { DateFieldInputProps } from '..'
import { DateFieldInput } from '..'

export interface DatePickerInputProps extends DateFieldInputProps {}
</script>

<script setup lang="ts">
import { useForwardElement } from '@/shared'

const props = defineProps<DatePickerInputProps>()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <DateFieldInput
    :ref="forwardRef"
    v-bind="props"
  >
    <slot />
  </DateFieldInput>
</template>
