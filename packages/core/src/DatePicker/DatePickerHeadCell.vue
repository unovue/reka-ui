<script lang="ts">
import type { CalendarHeadCellProps } from '..'
import { CalendarHeadCell } from '..'

export interface DatePickerHeadCellProps extends CalendarHeadCellProps {}
</script>

<script setup lang="ts">
import { useForwardElement } from '@/shared'

const props = defineProps<DatePickerHeadCellProps>()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <CalendarHeadCell
    :ref="forwardRef"
    v-bind="props"
  >
    <slot />
  </CalendarHeadCell>
</template>
