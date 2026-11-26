<script lang="ts">
import type { Ref } from 'vue'
import type { DataOrientation, Direction } from '../shared/types'
import type { StepperChangeReason } from './useStepper'
import type { PrimitiveProps } from '@/Primitive'
import type { BaseChangeReason, ChangeEventDetails } from '@/shared'
import { Primitive } from '@/Primitive'
import { createRekaContext, mergeExpose, useDirection, useForwardElement, useTranslations } from '@/shared'
import { useStepper } from './useStepper'

export interface StepperRootContext {
  /** Read-only: call `changeModelValue` to change the step. */
  modelValue: Readonly<Ref<number | undefined>>
  /** Returns `false` when the step is unchanged or the change was cancelled. */
  changeModelValue: (value: number, reason?: StepperChangeReason | BaseChangeReason, event?: Event) => boolean
  orientation: Ref<DataOrientation>
  dir: Ref<Direction>
  linear: Ref<boolean>
  totalStepperItems: Ref<Set<HTMLElement>>
  /**
   * The item's own `disabled` state for each registered trigger, read by
   * `goToStep` at call time. A trigger registered without an entry falls back
   * to its rendered `disabled` attribute.
   */
  itemDisabled: WeakMap<HTMLElement, () => boolean>
  /** The step each registered trigger belongs to, which the announcement reads in DOM order. */
  stepperItemValues: Map<HTMLElement, () => number>
}

export interface StepperRootProps extends PrimitiveProps {
  /**
   * The value of the step that should be active when initially rendered. Use when you do not need to control the state of the steps.
   */
  defaultValue?: number
  /**
   * The orientation the steps are laid out.
   * Mainly so arrow navigation is done accordingly (left & right vs. up & down).
   * @defaultValue horizontal
   */
  orientation?: DataOrientation
  /**
   * The reading direction of the combobox when applicable. <br> If omitted, inherits globally from `ConfigProvider` or assumes LTR (left-to-right) reading mode.
   */
  dir?: Direction
  /** The controlled value of the step to activate. Can be bound as `v-model`. */
  modelValue?: number
  /** Whether or not the steps must be completed in order. */
  linear?: boolean
  /** Customize the live announcement using the active step's one-based position and total. Set to `false` to disable the built-in live region. */
  announce?: ((step: number, total: number) => string) | false
}
export type StepperRootEmits = {
  /** Event handler called before the step changes; call `details.cancel()` to keep the current step. */
  'beforeUpdate:modelValue': [payload: number | undefined, details: ChangeEventDetails<StepperChangeReason>]
  /** Event handler called when the value changes */
  'update:modelValue': [payload: number | undefined, details: ChangeEventDetails<StepperChangeReason>]
}

export const [injectStepperRootContext, provideStepperRootContext]
  = createRekaContext<StepperRootContext>('StepperRoot')
</script>

<script setup lang="ts">
import { useMutationObserver } from '@vueuse/core'
import { ref, watchPostEffect } from 'vue'

const props = withDefaults(defineProps<StepperRootProps>(), {
  orientation: 'horizontal',
  linear: true,
  defaultValue: 1,
  announce: undefined,
})
const emits = defineEmits<StepperRootEmits>()

defineSlots<{
  default?: (props: {
    /** Current step */
    modelValue: number | undefined
    /** Total number of steps */
    totalSteps: number
    /** Whether or not the next step is disabled */
    isNextDisabled: boolean
    /** Whether or not the previous step is disabled */
    isPrevDisabled: boolean
    /** Whether or not the first step is active */
    isFirstStep: boolean
    /** Whether or not the last step is active */
    isLastStep: boolean
    /** Go to a specific step */
    goToStep: (step: number) => boolean
    /** Go to the next step */
    nextStep: () => boolean
    /** Go to the previous step */
    prevStep: () => boolean
    /** Whether or not there is a next step */
    hasNext: () => boolean
    /** Whether or not there is a previous step */
    hasPrev: () => boolean
  }) => any
}>()

// `dir` resolution (ConfigProvider-aware) stays in the shell; the composable
// owns the step model (`useControllableState`), the step navigation and the
// next/previous-trigger watchers.
const dir = useDirection(() => props.dir)
const t = useTranslations()

const {
  modelValue,
  totalSteps,
  isFirstStep,
  isLastStep,
  isNextDisabled,
  isPrevDisabled,
  goToStep,
  nextStep,
  prevStep,
  hasNext,
  hasPrev,
  root,
  context,
} = useStepper({
  modelValue: () => props.modelValue,
  defaultValue: props.defaultValue,
  orientation: () => props.orientation,
  dir,
  linear: () => props.linear,
  translate: t,
  emit: emits,
})

provideStepperRootContext(context)

const { forwardRef, currentElement, expose } = useForwardElement()

// Announce the current step by its position among the rendered steps, not by its value.
const announcement = ref('')
function updateAnnouncement() {
  const orderedItems = [...context.totalStepperItems.value]
    .sort((a, b) => a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1)
  const step = orderedItems.findIndex(item => context.stepperItemValues.get(item)?.() === modelValue.value) + 1
  if (!step || props.announce === false) {
    announcement.value = ''
    return
  }
  // Anything that is not a function (e.g. a bare `announce` attribute cast to `true`) uses the default text.
  const custom = typeof props.announce === 'function' ? props.announce(step, orderedItems.length) : undefined
  announcement.value = custom ?? t('stepperAnnouncement', { step, total: orderedItems.length })
}
watchPostEffect(updateAnnouncement)
// Keyed moves inside nested components do not update the root or registration set.
useMutationObserver(currentElement, updateAnnouncement, { childList: true, subtree: true })

defineExpose(mergeExpose(expose, {
  goToStep,
  nextStep,
  prevStep,
  modelValue,
  totalSteps,
  isNextDisabled,
  isPrevDisabled,
  isFirstStep,
  isLastStep,
  hasNext,
  hasPrev,
}))
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
    v-bind="root.attrs.value"
  >
    <slot
      :model-value="modelValue"
      :total-steps="totalSteps"
      :is-next-disabled="isNextDisabled"
      :is-prev-disabled="isPrevDisabled"
      :is-first-step="isFirstStep"
      :is-last-step="isLastStep"
      :go-to-step="goToStep"
      :next-step="nextStep"
      :prev-step="prevStep"
      :has-next="hasNext"
      :has-prev="hasPrev"
    />

    <div
      v-if="announce !== false"
      aria-live="polite"
      aria-atomic="true"
      role="status"
      :style="{
        transform: 'translateX(-100%)',
        position: 'absolute',
        pointerEvents: 'none',
        opacity: 0,
        margin: 0,
      }"
    >
      {{ announcement }}
    </div>
  </Primitive>
</template>
