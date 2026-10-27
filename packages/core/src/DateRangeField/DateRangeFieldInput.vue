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
import { useForwardElement } from '@/shared'

const props = defineProps<DateRangeFieldInputProps>()

const rootContext = injectDateRangeFieldRootContext()

// Once per segment: the surface holds this segment's typing state.
const input = createDateRangeFieldInputSurface(rootContext, () => props.part, () => props.type)

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
