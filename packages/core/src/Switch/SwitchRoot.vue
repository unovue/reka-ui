<script lang="ts">
import type { ComputedRef, Ref } from 'vue'
import type { SwitchChangeReason } from './useSwitch'
import type { PrimitiveProps } from '@/Primitive'
import type { ChangeEventDetails } from '@/shared'
import type { FormFieldProps } from '@/shared/types'
import { createContext, getRootNode, useFormControl, useForwardElement, useForwardScopeId } from '@/shared'

export interface SwitchRootProps<TrueValue = boolean, FalseValue = TrueValue> extends PrimitiveProps, FormFieldProps {
  /** The state of the switch when it is initially rendered. Use when you do not need to control its state. */
  defaultValue?: NoInfer<TrueValue | FalseValue>
  /** The controlled state of the switch. Can be bind as `v-model`. */
  modelValue?: NoInfer<TrueValue | FalseValue> | null
  /** When `true`, prevents the user from interacting with the switch. */
  disabled?: boolean
  id?: string
  /** The value given as data when submitted with a `name`. */
  value?: string
  /**
   * The value used when the switch is on. Defaults to `true`.
   */
  trueValue?: TrueValue
  /**
   * The value used when the switch is off. Defaults to `false`.
   */
  falseValue?: FalseValue
}

export type SwitchRootEmits<TrueValue = boolean, FalseValue = TrueValue> = {
  /** Event handler called before the value of the switch changes; `details.cancel()` vetoes the change. */
  'beforeUpdate:modelValue': [payload: TrueValue | FalseValue, details: ChangeEventDetails<SwitchChangeReason>]
  /** Event handler called when the value of the switch changes. */
  'update:modelValue': [payload: TrueValue | FalseValue, details: ChangeEventDetails<SwitchChangeReason>]
}

export interface SwitchRootContext {
  checked: ComputedRef<boolean>
  toggleCheck: () => void
  disabled: Ref<boolean>
}

export const [injectSwitchRootContext, provideSwitchRootContext]
  = createContext<SwitchRootContext>('SwitchRoot')
</script>

<script setup lang="ts" generic="TrueValue = true, FalseValue = false">
import { computed, mergeProps, watch } from 'vue'
import { useFieldControl } from '@/Field/useFieldControl'
import { renderAs } from '@/Primitive/renderAs'
import { vFormReset } from '@/shared/formReset'
import { resetControllableState } from '@/shared/useControllableState'
import { VisuallyHiddenInput } from '@/VisuallyHidden'
import { useSwitch } from './useSwitch'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<SwitchRootProps<TrueValue, FalseValue>>(), {
  as: 'button',
  modelValue: undefined,
  value: 'on',
  trueValue: (() => true) as unknown as undefined,
  falseValue: (() => false) as unknown as undefined,
})
const emit = defineEmits<SwitchRootEmits<TrueValue, FalseValue>>()

defineSlots<{
  default?: (props: {
    /** Current value */
    modelValue: typeof modelValue.value
    /** Whether the switch is checked */
    checked: typeof checked.value
  }) => any
}>()

const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)
const scopeIdAttrs = useForwardScopeId()
const isFormControl = useFormControl(currentElement)

// Optional Field participation: `null` outside a `FieldRoot`, so every
// binding below is inert without a Field.
const field = useFieldControl({
  id: () => props.id,
  element: () => currentElement.value as HTMLElement | undefined,
  getValue: () => checked.value,
  required: () => props.required,
  // A required switch must be on.
  isFilled: value => value === true,
})
// Getters rather than computeds: cheap, and free for a standalone switch.
const resolvedId = () => field ? field.id() : props.id
const resolvedName = () => field ? field.name(props.name) : props.name
const resolvedRequired = () => field ? field.required(props.required) : props.required

// DOM-bound: resolves the associated `[for]` label text through the element's
// root (shadow-safe, #2792). Stays in the shell (needs `currentElement`,
// SSR-guarded) — not in the composable.
const ariaLabel = computed(() => resolvedId() && currentElement.value ? (getRootNode(currentElement.value).querySelector(`[for="${resolvedId()}"]`) as HTMLLabelElement)?.innerText : undefined)

// Controlled/uncontrolled + `beforeUpdate:` / `update:` emits live in the
// composable's `useControllableState` (`modelValue === undefined` → uncontrolled).
const { modelValue, checked, disabled, root, context, isControlled } = useSwitch<TrueValue | FalseValue>({
  modelValue: () => props.modelValue as TrueValue | FalseValue | undefined,
  defaultValue: props.defaultValue,
  emit,
  // The Field hears its own commits by reason (`change`): user input, or, for
  // a programmatic one (`setModelValue` and the like), only the watcher below,
  // which also reports a parent-driven change.
  onUpdate: field ? (value, details) => field.change(value === props.trueValue, details) : undefined,
  disabled: () => field ? field.disabled(props.disabled) : props.disabled,
  required: resolvedRequired,
  value: () => props.value,
  trueValue: () => props.trueValue as TrueValue,
  falseValue: () => props.falseValue as FalseValue,
})

provideSwitchRootContext(context)

// A native reset of the owning form puts the value back to `defaultValue`.
function onFormReset(event: Event) { resetControllableState(isControlled, event) }

if (field)
  watch(checked, value => field.sync(value))

// Listener order is part of the v2 contract: `v-bind="$attrs"` sat AFTER the
// component's `role` / `aria-*` / `data-*` bindings (a consumer attribute wins)
// but BEFORE `@click` / `@keydown` (a consumer listener runs first and observes
// the pre-toggle model). `mergeProps` chains same-named listeners in argument
// order, so the composable's handlers are bound separately below, after `$attrs`.
const rootAttrs = computed(() => {
  const { onClick: _onClick, onKeydown: _onKeydown, ...attrs } = root.attrs.value
  return attrs
})

// `$attrs` isn't reactive, so the Field's wiring is read during render. Its
// state attributes fill in what the switch leaves unset; its aria ids are
// merged with the consumer's.
function renderAttrs(attrs: Record<string, unknown>) {
  if (!field)
    return mergeProps(rootAttrs.value, scopeIdAttrs, attrs)
  return field.fillDataAttributes(mergeProps(
    rootAttrs.value,
    scopeIdAttrs,
    attrs,
    { ...field.ariaAttrs(attrs, disabled.value), onFocus: field.onFocus, onBlur: field.onBlur },
  ))
}
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :id="resolvedId()"
    :ref="forwardRef"
    v-form-reset="onFormReset"
    :type="as === 'button' ? 'button' : undefined"
    :aria-label="$attrs['aria-label'] || ariaLabel"
    v-bind="renderAttrs($attrs)"
    @click="root.props.value.onClick"
    @keydown="root.props.value.onKeydown"
  >
    <slot
      :model-value="modelValue"
      :checked="checked"
    />
  </component>

  <VisuallyHiddenInput
    v-if="isFormControl && resolvedName()"
    type="checkbox"
    :name="resolvedName()!"
    :disabled="disabled"
    :required="resolvedRequired()"
    :value="value"
    :checked="checked"
    v-bind="scopeIdAttrs"
  />
</template>
