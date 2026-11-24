<script lang="ts">
import type { ComputedRef, Ref } from 'vue'
import type { PrimitiveProps } from '@/Primitive'
import type { Direction, FormFieldProps } from '@/shared/types'
import { computed, ref, toRefs, watch, watchEffect } from 'vue'
import { createRekaContext, useDirection, useForwardExpose } from '@/shared'
import VisuallyHiddenInputBubble from '@/VisuallyHidden/VisuallyHiddenInputBubble.vue'

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
  'update:modelValue': [value: PinInputValue<Type>]
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
  /** When `true` and `required`, every mounted PIN input must be filled before the form can be submitted. Defaults to `false`. */
  requireComplete?: boolean
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
  modelValue: Ref<PinInputContextValue<Type>>
  currentModelValue: ComputedRef<PinInputContextValue<Type>>
  mask: Ref<boolean>
  otp: Ref<boolean>
  placeholder: Ref<string>
  type: Ref<PinInputType>
  dir: Ref<Direction>
  disabled: Ref<boolean>
  isCompleted: ComputedRef<boolean>
  inputElements?: Ref<Set<HTMLInputElement>>
  getModelIndex: (el: HTMLInputElement, position: number) => number
  onInputElementChange: (el: HTMLInputElement, index?: number) => void
  isNumericMode: ComputedRef<boolean>
}

export const [injectPinInputRootContext, providePinInputRootContext]
  = createRekaContext<PinInputRootContext<PinInputType>>('PinInputRoot')
</script>

<script setup lang="ts" generic="Type extends PinInputType">
import { useVModel } from '@vueuse/core'
import { Primitive, usePrimitiveElement } from '@/Primitive'

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

const { mask, otp, placeholder, type, disabled, dir: propDir } = toRefs(props)
const { forwardRef } = useForwardExpose()
const { primitiveElement: formInputRef, currentElement: formInput } = usePrimitiveElement()
const dir = useDirection(propDir)

const modelValue = useVModel(props, 'modelValue', emits, {
  defaultValue: props.defaultValue ?? [] as any,
  passive: true,
  deep: true,
}) as Ref<PinInputValue<Type>>

const currentModelValue = computed(() => Array.isArray(modelValue.value) ? [...modelValue.value] : [])

const inputElements = ref<Set<HTMLInputElement>>(new Set())
const modelIndexByInput = new WeakMap<HTMLInputElement, number>()
function getModelIndex(el: HTMLInputElement, position: number) {
  return modelIndexByInput.get(el) ?? position
}

function onInputElementChange(el: HTMLInputElement, index?: number) {
  if (index !== undefined)
    modelIndexByInput.set(el, index)
  // A conditional slot may mount between two inputs that are already registered.
  const elements = [...inputElements.value, el]
  elements.sort((a, b) => a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1)
  inputElements.value = new Set(elements)
}

const isNumericMode = computed(() => props.type === 'number')
const mountedValues = computed(() => {
  const indices = new Set(Array.from(inputElements.value, getModelIndex))
  return currentModelValue.value.filter((_, index) => indices.has(index)) as PinInputValue<Type>
})
const isCompleted = computed(() => {
  return mountedValues.value.length > 0
    && mountedValues.value.length === inputElements.value.size
    && mountedValues.value.every(value => !!value || (isNumericMode.value && value === 0))
})

watchEffect((onCleanup) => {
  const input = formInput.value as HTMLInputElement | undefined
  if (input && props.required && props.requireComplete && !isCompleted.value) {
    input.setCustomValidity('Please fill in every PIN field.')
    onCleanup(() => input.setCustomValidity(''))
  }
})

// A complete handler can submit the form immediately, so update the native input first.
watch(modelValue, () => {
  if (isCompleted.value)
    emits('complete', mountedValues.value)
}, { deep: true, flush: 'post' })

providePinInputRootContext({
  modelValue,
  currentModelValue: currentModelValue as ComputedRef<PinInputValue<Type>>,
  mask,
  otp,
  placeholder,
  type,
  dir,
  disabled,
  isCompleted,
  inputElements,
  getModelIndex,
  onInputElementChange,
  isNumericMode,
})
</script>

<template>
  <Primitive
    v-bind="$attrs"
    :ref="forwardRef"
    :dir="dir"
    :data-complete="isCompleted ? '' : undefined"
    :data-disabled="disabled ? '' : undefined"
  >
    <slot :model-value="modelValue" />

    <VisuallyHiddenInputBubble
      :id="id"
      ref="formInputRef"
      as="input"
      feature="focusable"
      aria-hidden="true"
      tabindex="-1"
      :value="mountedValues.join('')"
      :name="name ?? ''"
      :disabled="disabled"
      :required="required"
      @focus="Array.from(inputElements)?.[0]?.focus()"
    />
  </Primitive>
</template>
