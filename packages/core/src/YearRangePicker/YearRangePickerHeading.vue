<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface YearRangePickerHeadingProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { useForwardExpose, useReferencedId } from '@/shared'
import { injectYearRangePickerRootContext } from './YearRangePickerRoot.vue'

const props = withDefaults(defineProps<YearRangePickerHeadingProps>(), { as: 'div' })

defineSlots<{
  default?: (props: {
    /** Current year range heading */
    headingValue: string
  }) => any
}>()

const rootContext = injectYearRangePickerRootContext()
const { forwardRef, currentElement } = useForwardExpose()
useReferencedId(rootContext, 'headingId', currentElement)
</script>

<template>
  <Primitive
    v-bind="props"
    :id="rootContext.headingId"
    :ref="forwardRef"
    role="heading"
    aria-level="2"
    :data-disabled="rootContext.disabled.value ? '' : undefined"
  >
    <slot :heading-value="rootContext.headingValue.value">
      {{ rootContext.headingValue.value }}
    </slot>
  </Primitive>
</template>
