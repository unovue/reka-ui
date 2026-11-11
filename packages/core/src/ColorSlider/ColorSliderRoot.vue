<script lang="ts">
import type { ComputedRef, Ref } from 'vue'
import type { ColorSliderChangeReason } from './useColorSlider'
import type { PrimitiveProps } from '@/Primitive'
import type { ChangeEventDetails } from '@/shared'
import type { Color, ColorChannel, ColorSpace } from '@/shared/color'
import type { DataOrientation, Direction, FormFieldProps } from '@/shared/types'
import { createContext, useDirection, useFormControl, useForwardElement } from '@/shared'

export interface ColorSliderRootProps extends PrimitiveProps, FormFieldProps {
  /** The color value (controlled). A string is parsed once; emitted values are always `Color` objects. */
  modelValue?: string | Color
  /** The default color value (uncontrolled). A string is parsed once. */
  defaultValue?: string | Color
  /** The color space to operate in. */
  colorSpace?: ColorSpace
  /** The color channel that this slider manipulates. */
  channel: ColorChannel
  /** The orientation of the slider. */
  orientation?: DataOrientation
  /** The reading direction of the slider. */
  dir?: Direction
  /** Whether the slider is visually inverted. */
  inverted?: boolean
  /** When `true`, prevents the user from interacting with the slider. */
  disabled?: boolean
  /** Custom step value for increment/decrement. Defaults to the channel's natural step. */
  step?: number
}

export type ColorSliderRootEmits = {
  /** Event handler called before the color value changes; `details.cancel()` vetoes the change. */
  'beforeUpdate:modelValue': [value: Color, details: ChangeEventDetails<ColorSliderChangeReason>]
  /** Event handler called when the color value changes. */
  'update:modelValue': [value: Color, details: ChangeEventDetails<ColorSliderChangeReason>]
  /** Event handler called with the same `Color` as `update:modelValue`, after it. */
  'update:color': [value: Color]
  /** Event handler called with the hex serialization of the new color, after `update:modelValue`. Lossy: drops the hue of greys and sub-byte precision. */
  'update:hex': [value: string]
  /** Event handler called on every pointer move or keyboard step that changes the color. */
  'change': [value: Color]
  /** Event handler called when an interaction that changed the color ends: on pointer release and after each keyboard step. */
  'changeEnd': [value: Color]
}

export interface ColorSliderRootContext {
  color: ComputedRef<Color>
  channelValue: ComputedRef<number>
  channel: Ref<ColorChannel>
  colorSpace: Ref<ColorSpace>
  orientation: Ref<DataOrientation>
  dir: Ref<Direction>
  disabled: Ref<boolean>
  inverted: Ref<boolean>
  min: ComputedRef<number>
  max: ComputedRef<number>
  step: ComputedRef<number>
}

export const [injectColorSliderRootContext, provideColorSliderRootContext]
  = createContext<ColorSliderRootContext>('ColorSliderRoot')
</script>

<script setup lang="ts">
import { mergeProps, watch } from 'vue'
import { useFieldBinding } from '@/Field/useFieldBinding'
import { colorToString } from '@/shared/color'
import { provideFormResetOwner } from '@/shared/formReset'
import { resetControllableState } from '@/shared/useControllableState'
import { SliderRoot } from '@/Slider'
import { provideSliderFieldContext } from '@/Slider/utils'
import { VisuallyHiddenInput } from '@/VisuallyHidden'
import { useColorSlider } from './useColorSlider'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<ColorSliderRootProps>(), {
  colorSpace: 'hsl',
  orientation: 'horizontal',
  disabled: false,
  inverted: false,
  defaultValue: '#000000',
  as: 'span',
})

const emits = defineEmits<ColorSliderRootEmits>()

const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)
const isFormControl = useFormControl(currentElement)
const dir = useDirection(() => props.dir)

// Optional Field participation: `null` outside a `FieldRoot`, so every
// binding below is inert without a Field. The color slider owns the value
// and registers it; the inner `SliderRoot` and `SliderThumb` render the
// field's state, focus, id and aria wiring through the binding handed down.
const thumbElement = () => (currentElement.value as HTMLElement | undefined)?.querySelector<HTMLElement>('[role="slider"]') ?? undefined
const field = useFieldBinding({
  // The thumb renders its own `id`, else the field's.
  id: () => thumbElement()?.id || undefined,
  element: thumbElement,
  // The model: a `Color`.
  getValue: () => color.value,
  required: () => props.required,
})
// Getters rather than computeds: cheap, and free for a standalone slider.
const resolvedName = () => field ? field.name(props.name) : props.name
const resolvedRequired = () => field ? field.required(props.required) : props.required

const { sliderProps, context, color, disabled, isControlled } = useColorSlider({
  orientation: () => props.orientation,
  dir: () => dir.value,
  disabled: () => field ? field.disabled(props.disabled) : props.disabled,
  inverted: () => props.inverted,
  channel: () => props.channel,
  colorSpace: () => props.colorSpace,
  step: () => props.step,
  modelValue: () => props.modelValue,
  defaultValue: () => props.defaultValue,
  emit: emits,
  // The Field hears its own commits by reason (`change`): user input, or, for
  // a programmatic one (`setModelValue` and the like), only the watcher below,
  // which also reports a parent-driven change.
  onUpdate: field?.change,
})

provideColorSliderRootContext(context)
// A native reset of the owning form puts the value back to `defaultValue`.
// The inner `SliderRoot` binds it on the element they share.
provideFormResetOwner((event: Event) => { resetControllableState(isControlled, event) })
if (field) {
  provideSliderFieldContext(field)
  watch(color, value => field.sync(value))
}
</script>

<template>
  <SliderRoot
    v-bind="mergeProps(sliderProps, $attrs)"
    :ref="forwardRef"
    :dir="dir"
    :as="as"
    :as-child="asChild"
  >
    <slot />

    <VisuallyHiddenInput
      v-if="isFormControl && resolvedName()"
      type="text"
      :value="colorToString(color, 'hex')"
      :name="resolvedName()!"
      :disabled="disabled"
      :required="resolvedRequired()"
    />
  </SliderRoot>
</template>
