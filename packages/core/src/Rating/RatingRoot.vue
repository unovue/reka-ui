<script lang="ts">
import type { DataOrientation, Direction, FormFieldProps, StringOrNumber } from '../shared/types'
import type { PrimitiveProps } from '@/Primitive'
import { useVModel } from '@vueuse/core'
import { RadioGroupRoot } from '@/RadioGroup'
import { createContext, useDirection, useForwardExpose } from '@/shared'

export interface RatingRootContext {
  modelValue: Ref<number>
  items: ComputedRef<number[]>
  hoveredRating: Ref<number>
  disabled: Ref<boolean>
  ratingItems: Ref<Set<HTMLElement>>
  dir: ComputedRef<Direction>
  orientation: Ref<DataOrientation>
  step: Ref<number>
  changeModelValue: (rating: number) => void
  changeHoveredRating: (rating: number) => void
}

export interface RatingRootProps extends PrimitiveProps, FormFieldProps {
  /**
   * The value of the tab that should be active when initially rendered. Use when you do not need to control the state of the tabs
   */
  defaultValue?: number
  /** The controlled value of the tab to activate. Can be bind as `v-model`. */
  modelValue?: number
  /**
   * The orientation the rating is laid out.
   * Mainly so arrow navigation is done accordingly (left & right vs. up & down)
   * @defaultValue horizontal
   */
  orientation?: DataOrientation
  /**
   * The reading direction of the rating when applicable. <br> If omitted, inherits globally from `ConfigProvider` or assumes LTR (left-to-right) reading mode.
   */
  dir?: Direction
  id?: string
  disabled?: boolean
  length?: number
  clearable?: boolean
  hoverable?: boolean
  step?: 1 | 0.5 | 0.25 | 0.1

}
export type RatingRootEmits = {
  /** Event handler called when the value changes */
  'update:modelValue': [payload: number]
}

export const [injectRatingRootContext, provideRatingRootContext]
  = createContext<RatingRootContext>('RatingRoot')
</script>

<script setup lang="ts" generic="T extends StringOrNumber = StringOrNumber">
import type { ComputedRef, Ref } from 'vue'
import { computed, ref, toRefs } from 'vue'

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

const { orientation, dir: propDir, length, disabled, clearable, hoverable, step } = toRefs(props)
const dir = useDirection(propDir)
const ratingItems = ref<Set<HTMLElement>>(new Set())
useForwardExpose()

const modelValue = useVModel<RatingRootProps, 'modelValue', 'update:modelValue'>(props, 'modelValue', emits, {
  defaultValue: props.defaultValue,
  passive: (props.modelValue === undefined) as false,
}) as Ref<number>

const items = computed(() => {
  return Array.from({ length: length.value }, (_, i) => i + 1)
})

const hoveredRating = ref<number>(0)

function changeModelValue(rating: number) {
  if (disabled.value)
    return

  if (clearable.value && modelValue.value === rating) {
    hoveredRating.value = 0
    modelValue.value = 0
  }
  else {
    modelValue.value = rating
  }
}

function changeHoveredRating(rating: number) {
  if (disabled.value || !hoverable.value)
    return

  hoveredRating.value = rating
}

provideRatingRootContext({
  modelValue,
  items,
  hoveredRating,
  disabled,
  ratingItems,
  dir,
  orientation,
  step,
  changeModelValue,
  changeHoveredRating,
})
</script>

<template>
  <RadioGroupRoot
    v-bind="props"
    v-model="modelValue"
    :disabled="disabled"
  >
    <slot
      :items="items"
      :model-value="modelValue"
    />
  </RadioGroupRoot>
</template>
