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
import { useForwardElement } from '@/shared'

const props = defineProps<TimeFieldInputProps>()

const rootContext = injectTimeFieldRootContext()

// Once per segment: the surface holds this segment's typing state.
const input = createTimeFieldInputSurface(rootContext, () => props.part)

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
