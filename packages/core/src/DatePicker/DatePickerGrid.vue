<script lang="ts">
import type { CalendarGridProps } from '..'
import { CalendarGrid } from '..'

export interface DatePickerGridProps extends CalendarGridProps {}
</script>

<script setup lang="ts">
import { useForwardElement } from '@/shared'

const props = defineProps<DatePickerGridProps>()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <CalendarGrid
    :ref="forwardRef"
    v-bind="props"
  >
    <slot />
  </CalendarGrid>
</template>
