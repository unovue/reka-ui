<script lang="ts">
import type { ComputedRef, Ref } from 'vue'
import type { DataOrientation, Direction, FormFieldProps } from '../shared/types'
import type { SliderChangeReason } from './useSlider'
import type { PrimitiveProps } from '@/Primitive'
import type { ChangeEventDetails } from '@/shared'
import { useCollection } from '@/Collection'
import { createContext, useDirection, useFormControl, useForwardElement } from '@/shared'

type ThumbAlignment = 'contain' | 'overflow'

export interface SliderRootProps extends PrimitiveProps, FormFieldProps {
  /** The value of the slider when initially rendered. Use when you do not need to control the state of the slider. */
  defaultValue?: number[]
  /** The controlled value of the slider. Can be bind as `v-model`. */
  modelValue?: number[] | null
  /** When `true`, prevents the user from interacting with the slider. */
  disabled?: boolean
  /** The orientation of the slider. */
  orientation?: DataOrientation
  /** The reading direction of the combobox when applicable. <br> If omitted, inherits globally from `ConfigProvider` or assumes LTR (left-to-right) reading mode. */
  dir?: Direction
  /** Whether the slider is visually inverted. */
  inverted?: boolean
  /** The minimum value for the range. */
  min?: number
  /** The maximum value for the range. */
  max?: number
  /** The stepping interval. */
  step?: number
  /** The minimum permitted steps between multiple thumbs. */
  minStepsBetweenThumbs?: number
  /**
   * The alignment of the slider thumb.
   * - `contain`: thumbs will be contained within the bounds of the track.
   * - `overflow`: thumbs will not be bound by the track. No extra offset will be added.
   * @defaultValue 'contain'
   */
  thumbAlignment?: ThumbAlignment
}

export type SliderRootEmits = {
  /** Event handler called before the slider value changes; `details.cancel()` vetoes the change. */
  'beforeUpdate:modelValue': [payload: number[] | undefined, details: ChangeEventDetails<SliderChangeReason>]
  /**
   * Event handler called when the slider value changes
   */
  'update:modelValue': [payload: number[] | undefined, details: ChangeEventDetails<SliderChangeReason>]
  /**
   * Event handler called when the value changes at the end of an interaction.
   *
   * Useful when you only need to capture a final value e.g. to update a backend service.
   */
  'valueCommit': [payload: number[]]
}

export interface SliderRootContext {
  orientation: Ref<DataOrientation>
  disabled: Ref<boolean>
  min: Ref<number>
  max: Ref<number>
  modelValue?: Readonly<Ref<number[] | null | undefined>>
  currentModelValue: ComputedRef<number[]>
  valueIndexToChangeRef: Ref<number>
  thumbElements: Ref<HTMLElement[]>
  thumbAlignment: Ref<ThumbAlignment>
}

export const [injectSliderRootContext, provideSliderRootContext]
  = createContext<SliderRootContext>('SliderRoot')
</script>

<script setup lang="ts">
import { computed, mergeProps, toRefs } from 'vue'
import { VisuallyHiddenInput } from '@/VisuallyHidden'
import SliderHorizontal from './SliderHorizontal.vue'
import SliderVertical from './SliderVertical.vue'
import { useSlider } from './useSlider'
import { provideSliderOrientationContext } from './utils'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<SliderRootProps>(), {
  min: 0,
  max: 100,
  step: 1,
  orientation: 'horizontal',
  disabled: false,
  minStepsBetweenThumbs: 0,
  defaultValue: () => [0],
  inverted: false,
  thumbAlignment: 'contain',
  as: 'span',
})
const emits = defineEmits<SliderRootEmits>()

defineSlots<{
  default?: (props: {
    /** Current slider values */
    modelValue: typeof modelValue.value
  }) => any
}>()

const { dir: propDir } = toRefs(props)
const dir = useDirection(propDir)
const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)
const isFormControl = useFormControl(currentElement)

const { CollectionSlot } = useCollection({ isProvider: true })

// Controlled/uncontrolled + `beforeUpdate:` / `update:` / `valueCommit` emits
// live in the composable (`modelValue === undefined` → uncontrolled).
const { modelValue, root, orientation: orientationGeometry, startSlide, moveSlide, endSlide, context } = useSlider({
  modelValue: () => props.modelValue,
  defaultValue: props.defaultValue,
  disabled: () => props.disabled,
  orientation: () => props.orientation,
  dir,
  inverted: () => props.inverted,
  min: () => props.min,
  max: () => props.max,
  step: () => props.step,
  minStepsBetweenThumbs: () => props.minStepsBetweenThumbs,
  thumbAlignment: () => props.thumbAlignment,
  emit: emits,
})

provideSliderRootContext(context)
provideSliderOrientationContext(orientationGeometry)

// Listener order is part of the v2 contract: the slider's own keydown handler
// runs before a consumer `@keydown`, and its pointerdown bookkeeping runs after
// a consumer `@pointerdown`; component attributes win over consumer ones.
// `mergeProps` chains same-named listeners in argument order.
const keydownAttrs = computed(() => ({ onKeydown: root.props.value.onKeydown }))
const rootAttrs = computed(() => {
  const { onKeydown: _onKeydown, onPointerdown: _onPointerdown, ...attrs } = root.attrs.value
  return attrs
})
</script>

<template>
  <CollectionSlot>
    <component
      :is="orientation === 'horizontal' ? SliderHorizontal : SliderVertical"
      v-bind="mergeProps(keydownAttrs, $attrs, rootAttrs)"
      :ref="forwardRef"
      :as-child="asChild"
      :as="as"
      :min="min"
      :max="max"
      :inverted="inverted"
      @pointerdown="root.props.value.onPointerdown"
      @slide-start="(value: number, event: PointerEvent) => startSlide(value, event)"
      @slide-move="(value: number, event: PointerEvent) => moveSlide(value, event)"
      @slide-end="endSlide()"
    >
      <slot :model-value="modelValue" />

      <VisuallyHiddenInput
        v-if="isFormControl && name"
        type="number"
        :value="modelValue"
        :name="name"
        :required="required"
        :disabled="disabled"
        :step="step"
      />
    </component>
  </CollectionSlot>
</template>
