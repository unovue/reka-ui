<script lang="ts">
import type { Ref } from 'vue'
import type { CheckboxChangeReason } from './useCheckbox'
import type { CheckedState } from './utils'
import type { PrimitiveProps } from '@/Primitive'
import type { ChangeEventDetails } from '@/shared'
import type { AcceptableValue, FormFieldProps } from '@/shared/types'
import { createContext, getRootNode, useFormControl, useForwardElement, useForwardScopeId } from '@/shared'
import { injectCheckboxGroupRootContext } from './CheckboxGroupRoot.vue'

export interface CheckboxRootProps<TrueValue = boolean, FalseValue = TrueValue> extends PrimitiveProps, FormFieldProps {
  /** The value of the checkbox when it is initially rendered. Use when you do not need to control its value. */
  defaultValue?: NoInfer<TrueValue | FalseValue> | 'indeterminate'
  /** The controlled value of the checkbox. Can be binded with v-model. */
  modelValue?: NoInfer<TrueValue | FalseValue> | 'indeterminate' | null
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
  trueValue?: TrueValue
  /**
   * The value used when the checkbox is unchecked. Defaults to `false`.
   */
  falseValue?: FalseValue
}

export type CheckboxRootEmits<TrueValue = boolean, FalseValue = TrueValue> = {
  /** Event handler called before the value of the checkbox changes; `details.cancel()` vetoes the change. */
  'beforeUpdate:modelValue': [value: TrueValue | FalseValue | 'indeterminate', details: ChangeEventDetails<CheckboxChangeReason>]
  /** Event handler called when the value of the checkbox changes. */
  'update:modelValue': [value: TrueValue | FalseValue | 'indeterminate', details: ChangeEventDetails<CheckboxChangeReason>]
}

export interface CheckboxRootContext {
  disabled: Ref<boolean>
  state: Ref<CheckedState>
}

export const [injectCheckboxRootContext, provideCheckboxRootContext]
  = createContext<CheckboxRootContext>('CheckboxRoot')
</script>

<script setup lang="ts" generic="TrueValue = true, FalseValue = false">
import { computed, mergeProps, useAttrs, watch } from 'vue'
import { useFieldControl } from '@/Field/useFieldControl'
import { renderAs } from '@/Primitive/renderAs'
import { useRovingFocusItem } from '@/RovingFocus/useRovingFocusItem'
import { isEqual } from '@/shared/compare'
import { formResetBinder } from '@/shared/formReset'
import { resetControllableState } from '@/shared/useControllableState'
import { VisuallyHiddenInput } from '@/VisuallyHidden'
import { useCheckbox } from './useCheckbox'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<CheckboxRootProps<TrueValue, FalseValue>>(), {
  modelValue: undefined,
  value: 'on',
  as: 'button',
  trueValue: (() => true) as unknown as undefined,
  falseValue: (() => false) as unknown as undefined,
})
const emits = defineEmits<CheckboxRootEmits<TrueValue, FalseValue>>()

defineSlots<{
  default?: (props: {
    /** Current value */
    modelValue: typeof modelValue.value
    /** Current state */
    state: typeof checkboxState.value
  }) => any
}>()

const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)

const checkboxGroupContext = injectCheckboxGroupRootContext(null)

// Optional Field participation: `null` outside a `FieldRoot`, so every binding
// below is inert when there is no Field. Also `null` inside another control of
// the field (e.g. in a Combobox item), which owns it. Checkboxes inside a
// `CheckboxGroupRoot` share one Field, so none of them takes the field's id
// (it would be duplicated) or acts as its control. In a group that is the
// field's control (`groupField`), the checkbox only reads the field, and the
// group reports focus, marking the field touched once focus leaves all of it.
const field = useFieldControl({
  id: () => props.id,
  element: () => currentElement.value as HTMLElement | undefined,
  getValue: () => checkboxState.value,
  required: () => props.required,
  // A required checkbox must be checked.
  isFilled: value => value === true,
  participates: () => !checkboxGroupContext,
  groupField: checkboxGroupContext?.field,
})
// Getters rather than computeds: cheap, and free for a standalone checkbox.
const resolvedId = () => field ? field.id() : props.id
const resolvedName = () => field ? field.name(props.name) : props.name
const resolvedRequired = () => field ? field.required(props.required) : props.required

