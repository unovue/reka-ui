<script lang="ts">
import type { CalendarHeaderProps } from '..'
import { CalendarHeader } from '..'

export interface DatePickerHeaderProps extends CalendarHeaderProps {}
</script>

<script setup lang="ts">
import { useForwardElement } from '@/shared'

const props = defineProps<DatePickerHeaderProps>()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <CalendarHeader
    :ref="forwardRef"
    v-bind="props"
  >
    <slot />
  </CalendarHeader>
</template>
