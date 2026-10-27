<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useActiveElement } from '@vueuse/core'
import { RadioGroupIndicator, RadioGroupItem } from '@/RadioGroup'
import { useForwardElement } from '@/shared'
import { injectRatingItemContext } from './RatingItem.vue'
import { injectRatingRootContext } from './RatingRoot.vue'
import { getRatingItemIndicatorSurface } from './useRating'

export interface RatingItemIndicatorProps extends PrimitiveProps {
  /** The step value this indicator represents. */
  step: number
}
</script>

<script setup lang="ts">
const props = defineProps<RatingItemIndicatorProps>()

const rootContext = injectRatingRootContext()
const { currentElement, forwardRef, expose } = useForwardElement()
defineExpose(expose)
const activeElement = useActiveElement()
const itemContext = injectRatingItemContext()

// Same derivation as `useRating().getItemIndicatorSurface` for `data-state`,
// the step CSS variables and the hover preview; the radio semantics come from
// `RadioGroupItem`.
const indicator = getRatingItemIndicatorSurface(rootContext, () => props.step, {
  // `currentElement` is unset on the server and before mount, where `activeElement` can also be `undefined`
  isFocused: () => !!currentElement.value && activeElement.value === currentElement.value,
  steps: () => itemContext.steps.value,
})
</script>

<template>
  <RadioGroupItem
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
    v-bind="indicator.attrs.value"
    :value="step"
    :disabled="rootContext.disabled.value"
    @select="rootContext.changeModelValue(step, 'item-press', $event.detail.originalEvent)"
  >
    <RadioGroupIndicator
      force-mount
      as-child
    >
      <slot />
    </RadioGroupIndicator>
  </RadioGroupItem>
</template>
