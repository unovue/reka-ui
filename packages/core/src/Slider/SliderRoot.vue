<script lang="ts">
import type { ComputedRef, Ref } from 'vue'
import type { DataOrientation, Direction, FormFieldProps } from '../shared/types'
import type { SliderChangeReason } from './useSlider'
import type { PrimitiveProps } from '@/Primitive'
import type { ChangeEventDetails } from '@/shared'
import { useCollection, useCollectionSlot } from '@/Collection'
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
import { computed, getCurrentInstance, mergeProps, useAttrs, watch } from 'vue'
import { useFieldControl } from '@/Field/useFieldControl'
import { useFieldFocusWithin } from '@/Field/useFieldFocusWithin'
import { renderAs } from '@/Primitive/renderAs'
import { createWrapperEmit, splitWrapperAttrs } from '@/shared/splitWrapperAttrs'
import { VisuallyHiddenInput } from '@/VisuallyHidden'
import { useSlider } from './useSlider'
import { useSliderPointer } from './useSliderPointer'
import { injectSliderFieldContext, provideSliderFieldContext, provideSliderOrientationContext } from './utils'

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

const dir = useDirection(() => props.dir)
const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)
const isFormControl = useFormControl(currentElement)

useCollection({ isProvider: true })
useCollectionSlot(currentElement)

// Optional Field participation: `null` outside a `FieldRoot`, so every
// binding below is inert without a Field. A wrapping control that owns the
// value (`ColorSliderRoot`) hands down its own binding instead.
const inheritedField = injectSliderFieldContext(null)
const ownField = inheritedField
  ? null
  : useFieldControl({
      // The first thumb renders its own `id`, else the field's.
      id: () => context.thumbElements.value[0]?.id || undefined,
      element: () => context.thumbElements.value[0],
      // Reka's model: an array, even for a single thumb.
      getValue: () => modelValue.value,
      required: () => props.required,
    })
const field = inheritedField ?? ownField
// Getters rather than computeds: cheap, and free for a standalone slider.
const resolvedName = () => ownField ? ownField.name(props.name) : props.name
const resolvedRequired = () => ownField ? ownField.required(props.required) : props.required
const resolvedDisabled = () => ownField ? ownField.disabled(props.disabled) : props.disabled

// Controlled/uncontrolled + `beforeUpdate:` / `update:` / `valueCommit` emits
// live in the composable (`modelValue === undefined` → uncontrolled).
const { modelValue, root, orientation: orientationGeometry, startSlide, moveSlide, endSlide, context } = useSlider({
  modelValue: () => props.modelValue,
  defaultValue: props.defaultValue,
  disabled: resolvedDisabled,
  orientation: () => props.orientation,
  dir,
  inverted: () => props.inverted,
  min: () => props.min,
  max: () => props.max,
  step: () => props.step,
  minStepsBetweenThumbs: () => props.minStepsBetweenThumbs,
  thumbAlignment: () => props.thumbAlignment,
  emit: emits,
  // The Field hears its own commits by reason (`change`): user input, or, for
  // a programmatic one (`setModelValue` and the like), only the watcher below,
  // which also reports a parent-driven change.
  onUpdate: ownField?.change,
})

provideSliderRootContext(context)
provideSliderFieldContext(field)

if (ownField)
  watch(modelValue, value => ownField.sync(value))

// The field is focused while focus is on any thumb, and blurred once it
// leaves the slider.
const focusWithin = useFieldFocusWithin(field, currentElement as Ref<HTMLElement | undefined>)
const fieldElementAttrs = focusWithin && { onFocusin: focusWithin.onFocusin, onFocusout: focusWithin.onFocusout }
provideSliderOrientationContext(orientationGeometry)

// A consumer's `@slide-start` / `@slide-move` / `@slide-end` still hears the
// slide events, before the slider's own, and never reaches the element.
const attrs = useAttrs()
// Held for the emit recreated in a watcher, where there's no current instance.
const instance = getCurrentInstance()
const SLIDE_EVENTS = { props: {}, emits: ['slideStart', 'slideMove', 'slideEnd'] }
const ownSlideListeners = { onSlideStart: startSlide, onSlideMove: moveSlide, onSlideEnd: () => endSlide() }
function createSlideEmit() {
  return createWrapperEmit(() => {
    const split = splitWrapperAttrs(attrs, SLIDE_EVENTS)
    return { ...split, listeners: mergeProps(split.listeners, ownSlideListeners) }
  }, instance)
}
let emitSlide = createSlideEmit()

const pointer = useSliderPointer({
  element: () => currentElement.value,
  context,
  orientation: orientationGeometry,
  emit: (key, ...args) => emitSlide(key, ...args),
})

// Switching orientation remounts the element (see `:key`), which starts a new
// drag and lets a `.once` listener run again.
watch(() => props.orientation, () => {
  pointer.reset()
  emitSlide = createSlideEmit()
})

// Precedence is part of the v2 contract. `mergeProps` chains same-named
// listeners in argument order and lets later plain attributes win, so:
// - leading (before `$attrs`): the slider's own keydown handler runs before a
//   consumer `@keydown`; the orientation's `style`
//   (`--reka-slider-thumb-transform`) and `data-orientation` sit under the root's
//   fall-through attributes, so a consumer `style` / `data-orientation` still wins;
// - trailing (after `$attrs`): `aria-disabled`, `data-disabled` and `dir` are
//   bound after them, so the component wins;
// - the pointer handlers run first, and the pointerdown bookkeeping after a consumer's.
// One split of the root attrs (one computed, one attrs read) for all of it.
const split = computed(() => {
  const { onKeydown, onPointerdown, style, 'data-orientation': dataOrientation, ...attrs } = root.attrs.value
  return { leading: { onKeydown, style, 'data-orientation': dataOrientation }, attrs, onPointerdown }
})
const ownElementAttrs = { 'data-slider-impl': '', ...pointer.handlers }

// `$attrs` is read in the template so attribute changes re-render. The first
// attributes keep their place on the element: horizontal renders `dir` early.
function elementProps(consumerAttrs: Record<string, unknown>) {
  const { leading, attrs: rootAttrs, onPointerdown } = split.value
  const merged = mergeProps(
    fieldElementAttrs || {},
    ownElementAttrs,
    props.orientation === 'horizontal' ? { 'dir': rootAttrs.dir as string, 'data-orientation': 'horizontal' } : { 'data-orientation': 'vertical' },
    leading,
    splitWrapperAttrs(consumerAttrs, SLIDE_EVENTS).rest,
    rootAttrs,
    { onPointerdown },
  )
  return field ? field.fillDataAttributes(merged) : merged
}
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :key="orientation === 'horizontal' ? 'horizontal' : 'vertical'"
    :ref="forwardRef"
    v-bind="elementProps($attrs)"
  >
    <slot :model-value="modelValue ?? null" />

    <VisuallyHiddenInput
      v-if="isFormControl && resolvedName()"
      type="number"
      :value="modelValue"
      :name="resolvedName()!"
      :required="resolvedRequired()"
      :disabled="resolvedDisabled()"
      :step="step"
    />
  </component>
</template>
