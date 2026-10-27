<script lang="ts">
import type { CalendarGridHeadProps } from '..'
import { CalendarGridHead } from '..'

export interface DatePickerGridHeadProps extends CalendarGridHeadProps {}
</script>

<script setup lang="ts">
import { useForwardElement } from '@/shared'

const props = defineProps<DatePickerGridHeadProps>()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <CalendarGridHead
    :ref="forwardRef"
    v-bind="props"
  >
    <slot />
  </CalendarGridHead>
</template>
