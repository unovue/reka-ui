<script lang="ts">
import type { ComputedRef, CSSProperties, Ref } from 'vue'
import type { ColorAreaAxis, ColorAreaChangeReason } from './useColorArea'
import type { FieldControlBinding } from '@/Field/useFieldControl'
import type { PrimitiveProps } from '@/Primitive'
import type { BaseChangeReason, ChangeEventDetails } from '@/shared'
import type { Color, ColorChannel, ColorSpace } from '@/shared/color'
import type { Direction, FormFieldProps } from '@/shared/types'
import { createContext, useDirection, useFormControl, useForwardElement } from '@/shared'

export interface ColorAreaRootProps extends PrimitiveProps, FormFieldProps {
  /** The color value (controlled). A string is parsed once; emitted values are always `Color` objects. */
  modelValue?: string | Color
  /** The default color value (uncontrolled). A string is parsed once. */
  defaultValue?: string | Color
  /** The color space to operate in. */
  colorSpace?: ColorSpace
  /** Color channel for the horizontal (x) axis. */
  xChannel?: ColorChannel
  /** Color channel for the vertical (y) axis. */
  yChannel?: ColorChannel
  /** When `true`, prevents the user from interacting with the area. */
  disabled?: boolean
  /** The name of the x channel input element for form submission. */
  xName?: string
  /** The name of the y channel input element for form submission. */
  yName?: string
  /** The reading direction of the area. In `rtl` the x axis runs right to left. If omitted, inherits from `ConfigProvider` or assumes `ltr`. */
  dir?: Direction
}

export type ColorAreaRootEmits = {
  /** Event handler called before the color value changes; `details.cancel()` vetoes the change. */
  'beforeUpdate:modelValue': [value: Color, details: ChangeEventDetails<ColorAreaChangeReason>]
  /** Event handler called when the color value changes. */
  'update:modelValue': [value: Color, details: ChangeEventDetails<ColorAreaChangeReason>]
  /** Event handler called with the same `Color` as `update:modelValue`, after it. */
  'update:color': [value: Color]
  /** Event handler called with the hex serialization of the new color, after `update:modelValue`. Lossy: drops the hue of greys and sub-byte precision. */
  'update:hex': [value: string]
  /** Event handler called on every pointer move or keyboard step that changes the color. */
  'change': [value: Color]
  /** Event handler called when an interaction that changed the color ends: on pointer release and after each keyboard step. */
  'changeEnd': [value: Color]
}

export interface ColorAreaRootContext {
  color: ComputedRef<Color>
  xValue: ComputedRef<number>
  yValue: ComputedRef<number>
  xChannel: Ref<ColorChannel>
  yChannel: Ref<ColorChannel>
  colorSpace: Ref<ColorSpace>
  disabled: Ref<boolean>
  dir: Ref<Direction>
  xRange: ComputedRef<{ min: number, max: number, step: number }>
  yRange: ComputedRef<{ min: number, max: number, step: number }>
  thumbRef: Ref<HTMLElement | undefined>
  /** The hidden range input of each axis, rendered by `ColorAreaThumb`. */
  xInputRef: Ref<HTMLInputElement | undefined>
  yInputRef: Ref<HTMLInputElement | undefined>
  /** The axis whose input last had focus; it holds the area's single tab stop. */
  focusedAxis: Ref<ColorAreaAxis>
  /** Focuses the input of `axis` (default: the last focused axis), or the thumb when no input is rendered. */
  focusInput: (axis?: ColorAreaAxis) => void
  updateValues: (x: number, y: number, reason?: ColorAreaChangeReason | BaseChangeReason, event?: Event) => boolean
  commitValues: () => void
}

export const [injectColorAreaRootContext, provideColorAreaRootContext]
  = createContext<ColorAreaRootContext>('ColorAreaRoot')

/**
 * A color area's participation in an ancestor `FieldRoot` (`null` outside
 * one): the root owns the color and the registration, the thumb's inputs
 * carry the field's id and aria wiring.
 * @internal
 */
