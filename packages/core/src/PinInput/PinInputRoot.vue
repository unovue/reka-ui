<script lang="ts">
import type { ComputedRef, Ref } from 'vue'
import type { PinInputChangeReason } from './usePinInput'
import type { PrimitiveProps } from '@/Primitive'
import type { BaseChangeReason, ChangeEventDetails } from '@/shared'
import type { Direction, FormFieldProps } from '@/shared/types'
import { createContext, useDirection, useForwardElement } from '@/shared'
import VisuallyHiddenInput from '@/VisuallyHidden/VisuallyHiddenInput.vue'

export type PinInputType = 'text' | 'number'

// Using this type to avoid mixed arrays (string | number)[].
// The value type can be (number | undefined)[] only when the type is explicitly set to 'number'.
// Cleared inputs leave gaps, so numeric values may be `undefined`.
export type PinInputValue<Type extends PinInputType> = [Type] extends ['number'] ? (number | undefined)[] : string[]

// provide the mixed arrays because the `type` is dynamic in the context
export type PinInputContextValue<Type extends PinInputType = 'text'>
  = Type extends 'number'
    ? Type extends 'string'
      ? string[] | (number | undefined)[]
      : (number | undefined)[]
    : string[]

export type PinInputRootEmits<Type extends PinInputType = 'text'> = {
  /** Event handler called before the value changes; `details.cancel()` vetoes the change. */
  'beforeUpdate:modelValue': [value: PinInputValue<Type>, details: ChangeEventDetails<PinInputChangeReason>]
  /** Event handler called when the value changes. */
  'update:modelValue': [value: PinInputValue<Type>, details: ChangeEventDetails<PinInputChangeReason>]
  /** Event handler called when every input is filled. */
  'complete': [value: PinInputValue<Type>]
}

export interface PinInputRootProps<Type extends PinInputType = 'text'> extends PrimitiveProps, FormFieldProps {
  /** The controlled checked state of the pin input. Can be binded as `v-model`. */
  modelValue?: PinInputValue<Type> | null
  /** The default value of the pin inputs when it is initially rendered. Use when you do not need to control its checked state. */
  defaultValue?: PinInputValue<Type>
  /** The placeholder character to use for empty pin-inputs. */
  placeholder?: string
  /** When `true`, pin inputs will be treated as password. */
  mask?: boolean
  /** When `true`, mobile devices will autodetect the OTP from messages or clipboard, and enable the autocomplete field. */
  otp?: boolean
  /** Input type for the inputs. */
  type?: Type
  /** The reading direction of the combobox when applicable. <br> If omitted, inherits globally from `ConfigProvider` or assumes LTR (left-to-right) reading mode. */
  dir?: Direction
  /** When `true`, prevents the user from interacting with the pin input */
  disabled?: boolean
  /** Id of the element */
  id?: string
}

export interface PinInputRootContext<Type extends PinInputType = 'text'> {
  /** Read-only; write through `setModelValue` / `updateModelValueAt`. */
  modelValue: Readonly<Ref<PinInputContextValue<Type>>>
  currentModelValue: ComputedRef<PinInputContextValue<Type>>
  mask: Readonly<Ref<boolean>>
  otp: Readonly<Ref<boolean>>
  placeholder: Readonly<Ref<string>>
  type: Readonly<Ref<PinInputType>>
  dir: Readonly<Ref<Direction>>
  disabled: Readonly<Ref<boolean>>
  isCompleted: ComputedRef<boolean>
  inputElements?: Ref<Set<HTMLInputElement>>
  onInputElementChange: (el: HTMLInputElement) => void
  isNumericMode: ComputedRef<boolean>
  /** Replaces the whole value. Returns `false` when unchanged or cancelled. */
  setModelValue: (value: PinInputContextValue<Type>, reason?: PinInputChangeReason | BaseChangeReason, event?: Event) => boolean
  /** Writes one input's value (`''` clears it). Returns `false` when unchanged or cancelled. */
  updateModelValueAt: (index: number, value: string, reason?: PinInputChangeReason | BaseChangeReason, event?: Event) => boolean
}

export const [injectPinInputRootContext, providePinInputRootContext]
  = createContext<PinInputRootContext<PinInputType>>('PinInputRoot')
</script>

<script setup lang="ts" generic="Type extends PinInputType">
import { mergeProps, toRefs } from 'vue'
import { Primitive } from '@/Primitive'
import { usePinInput } from './usePinInput'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<PinInputRootProps<Type>>(), {
  placeholder: '',
  type: 'text' as any,
})
const emits = defineEmits<PinInputRootEmits<Type>>()

defineSlots<{
  default?: (props: {
    /** Current input values */
    modelValue: typeof modelValue.value
  }) => any
}>()

const { dir: propDir } = toRefs(props)
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
const dir = useDirection(propDir)

// The composable owns the model (`useControllableState`), `beforeUpdate:` /
// `update:` and the `complete` watcher; the shell keeps `dir` resolution and
// the hidden form input.
const { modelValue: model, currentModelValue, root, context } = usePinInput({
  modelValue: () => props.modelValue,
  defaultValue: props.defaultValue,
  type: () => props.type,
  mask: () => props.mask,
  otp: () => props.otp,
  placeholder: () => props.placeholder,
  dir,
  disabled: () => props.disabled,
  emit: emits,
})
const modelValue = model as unknown as Readonly<Ref<PinInputValue<Type>>>

providePinInputRootContext(context)
</script>

<template>
  <Primitive
    v-bind="mergeProps($attrs, root.attrs.value)"
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
  >
    <slot :model-value="modelValue" />

    <VisuallyHiddenInput
      :id="id"
      as="input"
      feature="focusable"
      aria-hidden="true"
      tabindex="-1"
      :value="currentModelValue.join('')"
      :name="name ?? ''"
      :disabled="disabled"
      :required="required"
      @focus="Array.from(context.inputElements!.value)?.[0]?.focus()"
    />
  </Primitive>
</template>
