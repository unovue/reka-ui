<script lang="ts">
import type { ComputedRef, Ref } from 'vue'
import type { RatingChangeReason } from './useRating'
import type { RadioGroupRootProps } from '@/RadioGroup'
import type { BaseChangeReason, ChangeEventDetails } from '@/shared'
import { reactiveOmit } from '@vueuse/core'
import { RadioGroupRoot } from '@/RadioGroup'
import { createContext, useForwardElement } from '@/shared'

export interface RatingRootContext {
  /** Read-only; write through `changeModelValue`. */
  modelValue: Readonly<Ref<number>>
  items: ComputedRef<number[]>
  hoveredRating: Ref<number>
  disabled: Readonly<Ref<boolean>>
  step: Readonly<Ref<number>>
  /** Returns `false` when disabled, unchanged or cancelled. */
  changeModelValue: (rating: number, reason?: RatingChangeReason | BaseChangeReason, event?: Event) => boolean
  changeHoveredRating: (rating: number) => void
}

export interface RatingRootProps extends Omit<RadioGroupRootProps, 'modelValue' | 'defaultValue'> {
  /**
   * The rating value when initially rendered. Use when you do not need to control the state of the rating.
   */
  defaultValue?: number
  /** The controlled rating value. Can be bound with `v-model`. */
  modelValue?: number
  /** The number of rating items to render. */
  length?: number
  /** When `true`, clicking the currently selected rating resets the value to `0`. */
  clearable?: boolean
  /** When `true`, the rating previews the value under the pointer on hover. */
  hoverable?: boolean
  /** The granularity each rating item is divided into. */
  step?: 1 | 0.5 | 0.25 | 0.1
}
export type RatingRootEmits = {
  /** Event handler called before the value changes; `details.cancel()` vetoes the change. */
  'beforeUpdate:modelValue': [payload: number, details: ChangeEventDetails<RatingChangeReason>]
  /** Event handler called when the value changes */
  'update:modelValue': [payload: number, details: ChangeEventDetails<RatingChangeReason>]
}

export const [injectRatingRootContext, provideRatingRootContext]
  = createContext<RatingRootContext>('RatingRoot')
</script>

<script setup lang="ts">
import { useRating } from './useRating'

const props = withDefaults(defineProps<RatingRootProps>(), {
  orientation: 'horizontal',
  length: 5,
  step: 1,
})
const emits = defineEmits<RatingRootEmits>()

defineSlots<{
  default?: (props: {
    modelValue: number | undefined
    items: number[]
  }) => any
}>()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)

const { modelValue, items, root, context } = useRating({
  modelValue: () => props.modelValue,
  defaultValue: props.defaultValue,
  length: () => props.length,
  step: () => props.step,
  disabled: () => props.disabled,
  clearable: () => props.clearable,
  hoverable: () => props.hoverable,
  emit: emits,
})

provideRatingRootContext(context)

const radioGroupProps = reactiveOmit(props, 'length', 'clearable', 'hoverable', 'step', 'modelValue', 'defaultValue')
</script>

<template>
  <!--
    The radio group mirrors the rating's model (`null` while unset, so it is
    controlled from the start): a cancelled or cleared rating never leaves a
    radio checked on its own.
  -->
  <RadioGroupRoot
    :ref="forwardRef"
    v-bind="radioGroupProps"
    :model-value="modelValue ?? null"
    :disabled="disabled"
    @mouseleave="root.props.value.onMouseleave"
  >
    <slot
      :items="items"
      :model-value="modelValue"
    />
  </RadioGroupRoot>
</template>
