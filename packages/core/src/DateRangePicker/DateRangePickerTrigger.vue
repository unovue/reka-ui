<script lang="ts">
import type { PopoverTriggerProps } from '..'
import { PopoverTrigger } from '..'
import { injectDateRangePickerRootContext } from './DateRangePickerRoot.vue'

export interface DateRangePickerTriggerProps extends Omit<PopoverTriggerProps, 'handle' | 'payload'> {}
</script>

<script setup lang="ts">
import { useForwardElement } from '@/shared'

const props = defineProps<DateRangePickerTriggerProps>()
const rootContext = injectDateRangePickerRootContext()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <PopoverTrigger
    :ref="forwardRef"
    data-reka-date-field-segment="trigger"
    v-bind="props"
    :disabled="rootContext.disabled.value"
    @focusin="(e: FocusEvent) => {
      rootContext.dateFieldRef.value?.setFocusedElement(e.target as HTMLElement)
    }"
  >
    <slot />
  </PopoverTrigger>
</template>
