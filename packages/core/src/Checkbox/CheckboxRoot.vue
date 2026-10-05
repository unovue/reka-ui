<script lang="ts">
import type { Ref } from 'vue'
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
import { isEqual } from 'ohash'
import { computed, mergeProps, onBeforeUnmount, onMounted, useAttrs, watch } from 'vue'
import { injectFieldRootContext } from '@/Field'
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

// Optional Field participation: `injectFieldRootContext(null)` returns
// `null` (instead of throwing) outside a `FieldRoot`, so every binding below
// is inert when there is no Field.
const fieldContext = injectFieldRootContext(null)

// Checkboxes inside a `CheckboxGroupRoot` share one Field, so none of them
// takes the field's id (it would be duplicated) or acts as its control.
const participatesAsControl = computed(() => Boolean(fieldContext) && !checkboxGroupContext)
const resolvedId = computed(() => props.id ?? (participatesAsControl.value ? fieldContext?.fieldId.value : undefined))
const resolvedName = computed(() => props.name ?? fieldContext?.name.value)
// `required` is a plain (non-optional-default) `Boolean` prop, so Vue casts
// it to `false` rather than `undefined` when omitted — `props.required` can
// never actually be `undefined`. Only fall back to the Field's `required`
// when a Field is present, so standalone output (where this cast has always
// applied) is untouched.
const resolvedRequired = computed(() => (fieldContext ? (props.required || fieldContext.required.value) : props.required))

// Controlled/uncontrolled + `beforeUpdate:` / `update:` emits live in the
// composable's `useControllableState` (`modelValue === undefined` → uncontrolled).
// Group membership (checked state + press toggling, the group's `max`) lives
// there too, keyed on the injected group context. `disabled` is the explicit
// one (prop, group or Field): natively disabled and unfocusable.
const { modelValue, checkedState: checkboxState, disabled, root, context } = useCheckbox<T>({
  modelValue: () => props.modelValue,
  defaultValue: props.defaultValue,
  emit: emits,
  // Only a committed press is user input for the Field; a programmatic or
  // parent-driven change is reported through the `checkboxState` watcher below.
  onUpdate: (value, details) => {
    if (details.reason === 'trigger-press' && participatesAsControl.value)
      fieldContext?.handleControlInput({ value: isEqual(value, props.trueValue) })
  },
  disabled: () => Boolean(props.disabled || fieldContext?.disabled.value),
  required: resolvedRequired,
  value: () => props.value,
  trueValue: () => props.trueValue as T,
  falseValue: () => props.falseValue as T,
  group: checkboxGroupContext,
})

// A programmatic/parent-driven change updates `filled`, but isn't dirtying.
watch(checkboxState, (state) => {
  if (participatesAsControl.value)
    fieldContext?.reportControlState({ filled: state === true })
})

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
    ? (getRootNode(currentElement.value).querySelector(`[for="${resolvedId.value}"]`) as HTMLLabelElement)?.innerText
    : undefined
})

// Field aria wiring, merged with (never overwriting) the consumer's values.
// `attrs` isn't reactive, so this runs during render rather than in a
// `computed`. A consumer-provided `aria-invalid` always wins — read it
// explicitly, since this object is merged after `$attrs` and would otherwise
// clobber it (even with an `undefined` value).
function getFieldAriaAttrs() {
  const mergeIds = (consumerValue: unknown, fieldValue: string | undefined) =>
    [consumerValue as string | undefined, fieldValue].filter(Boolean).join(' ') || undefined
  return {
    'aria-labelledby': mergeIds(attrs['aria-labelledby'], participatesAsControl.value ? fieldContext?.labelId.value : undefined),
    'aria-describedby': mergeIds(attrs['aria-describedby'], fieldContext?.describedBy.value),
    'aria-invalid': attrs['aria-invalid'] ?? (fieldContext?.invalid.value || undefined),
  }
}

function handleFocus() {
  fieldContext?.handleControlFocus()
}
function handleBlur() {
  if (participatesAsControl.value)
    fieldContext?.handleControlBlur()
  else
    fieldContext?.reportControlState({ focused: false, touched: true })
}

let unregisterControl: (() => void) | undefined
onMounted(() => {
  if (!participatesAsControl.value)
    return
  unregisterControl = fieldContext?.registerControl({
    id: () => resolvedId.value,
    element: () => currentElement.value as HTMLElement | undefined,
    getValue: () => checkboxState.value,
    required: () => props.required,
    // A required checkbox must be checked.
    isFilled: value => value === true,
  })
})
onBeforeUnmount(() => unregisterControl?.())

provideCheckboxRootContext(context)

// Precedence is part of the v2 contract: the Field's data attributes, then
// `$attrs` and `scopeIdAttrs`, were bound BEFORE the component's own `role` /
// `aria-*` / `data-*` / `disabled`, so the component's attributes win over a
// consumer's for the same key, while same-named listeners chain consumer-first
// (a consumer `@click` observes the pre-toggle model). `mergeProps` keeps
// exactly that order; the explicit bindings that follow it in the template win
// over all of them, as they did before.
</script>

<template>
  <component
    v-bind="mergeProps(fieldContext?.dataAttributes.value ?? {}, $attrs, scopeIdAttrs, getFieldAriaAttrs(), root.attrs.value)"
    :is="checkboxGroupContext?.rovingFocus.value ? RovingFocusItem : Primitive"
    :id="resolvedId"
    :ref="forwardRef"
    :as-child="asChild"
    :as="as"
    :type="as === 'button' ? 'button' : undefined"
    :aria-label="$attrs['aria-label'] || ariaLabel"
    :focusable="checkboxGroupContext?.rovingFocus.value ? !disabled : undefined"
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