export const [injectColorAreaFieldContext, provideColorAreaFieldContext]
  = createContext<FieldControlBinding | null>('ColorAreaRoot', 'ColorAreaFieldContext')
</script>

<script setup lang="ts">
import { mergeProps, watch } from 'vue'
import { useFieldControl } from '@/Field/useFieldControl'
import { useFieldFocusWithin } from '@/Field/useFieldFocusWithin'
import { renderAs } from '@/Primitive/renderAs'
import { colorToString } from '@/shared/color'
import { vFormReset } from '@/shared/formReset'
import { resetControllableState } from '@/shared/useControllableState'
import { VisuallyHiddenInput } from '@/VisuallyHidden'
import { useColorArea } from './useColorArea'

const props = withDefaults(defineProps<ColorAreaRootProps>(), {
  colorSpace: 'hsl',
  xChannel: 'hue',
  yChannel: 'saturation',
  disabled: false,
  defaultValue: '#ff0000',
  as: 'div',
})

const emits = defineEmits<ColorAreaRootEmits>()

defineSlots<{
  default?: (props: {
    /** CSS styles for the color area background gradient */
    style: CSSProperties
  }) => any
}>()

const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)
const isFormControl = useFormControl(currentElement)
const dir = useDirection(() => props.dir)

// Optional Field participation: `null` outside a `FieldRoot`, so every
// binding below is inert without a Field.
const field = useFieldControl({
  // The x input renders its own `id`, else the field's.
  id: () => context.xInputRef.value?.id || undefined,
  element: () => context.xInputRef.value ?? context.thumbRef.value,
  // The model: a `Color`.
  getValue: () => color.value,
  required: () => props.required,
})

const { root, context, areaStyles, xValue, yValue, color, isControlled } = useColorArea({
  colorSpace: () => props.colorSpace,
  xChannel: () => props.xChannel,
  yChannel: () => props.yChannel,
  disabled: () => field ? field.disabled(props.disabled) : props.disabled,
  modelValue: () => props.modelValue,
  defaultValue: () => props.defaultValue,
  dir: () => dir.value,
  emit: emits,
  // The Field hears its own commits by reason (`change`): user input, or, for
  // a programmatic one (`setModelValue` and the like), only the watcher below,
  // which also reports a parent-driven change.
  onUpdate: field?.change,
})

provideColorAreaRootContext(context)
provideColorAreaFieldContext(field)

// A native reset of the owning form puts the value back to `defaultValue`.
function onFormReset(event: Event) { resetControllableState(isControlled, event) }

if (field)
  watch(color, value => field.sync(value))

// The Field's state attributes go first so the area's own `data-*` win. The
// field is focused while focus is on either axis, and blurred once it leaves.
const focusWithin = useFieldFocusWithin(field, currentElement as Ref<HTMLElement | undefined>)
const fieldAttrs = focusWithin && { onFocusin: focusWithin.onFocusin, onFocusout: focusWithin.onFocusout }
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="forwardRef"
    v-form-reset="onFormReset"
    v-bind="field ? field.fillDataAttributes(mergeProps(root.attrs.value, fieldAttrs!)) : root.attrs.value"
  >
    <slot :style="areaStyles" />

    <!-- One placeholder for all hidden inputs, so a non-form instance renders a single comment node. -->
    <template v-if="isFormControl && ((field ? field.name(name) : name) || xName || yName)">
      <!-- The color, as ColorField submits it, under the field's name (or its own); `xName`/`yName` add the channel values. -->
      <VisuallyHiddenInput
        v-if="field ? field.name(name) : name"
        type="text"
        :value="colorToString(color, 'hex')"
        :name="(field ? field.name(name) : name)!"
        :disabled="context.disabled.value"
        :required="field ? field.required(required) : required"
      />
      <VisuallyHiddenInput
        v-if="xName"
        type="text"
        :value="xValue"
        :name="xName"
        :disabled="context.disabled.value"
      />
      <VisuallyHiddenInput
        v-if="yName"
        type="text"
        :value="yValue"
        :name="yName"
        :disabled="context.disabled.value"
      />
    </template>
  </component>
</template>
