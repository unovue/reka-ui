<script lang="ts">
import type { Ref } from 'vue'
import type { CheckedState } from './utils'
import type { PrimitiveProps } from '@/Primitive'
import type { AcceptableValue, FormFieldProps } from '@/shared/types'
import { useVModel } from '@vueuse/core'
import { createContext, isNullish, isValueEqualOrExist, useFormControl, useForwardExpose, useForwardScopeId } from '@/shared'
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
  /** Event handler called when the value of the checkbox changes. */
  'update:modelValue': [value: T | 'indeterminate']
}

interface CheckboxRootContext {
  disabled: Ref<boolean>
  state: Ref<CheckedState>
}

export const [injectCheckboxRootContext, provideCheckboxRootContext]
  = createContext<CheckboxRootContext>('CheckboxRoot')
</script>

<script setup lang="ts" generic="T = boolean">
import { isEqual } from 'ohash'
import { computed, onBeforeUnmount, onMounted, useAttrs } from 'vue'
import { injectFieldRootContext } from '@/Field'
import { Primitive } from '@/Primitive'
import { RovingFocusItem } from '@/RovingFocus'
import { VisuallyHiddenInput } from '@/VisuallyHidden'
import { getState, isIndeterminate } from './utils'

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

// Optional Field participation: `injectFieldRootContext(null)` returns
// `null` (instead of throwing) outside a `FieldRoot`, so every binding below
// is inert — and byte-for-byte identical to before — when there is no Field.
const fieldContext = injectFieldRootContext(null)

const modelValue = useVModel(props as any, 'modelValue', emits as any, {
  defaultValue: props.defaultValue ?? props.falseValue,
  passive: (props.modelValue === undefined) as false,
}) as Ref<T | 'indeterminate'>

const disabled = computed(() => Boolean(checkboxGroupContext?.disabled.value || props.disabled || fieldContext?.disabled.value))
const resolvedId = computed(() => props.id ?? fieldContext?.fieldId.value)
const resolvedName = computed(() => props.name ?? fieldContext?.name.value)
// `required` is a plain (non-optional-default) `Boolean` prop, so Vue casts
// it to `false` rather than `undefined` when omitted — `props.required` can
// never actually be `undefined`. Only fall back to the Field's `required`
// when a Field is present, so standalone output (where this cast has always
// applied) is untouched.
const resolvedRequired = computed(() => (fieldContext ? (props.required || fieldContext.required.value) : props.required))

const isChecked = computed(() => isEqual(modelValue.value, props.trueValue))

const checkboxState = computed<CheckedState>(() => {
  if (!isNullish(checkboxGroupContext?.modelValue.value)) {
    return isValueEqualOrExist(checkboxGroupContext.modelValue.value, props.value)
  }
  else {
    if (modelValue.value === 'indeterminate')
      return 'indeterminate'
    return isChecked.value
  }
})

function handleClick() {
  if (!isNullish(checkboxGroupContext?.modelValue.value)) {
    const modelValueArray = [...(checkboxGroupContext.modelValue.value || [])]
    if (isValueEqualOrExist(modelValueArray, props.value)) {
      const index = modelValueArray.findIndex(i => isEqual(i, props.value))
      modelValueArray.splice(index, 1)
    }
    else {
      modelValueArray.push(props.value)
    }
    checkboxGroupContext.modelValue.value = modelValueArray
  }
  else {
    if (modelValue.value === 'indeterminate') {
      modelValue.value = props.trueValue as T
    }
    else {
      modelValue.value = isChecked.value ? props.falseValue as T : props.trueValue as T
    }
  }

  fieldContext?.reportControlState({ dirty: true, filled: isChecked.value })
}

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
  return resolvedId.value && currentElement.value
    ? (document.querySelector(`[for="${resolvedId.value}"]`) as HTMLLabelElement)?.innerText
    : undefined
})

// Merge (never overwrite) a consumer-provided `aria-describedby` with the
// ids accumulated by the ancestor Field's `FieldDescription`/`FieldError`.
const mergedDescribedBy = computed(() => {
  const consumerValue = attrs['aria-describedby'] as string | undefined
  return [consumerValue, fieldContext?.describedBy.value].filter(Boolean).join(' ') || undefined
})

// A consumer-provided `aria-invalid` always wins — read it explicitly rather
// than relying on the `$attrs` spread order, since our own explicit binding
// below is written after that spread and would otherwise clobber it (even
// with an `undefined` value) once merged.
const mergedAriaInvalid = computed(() => {
  const consumerValue = attrs['aria-invalid'] as string | boolean | undefined
  return consumerValue ?? (fieldContext?.invalid.value || undefined)
})

function handleFocus() {
  fieldContext?.reportControlState({ focused: true })
}
function handleBlur() {
  fieldContext?.reportControlState({ focused: false, touched: true })
}

onMounted(() => {
  fieldContext?.setControlElement(currentElement.value as HTMLElement | undefined)
})
onBeforeUnmount(() => {
  fieldContext?.setControlElement(undefined)
})

provideCheckboxRootContext({
  disabled,
  state: checkboxState,
})
</script>

<template>
  <component
    v-bind="{ ...$attrs, ...scopeIdAttrs }"
    :is="checkboxGroupContext?.rovingFocus.value ? RovingFocusItem : Primitive"
    :id="resolvedId"
    :ref="forwardRef"
    role="checkbox"
    :as-child="asChild"
    :as="as"
    :type="as === 'button' ? 'button' : undefined"
    :aria-checked="isIndeterminate(checkboxState) ? 'mixed' : checkboxState"
    :aria-required="resolvedRequired"
    :aria-label="$attrs['aria-label'] || ariaLabel"
    :aria-describedby="mergedDescribedBy"
    :aria-invalid="mergedAriaInvalid"
    :data-state="getState(checkboxState)"
    :data-disabled="disabled ? '' : undefined"
    :disabled="disabled"
    :focusable="checkboxGroupContext?.rovingFocus.value ? !disabled : undefined"
    @keydown.enter.prevent="() => {
      // According to WAI ARIA, Checkboxes don't activate on enter keypress
    }"
    @click="handleClick"
    @focus="handleFocus"
    @blur="handleBlur"
  >
    <slot
      :model-value="modelValue"
      :state="checkboxState"
    />
  </component>

  <VisuallyHiddenInput
    v-if="isFormControl && resolvedName && !checkboxGroupContext"
    type="checkbox"
    :checked="!!checkboxState"
    :name="resolvedName"
    :value="value"
    :disabled="disabled"
    :required="resolvedRequired"
    v-bind="scopeIdAttrs"
  />
</template>
