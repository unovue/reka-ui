<script lang="ts">
import type { DateRangeFieldInputProps } from '@/DateRangeField'
import { DateRangeFieldInput } from '@/DateRangeField'

export interface DateRangePickerInputProps extends DateRangeFieldInputProps {}
</script>

<script setup lang="ts">
import { h, useSlots } from 'vue'
import { useForwardElement } from '@/shared'

const props = defineProps<DateRangePickerInputProps>()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
const slots = useSlots()

// The slot content goes straight into the element: no `<slot>` fragment, so
// no empty anchor text nodes (this part renders once per segment).
function renderRoot() {
  return h(DateRangeFieldInput, { ref: forwardRef, ...props }, slots)
}
</script>

<template>
  <component :is="renderRoot()" />
</template>
