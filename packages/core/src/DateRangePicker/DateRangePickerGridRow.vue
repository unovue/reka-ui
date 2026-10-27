<script lang="ts">
import type { RangeCalendarGridRowProps } from '..'
import { RangeCalendarGridRow } from '..'

export interface DateRangePickerGridRowProps extends RangeCalendarGridRowProps {}
</script>

<script setup lang="ts">
import { useForwardElement } from '@/shared'

const props = defineProps<DateRangePickerGridRowProps>()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <RangeCalendarGridRow
    :ref="forwardRef"
    v-bind="props"
  >
    <slot />
  </RangeCalendarGridRow>
</template>
