<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { computed } from 'vue'
import { useForwardExpose } from '@/shared'
import { injectRatingRootContext } from './RatingRoot.vue'

export interface RatingGroupProps extends PrimitiveProps {
  group: number
}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'

const props = withDefaults(defineProps<RatingGroupProps>(), { as: 'label' })

defineSlots<{
  default?: (props: {
    items: number[]
  }) => any
}>()

const rootContext = injectRatingRootContext()
useForwardExpose()

const items = computed(() => {
  const groupStartValue = (props.group - 1)
  const groupEndValue = props.group
  const stepSize = rootContext.step.value

  const numberOfSteps = Math.ceil((groupEndValue - groupStartValue) / stepSize)

  return Array.from({ length: numberOfSteps }, (_, index) =>
    Number((groupStartValue + (index + 1) * stepSize).toFixed(2)))
})
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    :style="rootContext.step.value !== 1 ? { position: 'relative' } : undefined"
  >
    <slot :items="items" />
  </Primitive>
</template>
