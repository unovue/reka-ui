<script lang="ts">
import type { DateRangeType } from './DateRangeFieldRoot.vue'
import type { PrimitiveProps } from '@/Primitive'
import type { SegmentPart } from '@/shared/date'
import { Primitive } from '@/Primitive'
import { injectDateRangeFieldRootContext } from './DateRangeFieldRoot.vue'
import { createDateRangeFieldInputSurface } from './useDateRangeField'

export interface DateRangeFieldInputProps extends PrimitiveProps {
  /** The part of the date to render */
  part: SegmentPart
  /** The type of field to render (start or end) */
  type: DateRangeType
}
</script>

<script setup lang="ts">
import { h, useSlots } from 'vue'
import { useForwardElement } from '@/shared'

const props = defineProps<DateRangeFieldInputProps>()

const rootContext = injectDateRangeFieldRootContext()

// Once per segment: the surface holds this segment's typing state.
const input = createDateRangeFieldInputSurface(rootContext, () => props.part, () => props.type)

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
const slots = useSlots()

// The slot content goes straight into the element: no `<slot>` fragment, so
// no empty anchor text nodes (this part renders once per segment).
function renderRoot() {
  return h(Primitive, { ref: forwardRef, as: props.as, asChild: props.asChild, ...input.attrs.value }, slots)
}
</script>

<template>
  <component :is="renderRoot()" />
</template>
