<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import type { SegmentPart } from '@/shared/date'
import { Primitive } from '@/Primitive'
import { injectTimeFieldRootContext } from './TimeFieldRoot.vue'
import { createTimeFieldInputSurface } from './useTimeField'

export interface TimeFieldInputProps extends PrimitiveProps {
  /** The part of the date to render */
  part: SegmentPart
}
</script>

<script setup lang="ts">
import { h, useSlots } from 'vue'
import { useForwardElement } from '@/shared'

const props = defineProps<TimeFieldInputProps>()

const rootContext = injectTimeFieldRootContext()

// Once per segment: the surface holds this segment's typing state.
const input = createTimeFieldInputSurface(rootContext, () => props.part)

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
