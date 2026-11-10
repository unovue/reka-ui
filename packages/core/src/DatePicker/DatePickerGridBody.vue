<script lang="ts">
import type { CalendarGridBodyProps } from '@/Calendar'
import { CalendarGridBody } from '@/Calendar'

export interface DatePickerGridBodyProps extends CalendarGridBodyProps {}
</script>

<script setup lang="ts">
import { useForwardElement } from '@/shared'

const props = defineProps<DatePickerGridBodyProps>()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <CalendarGridBody
    :ref="forwardRef"
    v-bind="props"
  >
    <slot />
  </CalendarGridBody>
</template>