// Controlled/uncontrolled + `beforeUpdate:` / `update:` emits live in the
// composable's `useControllableState` (`modelValue === undefined` → uncontrolled).
// Group membership (checked state + press toggling, the group's `max`) lives
// there too, keyed on the injected group context. `disabled` is the explicit
// one (prop, group or Field): natively disabled and unfocusable.
const { modelValue, checkedState: checkboxState, disabled, root, context, isControlled } = useCheckbox<TrueValue | FalseValue>({
  modelValue: () => props.modelValue,
  defaultValue: props.defaultValue,
  emit: emits,
  // The Field hears its own commits by reason (`change`): user input, or, for
  // a programmatic one (`setModelValue` and the like), only the watcher below,
  // which also reports a parent-driven change.
  onUpdate: field ? (value, details) => field.change(isEqual(value, props.trueValue), details) : undefined,
  disabled: () => field ? field.disabled(props.disabled) : props.disabled,
  required: resolvedRequired,
  value: () => props.value,
  trueValue: () => props.trueValue as TrueValue,
  falseValue: () => props.falseValue as FalseValue,
  group: checkboxGroupContext,
})

// A programmatic/parent-driven change updates `filled`, but isn't dirtying.
// Both contexts are injected once, so outside a Field (or inside a group) the
// watcher could never report anything: skip it rather than queue a no-op job
// on every change.
if (field && !checkboxGroupContext)
  watch(checkboxState, state => field.sync(state))

// A native reset of the owning form puts the value back to `defaultValue`. A
// checkbox in a group is reset by the group.
const onFormReset = checkboxGroupContext ? undefined : (event: Event) => { resetControllableState(isControlled, event) }

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
  const id = resolvedId()
  return id && currentElement.value
    ? (getRootNode(currentElement.value).querySelector(`[for="${id}"]`) as HTMLLabelElement)?.innerText
    : undefined
})

provideCheckboxRootContext(context)

// In a `rovingFocus` group the checkbox is a roving item, as a composable (the
// former `RovingFocusItem` wrapper). The group renders `RovingFocusGroup` only
// when `rovingFocus` is set, and switching it remounts the checkboxes, so it is
// read once.
const roving = checkboxGroupContext?.rovingFocus.value
  ? useRovingFocusItem({ element: currentElement, focusable: () => !disabled.value })
  : null

// `attrs` isn't reactive, so the Field's wiring is read during render. Its aria
// ids are merged with (never overwriting) the consumer's, and a consumer
// `aria-invalid` wins: the binding reads it explicitly, since it merges after
// `attrs` here.
function renderAttrs() {
  const own = {
    'id': resolvedId(),
    'type': props.as === 'button' ? 'button' : undefined,
    'aria-label': attrs['aria-label'] || ariaLabel.value,
    'onFocus': field?.onFocus,
    'onBlur': field?.onBlur,
  }
  const merged = field
    ? mergeProps(field.dataAttributes(), attrs, scopeIdAttrs, { ...field.ariaAttrs(attrs, disabled.value) }, root.attrs.value, own)
    : mergeProps(attrs, scopeIdAttrs, root.attrs.value, own)
  // The roving bindings merge last, as the wrapper merged them over its attrs.
  return roving ? mergeProps(merged, roving.attrs()) : merged
}

// Precedence is part of the v2 contract: the Field's data attributes, then
// `$attrs` and `scopeIdAttrs`, were bound BEFORE the component's own `role` /
// `aria-*` / `data-*` / `disabled`, so the component's attributes win over a
// consumer's for the same key, while same-named listeners chain consumer-first
// (a consumer `@click` observes the pre-toggle model). `mergeProps` keeps
// exactly that order; the explicit bindings that follow it in the template win
// over all of them, as they did before.

const bindFormReset = formResetBinder(onFormReset)
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="forwardRef"
    v-bind="renderAttrs()"
    @vue:mounted="bindFormReset"
  >
    <slot
      :model-value="modelValue"
      :state="checkboxState"
    />
  </component>

  <VisuallyHiddenInput
    v-if="!checkboxGroupContext && resolvedName() && isFormControl"
    type="checkbox"
    :checked="!!checkboxState"
    :name="resolvedName()!"
    :value="value"
    :disabled="disabled"
    :required="resolvedRequired()"
    v-bind="scopeIdAttrs"
  />
</template>
