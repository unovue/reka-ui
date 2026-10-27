<script lang="ts">
import type { CalendarGridRowProps } from '..'
import { CalendarGridRow } from '..'

export interface DatePickerGridRowProps extends CalendarGridRowProps {}
</script>

<script setup lang="ts">
import { useForwardElement } from '@/shared'

const props = defineProps<DatePickerGridRowProps>()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <CalendarGridRow
    :ref="forwardRef"
    v-bind="props"
  >
    <slot />
  </CalendarGridRow>
</template>
