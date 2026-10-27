<script lang="ts">
import type { RangeCalendarGridHeadProps } from '..'
import { RangeCalendarGridHead } from '..'

export interface DateRangePickerGridHeadProps extends RangeCalendarGridHeadProps {}
</script>

<script setup lang="ts">
import { useForwardElement } from '@/shared'

const props = defineProps<DateRangePickerGridHeadProps>()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <RangeCalendarGridHead
    :ref="forwardRef"
    v-bind="props"
  >
    <slot />
  </RangeCalendarGridHead>
</template>
