<script lang="ts">
import type { CalendarCellProps } from '..'
import { CalendarCell } from '..'

export interface DatePickerCellProps extends CalendarCellProps {}
</script>

<script setup lang="ts">
import { useForwardElement } from '@/shared'

const props = defineProps<DatePickerCellProps>()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <CalendarCell
    :ref="forwardRef"
    v-bind="props"
  >
    <slot />
  </CalendarCell>
</template>
