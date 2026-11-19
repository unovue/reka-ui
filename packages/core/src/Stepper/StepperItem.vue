<script lang="ts">
import type { Ref } from 'vue'

import type { PrimitiveProps } from '@/Primitive'
import { computed, ref, toRefs } from 'vue'
import { Primitive } from '@/Primitive'
import { createContext, useForwardExpose, useId } from '@/shared'
import { injectStepperRootContext } from './StepperRoot.vue'

export const [injectStepperItemContext, provideStepperItemContext] = createContext<StepperItemContext>('StepperItem')

export type StepperState = 'completed' | 'active' | 'inactive'

export interface StepperItemContext {
  titleId: string
  descriptionId: string
  /** Whether a `StepperTitle` is rendered for this item. */
  hasTitle: Ref<boolean>
  /** Whether a `StepperDescription` is rendered for this item. */
  hasDescription: Ref<boolean>
  step: Ref<number>
  state: Ref<StepperState>
  /** Whether this is the current step (`step` equals the root value), whatever its `completed` state. */
  isCurrent: Ref<boolean>
  disabled: Ref<boolean>
  isFocusable: Ref<boolean>
}

export interface StepperItemProps extends PrimitiveProps {
  /** A unique value that associates the stepper item with an index */
  step: number
  /** When `true`, prevents the user from interacting with the step. */
  disabled?: boolean
  /** Shows whether the step is completed. */
  completed?: boolean
}
</script>

<script setup lang="ts">
const props = withDefaults(defineProps<StepperItemProps>(), {
  completed: false,
  disabled: false,
})

defineSlots<{
  default?: (props: {
    /** The current state of the stepper item */
    state: StepperState
  }) => any
}>()

const { disabled, step, completed } = toRefs(props)

const { forwardRef } = useForwardExpose()

const rootContext = injectStepperRootContext()

const titleId = useId(undefined, 'reka-stepper-item-title')
const descriptionId = useId(undefined, 'reka-stepper-item-description')

const itemState = computed(() => {
  if (completed.value)
    return 'completed'
  if (rootContext.modelValue.value === step.value)
    return 'active'
  if (rootContext.modelValue.value! > step.value)
    return 'completed'
  return 'inactive'
})

const isCurrent = computed(() => rootContext.modelValue.value === step.value)

const isFocusable = computed(() => {
  if (disabled.value)
    return false
  if (rootContext.linear.value)
    return step.value <= rootContext.modelValue.value! || step.value === rootContext.modelValue.value! + 1

  return true
})

const hasTitle = ref(false)
const hasDescription = ref(false)

provideStepperItemContext({
  titleId,
  descriptionId,
  hasTitle,
  hasDescription,
  state: itemState,
  isCurrent,
  disabled,
  step,
  isFocusable,
})
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
    :aria-current="isCurrent ? 'true' : undefined"
    :data-state="itemState"
    :disabled="disabled || !isFocusable ? '' : undefined"
    :data-disabled="disabled || !isFocusable ? '' : undefined"
    :data-orientation="rootContext.orientation.value"
  >
    <slot :state="itemState" />
  </Primitive>
</template>
