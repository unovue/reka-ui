<script lang="ts">
import type { RangeCalendarGridBodyProps } from '..'
import { RangeCalendarGridBody } from '..'

export interface DateRangePickerGridBodyProps extends RangeCalendarGridBodyProps {}
</script>

<script setup lang="ts">
import { useForwardElement } from '@/shared'

const props = defineProps<DateRangePickerGridBodyProps>()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <RangeCalendarGridBody
    :ref="forwardRef"
    v-bind="props"
  >
    <slot />
  </RangeCalendarGridBody>
</template>
