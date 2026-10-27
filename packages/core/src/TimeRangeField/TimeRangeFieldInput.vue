<script lang="ts">
import type { DateRangeType } from '@/DateRangeField/DateRangeFieldRoot.vue'
import type { PrimitiveProps } from '@/Primitive'
import type { SegmentPart } from '@/shared/date'
import { Primitive } from '@/Primitive'
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
import { useForwardElement } from '@/shared'

const props = defineProps<TimeRangeFieldInputProps>()

const rootContext = injectTimeRangeFieldRootContext()

// Once per segment: the surface holds this segment's typing state.
const input = createTimeRangeFieldInputSurface(rootContext, () => props.part, () => props.type)

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
    v-bind="input.attrs.value"
  >
    <slot />
  </Primitive>
</template>
