<script lang="ts">
import type { ComputedRef } from 'vue'
import type { PrimitiveProps } from '@/Primitive'
import { computed } from 'vue'
import { Primitive } from '@/Primitive'
import { createContext, useForwardElement } from '@/shared'
import { injectRatingRootContext } from './RatingRoot.vue'
import { getRatingItemSteps } from './useRating'

interface RatingItemContext {
  steps: ComputedRef<number[]>
}

export interface RatingItemProps extends PrimitiveProps {
  /** The 1-based index of this item within the rating (e.g. the 3rd star). */
  item: number
}

export const [injectRatingItemContext, provideRatingItemContext]
  = createContext<RatingItemContext>('RatingItem')
</script>

<script setup lang="ts">
const props = withDefaults(defineProps<RatingItemProps>(), { as: 'label' })
defineSlots<{
  default?: (props: {
    steps: number[]
  }) => any
}>()

const rootContext = injectRatingRootContext()

const steps = computed(() => getRatingItemSteps(props.item, rootContext.step.value))

provideRatingItemContext({ steps })

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
  >
    <slot :steps="steps" />
  </Primitive>
</template>
