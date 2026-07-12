<script lang="ts">
import type { ComputedRef, Ref } from 'vue'
import type { PrimitiveProps } from '@/Primitive'
import type { FormFieldProps } from '@/shared/types'
import { createContext, getRootNode, stateToDataAttrs, useFormControl, useForwardExpose, useForwardScopeId } from '@/shared'

export interface SwitchRootProps<T = boolean> extends PrimitiveProps, FormFieldProps {
  /** The state of the switch when it is initially rendered. Use when you do not need to control its state. */
  defaultValue?: T
  /** The controlled state of the switch. Can be bind as `v-model`. */
  modelValue?: T | null
  /** When `true`, prevents the user from interacting with the switch. */
  disabled?: boolean
  id?: string
  /** The value given as data when submitted with a `name`. */
  value?: string
  /**
   * The value used when the switch is on. Defaults to `true`.
   */
  trueValue?: T
  /**
   * The value used when the switch is off. Defaults to `false`.
   */
  falseValue?: T
}

export type SwitchRootEmits<T = boolean> = {
  /** Event handler called when the value of the switch changes. */
  'update:modelValue': [payload: T]
}

export interface SwitchRootContext {
  checked: ComputedRef<boolean>
  toggleCheck: () => void
  disabled: Ref<boolean>
}

export const [injectSwitchRootContext, provideSwitchRootContext]
  = createContext<SwitchRootContext>('SwitchRoot')
</script>

<script setup lang="ts" generic="T = boolean">
import { useVModel } from '@vueuse/core'
import { computed, mergeProps } from 'vue'
import { Primitive } from '@/Primitive'
import { VisuallyHiddenInput } from '@/VisuallyHidden'
import { useSwitch } from './useSwitch'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<SwitchRootProps<T>>(), {
  as: 'button',
  modelValue: undefined,
  value: 'on',
  trueValue: (() => true) as unknown as undefined,
  falseValue: (() => false) as unknown as undefined,
})
const emit = defineEmits<SwitchRootEmits<T>>()

defineSlots<{
  default?: (props: {
    /** Current value */
    modelValue: typeof modelValue.value
    /** Whether the switch is checked */
    checked: typeof checked.value
  }) => any
}>()

// `useVModel` + `passive` (controlled/uncontrolled) stays in the shell; the
// resulting ref is handed to the composable so emit semantics are untouched.
const modelValue = useVModel(props as any, 'modelValue', emit as any, {
  defaultValue: props.defaultValue ?? props.falseValue,
  passive: (props.modelValue === undefined) as false,
}) as Ref<T>

const { forwardRef, currentElement } = useForwardExpose()
const scopeIdAttrs = useForwardScopeId()
const isFormControl = useFormControl(currentElement)
// DOM-bound: resolves the associated `[for]` label text through the element's
// root (shadow-safe, #2792). Stays in the shell (needs `currentElement`,
// SSR-guarded) — not in the composable.
const ariaLabel = computed(() => props.id && currentElement.value ? (getRootNode(currentElement.value).querySelector(`[for="${props.id}"]`) as HTMLLabelElement)?.innerText : undefined)

const { checked, root, context } = useSwitch<T>({
  modelValue,
  disabled: () => props.disabled,
  required: () => props.required,
  value: () => props.value,
  trueValue: () => props.trueValue as T,
  falseValue: () => props.falseValue as T,
})

provideSwitchRootContext(context)
</script>

<template>
  <Primitive
    :id="id"
    :ref="forwardRef"
    :type="as === 'button' ? 'button' : undefined"
    :aria-label="$attrs['aria-label'] || ariaLabel"
    :as-child="asChild"
    :as="as"
    v-bind="mergeProps(root.props.value, stateToDataAttrs(root.state.value), scopeIdAttrs, $attrs)"
  >
    <slot
      :model-value="modelValue"
      :checked="checked"
    />
  </Primitive>

  <VisuallyHiddenInput
    v-if="isFormControl && name"
    type="checkbox"
    :name="name"
    :disabled="disabled"
    :required="required"
    :value="value"
    :checked="checked"
    v-bind="scopeIdAttrs"
  />
</template>
