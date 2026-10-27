<script lang="ts">
import type { Ref } from 'vue'

import type { PrimitiveProps } from '@/Primitive'
import { Primitive } from '@/Primitive'
import { createContext, useForwardElement, useId } from '@/shared'
import { injectStepperRootContext } from './StepperRoot.vue'
import { getStepperItemContext, getStepperItemSurface } from './useStepper'

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
  step: Readonly<Ref<number>>
  state: Readonly<Ref<StepperState>>
  disabled: Readonly<Ref<boolean>>
  isFocusable: Readonly<Ref<boolean>>
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

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)

const rootContext = injectStepperRootContext()

// `useId` (SSR-stable ids) stays in the shell; state, focusability and the
// rendered attrs come from the shared builders (single source with `useStepper().getItem`).
const itemContext = getStepperItemContext(rootContext, {
  step: () => props.step,
  disabled: () => props.disabled,
  completed: () => props.completed,
  titleId: useId(undefined, 'reka-stepper-item-title'),
  descriptionId: useId(undefined, 'reka-stepper-item-description'),
})
const surface = getStepperItemSurface(rootContext, itemContext)
const itemState = itemContext.state

provideStepperItemContext(itemContext)
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
    v-bind="surface.attrs.value"
  >
    <slot :state="itemState" />
  </Primitive>
</template>
