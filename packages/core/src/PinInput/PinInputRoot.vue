<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import type { Direction, FormFieldProps } from '@/shared/types'
import type { ComputedRef, Ref } from 'vue'
import { createContext, useDirection, useForwardExpose } from '@/shared'
import VisuallyHiddenInput from '@/VisuallyHidden/VisuallyHiddenInput.vue'
import { computed, ref, toRefs, watch } from 'vue'

export type PinInputType = 'text' | 'number'

// Using this complex type to avoid breaking changes - we can simplify it in a major version.
export type PinInputValue<Type extends PinInputType, Value extends string | number> = Type extends 'number' ? Value extends number ? number[] : string[] : string[]

export type PinInputRootEmits<Type extends PinInputType, Value extends string | number> = {
  'update:modelValue': [value: PinInputValue<Type, Value>]
  'complete': [value: PinInputValue<Type, Value>]
}

export interface PinInputRootProps<Type extends PinInputType, Value extends string | number> extends PrimitiveProps, FormFieldProps {
  /** The controlled checked state of the pin input. Can be binded as `v-model`. */
  modelValue?: PinInputValue<Type, Value> | null
  /** The default value of the pin inputs when it is initially rendered. Use when you do not need to control its checked state. */
  defaultValue?: PinInputValue<Type, Value>[]
  /** The placeholder character to use for empty pin-inputs. */
  placeholder?: string
  /** When `true`, pin inputs will be treated as password. */
  mask?: boolean
  /** When `true`, mobile devices will autodetect the OTP from messages or clipboard, and enable the autocomplete field. */
  otp?: boolean
  /** Input type for the inputs. */
  type?: PinInputType
  /** The reading direction of the combobox when applicable. <br> If omitted, inherits globally from `ConfigProvider` or assumes LTR (left-to-right) reading mode. */
  dir?: Direction
  /** When `true`, prevents the user from interacting with the pin input */
  disabled?: boolean
  /** Id of the element */
  id?: string
}

export interface PinInputRootContext<Type extends PinInputType, Value extends string | number> {
  modelValue: Ref<PinInputValue<Type, Value>>
  currentModelValue: ComputedRef<PinInputValue<Type, Value>>
  mask: Ref<boolean>
  otp: Ref<boolean>
  placeholder: Ref<string>
  type: Ref<PinInputType>
  dir: Ref<Direction>
  disabled: Ref<boolean>
  isCompleted: ComputedRef<boolean>
  inputElements?: Ref<Set<HTMLInputElement>>
  onInputElementChange: (el: HTMLInputElement) => void
}

export const [injectPinInputRootContext, providePinInputRootContext]
  = createContext<PinInputRootContext<PinInputType, string | number>>('PinInputRoot')
</script>

<script setup lang="ts" generic="Type extends PinInputType, Value extends string | number">
import { Primitive } from '@/Primitive'
import { useVModel } from '@vueuse/core'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<PinInputRootProps<Type, Value>>(), {
  placeholder: '',
  type: 'text',
})
const emits = defineEmits<PinInputRootEmits<Type, Value>>()

defineSlots<{
  default: (props: {
    /** Current input values */
    modelValue: typeof modelValue.value
  }) => any
}>()

const { mask, otp, placeholder, type, disabled, dir: propDir } = toRefs(props)
const { forwardRef } = useForwardExpose()
const dir = useDirection(propDir)

const modelValue = useVModel(props, 'modelValue', emits, {
  defaultValue: props.defaultValue ?? [] as any,
  passive: (props.modelValue === undefined) as false,
}) as Ref<PinInputValue<Type, Value>>

const currentModelValue = computed(() => Array.isArray(modelValue.value) ? [...modelValue.value] : [])

const inputElements = ref<Set<HTMLInputElement>>(new Set())
function onInputElementChange(el: HTMLInputElement) {
  inputElements.value.add(el)
}

const isCompleted = computed(() => {
  const modelValues = currentModelValue.value.filter(i => !!i)
  return modelValues.length === inputElements.value.size
})

watch(modelValue, () => {
  if (isCompleted.value)
    emits('complete', modelValue.value)
}, { deep: true })

providePinInputRootContext({
  modelValue,
  currentModelValue: currentModelValue as ComputedRef<PinInputValue<Type, Value>>,
  mask,
  otp,
  placeholder,
  type,
  dir,
  disabled,
  isCompleted,
  inputElements,
  onInputElementChange,
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

    <VisuallyHiddenInput
      :id="id"
      as="input"
      feature="focusable"
      tabindex="-1"
      :value="currentModelValue.join('')"
      :name="name ?? ''"
      :disabled="disabled"
      :required="required"
      @focus="Array.from(inputElements)?.[0]?.focus()"
    />
  </Primitive>
</template>
