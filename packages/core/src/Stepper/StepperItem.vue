<script lang="ts">
import type { Ref } from 'vue'

import type { PrimitiveProps } from '@/Primitive'
import { computed, toRefs } from 'vue'
import { Primitive } from '@/Primitive'
import { createContext, useForwardExpose, useId } from '@/shared'
import { injectStepperRootContext } from './StepperRoot.vue'

export const [injectStepperItemContext, provideStepperItemContext] = createContext<StepperItemContext>('StepperItem')

/**
 * Stepper is one of the multi-value `data-state` machines grandfathered by
 * #2823: a step is `completed`, `current` or `upcoming`, which neither of the
 * two normalised axes (`open` / `closed`, `checked` / `unchecked`) can express.
 * The v2 words `active` / `inactive` were dropped because they read as
 * synonyms of the axis words and collided with Tabs' old `active` / `inactive`
 * (now `checked` / `unchecked`).
 */
export type StepperState = 'completed' | 'current' | 'upcoming'

export interface StepperItemContext {
  titleId: string
  descriptionId: string
  step: Ref<number>
  state: Ref<StepperState>
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
    /** The state of the stepper item: `completed`, `current` or `upcoming` */
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
    return 'current'
  if (rootContext.modelValue.value! > step.value)
    return 'completed'
  return 'upcoming'
})

const isFocusable = computed(() => {
  if (disabled.value)
    return false
  if (rootContext.linear.value)
    return step.value <= rootContext.modelValue.value! || step.value === rootContext.modelValue.value! + 1

  return true
})

provideStepperItemContext({
  titleId,
  descriptionId,
  state: itemState,
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
    :aria-current="itemState === 'current' ? 'true' : undefined"
    :data-state="itemState"
    :disabled="disabled || !isFocusable ? '' : undefined"
    :data-disabled="disabled || !isFocusable ? '' : undefined"
    :data-orientation="rootContext.orientation.value"
  >
    <slot :state="itemState" />
  </Primitive>
</template>
