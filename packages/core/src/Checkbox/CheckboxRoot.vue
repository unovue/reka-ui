<script lang="ts">
import type { ComputedRef, Ref } from 'vue'
import type { CheckboxChangeReason } from './useCheckbox'
import type { CheckedState } from './utils'
import type { PrimitiveProps } from '@/Primitive'
import type { ChangeEventDetails } from '@/shared'
import type { AcceptableValue, FormFieldProps } from '@/shared/types'
import { createContext, getRootNode, useFormControl, useForwardExpose, useForwardScopeId } from '@/shared'
import { injectCheckboxGroupRootContext } from './CheckboxGroupRoot.vue'

export interface CheckboxRootProps<T = boolean> extends PrimitiveProps, FormFieldProps {
  /** The value of the checkbox when it is initially rendered. Use when you do not need to control its value. */
  defaultValue?: T | 'indeterminate'
  /** The controlled value of the checkbox. Can be binded with v-model. */
  modelValue?: T | 'indeterminate' | null
  /** When `true`, prevents the user from interacting with the checkbox */
  disabled?: boolean
  /**
   * The value given as data when submitted with a `name`.
   *  @defaultValue "on"
   */
  value?: AcceptableValue
  /** Id of the element */
  id?: string
  /**
   * The value used when the checkbox is checked. Defaults to `true`.
   */
  trueValue?: T
  /**
   * The value used when the checkbox is unchecked. Defaults to `false`.
   */
  falseValue?: T
}

export type CheckboxRootEmits<T = boolean> = {
  /** Event handler called before the value of the checkbox changes; `details.cancel()` vetoes the change. */
  'beforeUpdate:modelValue': [value: T | 'indeterminate', details: ChangeEventDetails<CheckboxChangeReason>]
  /** Event handler called when the value of the checkbox changes. */
  'update:modelValue': [value: T | 'indeterminate', details: ChangeEventDetails<CheckboxChangeReason>]
}

export interface CheckboxRootContext {
  disabled: Ref<boolean>
  state: Ref<CheckedState>
}

export const [injectCheckboxRootContext, provideCheckboxRootContext]
  = createContext<CheckboxRootContext>('CheckboxRoot')
</script>

<script setup lang="ts" generic="T = boolean">
import { computed, mergeProps, useAttrs } from 'vue'
import { Primitive } from '@/Primitive'
import { RovingFocusItem } from '@/RovingFocus'
import { VisuallyHiddenInput } from '@/VisuallyHidden'
import { useCheckbox } from './useCheckbox'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<CheckboxRootProps<T>>(), {
  modelValue: undefined,
  value: 'on',
  as: 'button',
  trueValue: (() => true) as unknown as undefined,
  falseValue: (() => false) as unknown as undefined,
})
const emits = defineEmits<CheckboxRootEmits<T>>()

defineSlots<{
  default?: (props: {
    /** Current value */
    modelValue: typeof modelValue.value
    /** Current state */
    state: typeof checkboxState.value
  }) => any
}>()

const { forwardRef, currentElement } = useForwardExpose()

const checkboxGroupContext = injectCheckboxGroupRootContext(null)

// Controlled/uncontrolled + `beforeUpdate:` / `update:` emits live in the
// composable's `useControllableState` (`modelValue === undefined` → uncontrolled).
// Group membership (checked state + press toggling) lives there too, keyed on
// the injected group context.
const checkbox = useCheckbox<T>({
  modelValue: () => props.modelValue,
  defaultValue: props.defaultValue,
  emit: emits,
  disabled: () => props.disabled,
  required: () => props.required,
  value: () => props.value,
  trueValue: () => props.trueValue as T,
  falseValue: () => props.falseValue as T,
  group: checkboxGroupContext,
})
const { checkedState: checkboxState, disabled, root, context } = checkbox
// Slot type parity with v2 (`useVModel(...) as Ref<T | 'indeterminate'>`).
const modelValue = checkbox.modelValue as ComputedRef<T | 'indeterminate'>

const isFormControl = useFormControl(currentElement)
// The hidden form input is rendered as a sibling (not nested) of the interactive
// control to avoid the `nested-interactive` a11y violation. That makes this a
// multi-root component, so the parent's scoped-style id must be forwarded manually.
const scopeIdAttrs = useForwardScopeId()
const attrs = useAttrs()
const ariaLabel = computed(() => {
  // An explicit `aria-label` always wins, so skip the (potentially expensive)
  // label lookup entirely — this matters when rendering many checkboxes at once.
  if (attrs['aria-label'])
    return undefined
  return props.id && currentElement.value
    ? (getRootNode(currentElement.value).querySelector(`[for="${props.id}"]`) as HTMLLabelElement)?.innerText
    : undefined
})

provideCheckboxRootContext(context)

// Precedence is part of the v2 contract: `{ ...$attrs, ...scopeIdAttrs }` was
// bound BEFORE the component's own `role` / `aria-*` / `data-*` / `disabled`,
// so the component's attributes win over a consumer's for the same key, while
// same-named listeners chain consumer-first (a consumer `@click` observes the
// pre-toggle model). `mergeProps($attrs, scopeIdAttrs, root.attrs.value)` keeps
// exactly that order; the explicit bindings that follow it in the template win
// over all three, as they did before.
</script>

<template>
  <component
    v-bind="mergeProps($attrs, scopeIdAttrs, root.attrs.value)"
    :is="checkboxGroupContext?.rovingFocus.value ? RovingFocusItem : Primitive"
    :id="id"
    :ref="forwardRef"
    :as-child="asChild"
    :as="as"
    :type="as === 'button' ? 'button' : undefined"
    :aria-label="$attrs['aria-label'] || ariaLabel"
    :focusable="checkboxGroupContext?.rovingFocus.value ? !disabled : undefined"
  >
    <slot
      :model-value="modelValue"
      :state="checkboxState"
    />
  </component>

  <VisuallyHiddenInput
    v-if="isFormControl && name && !checkboxGroupContext"
    type="checkbox"
    :checked="!!checkboxState"
    :name="name"
    :value="value"
    :disabled="disabled"
    :required="required"
    v-bind="scopeIdAttrs"
  />
</template>
