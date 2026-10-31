<script lang="ts">
import type { DateRangeType } from '@/DateRangeField/DateRangeFieldRoot.vue'
import type { PrimitiveProps } from '@/Primitive'
import type { SegmentPart } from '@/shared/date'
import { Primitive } from '@/Primitive'
import { renderAs } from '@/Primitive/renderAs'
import { injectTimeRangeFieldRootContext } from './TimeRangeFieldRoot.vue'
import { createTimeRangeFieldInputSurface } from './useTimeRangeField'

export interface TimeRangeFieldInputProps extends PrimitiveProps {
  /** The part of the date to render */
  part: SegmentPart
  /** The type of field to render (start or end) */
  type: DateRangeType
}
</script>

<script setup lang="ts">
import type { Component } from 'vue'
import { h, useSlots } from 'vue'
import { useForwardElement } from '@/shared'

const props = defineProps<TimeRangeFieldInputProps>()

const rootContext = injectTimeRangeFieldRootContext()

// Once per segment: the surface holds this segment's typing state.
const input = createTimeRangeFieldInputSurface(rootContext, () => props.part, () => props.type)

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
const slots = useSlots()

// The slot content goes straight into the element: no `<slot>` fragment, so
// no empty anchor text nodes (this part renders once per segment).
function renderRoot() {
  // `Primitive` only for a consumer's `#render`, which it honours; `slots` hold it.
  return slots.render
    ? h(Primitive, { ref: forwardRef, as: props.as, asChild: props.asChild, ...input.attrs.value }, slots)
    : h(renderAs(props.as, props.asChild) as Component, { ref: forwardRef, ...input.attrs.value }, slots)
}
</script>

<template>
  <component :is="renderRoot()" />
</template>
