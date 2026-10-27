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
  'beforeUpdate:modelValue': [payload: number[], details: ChangeEventDetails<SliderChangeReason>]
  /**
   * Event handler called when the slider value changes
   */
  'update:modelValue': [payload: number[], details: ChangeEventDetails<SliderChangeReason>]
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
    modelValue: number[] | null
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

// Precedence is part of the v2 contract. `mergeProps` chains same-named
// listeners in argument order and lets later plain attributes win, so:
// - leading (before `$attrs`): the slider's own keydown handler runs before a
//   consumer `@keydown`; the orientation's `style`
//   (`--reka-slider-thumb-transform`) and `data-orientation` were set by
//   SliderHorizontal / SliderVertical in v2, under the root's fall-through
//   attributes, so a consumer `style` / `data-orientation` still wins;
// - trailing (after `$attrs`): `aria-disabled`, `data-disabled` and `dir` were
//   bound by SliderRoot after `v-bind="$attrs"`, so the component wins;
// - the pointerdown bookkeeping is bound with `@pointerdown`, after a consumer's.
const leadingAttrs = computed(() => {
  const { onKeydown, style, 'data-orientation': dataOrientation } = root.attrs.value
  return { onKeydown, style, 'data-orientation': dataOrientation }
})
const rootAttrs = computed(() => {
  const { onKeydown: _onKeydown, onPointerdown: _onPointerdown, style: _style, 'data-orientation': _dataOrientation, ...attrs } = root.attrs.value
  return attrs
})
</script>

<template>
  <CollectionSlot>
    <component
      :is="orientation === 'horizontal' ? SliderHorizontal : SliderVertical"
      v-bind="mergeProps(leadingAttrs, $attrs, rootAttrs)"
      :ref="forwardRef"
      :as-child="asChild"
      :as="as"
      :min="min"
      :max="max"
      @pointerdown="root.props.value.onPointerdown"
      @slide-start="(value: number, event: PointerEvent) => startSlide(value, event)"
      @slide-move="(value: number, event: PointerEvent) => moveSlide(value, event)"
      @slide-end="endSlide()"
    >
      <slot :model-value="modelValue ?? null" />

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
