<script lang="ts">
import type { RadioGroupChangeReason } from './useRadioGroup'
import type { SelectEvent } from './utils'
import type { PrimitiveProps } from '@/Primitive'
import type { ChangeEventDetails } from '@/shared'
import type { AcceptableValue, FormFieldProps } from '@/shared/types'

export type RadioEmits = {
  /** Event handler called before the checked state changes; call `details.cancel()` to keep the current state */
  'beforeUpdate:checked': [value: boolean, details: ChangeEventDetails<RadioGroupChangeReason>]
  /** Event handler called when the checked state changes; `details.event` is the originating click */
  'update:checked': [value: boolean, details: ChangeEventDetails<RadioGroupChangeReason>]
  'select': [SelectEvent]
}

export interface RadioProps extends PrimitiveProps, FormFieldProps {
  id?: string
  /** The value given as data when submitted with a `name`. */
  value?: AcceptableValue
  /** When `true`, prevents the user from interacting with the radio item. */
  disabled?: boolean
  checked?: boolean
}
</script>

<script setup lang="ts">
import { computed, mergeProps } from 'vue'
import { Primitive } from '@/Primitive'
import { getRootNode, useControllableState, useFormControl, useForwardExpose, useForwardScopeId } from '@/shared'
import { VisuallyHiddenInput } from '@/VisuallyHidden'
import { getRadioSurface } from './useRadioGroup'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<RadioProps>(), {
  disabled: false,
  checked: undefined,
  as: 'button',
})
const emits = defineEmits<RadioEmits>()

defineSlots<{
  default?: (props: {
    /** Current checked state */
    checked: typeof checked.value
  }) => any
}>()

// Controlled (`RadioGroupItem` always passes `checked`) or uncontrolled (a bare
// `<Radio>`); `beforeUpdate:checked` / `update:checked` carry the details whose
// `event` `RadioGroupItem` forwards to the group's `changeModelValue`.
const { state: checked, setState: setChecked } = useControllableState<boolean, RadioGroupChangeReason>({
  prop: () => props.checked,
  defaultValue: false,
  name: 'checked',
  emit: emits,
})

const { forwardRef, currentElement: triggerElement } = useForwardExpose()
const isFormControl = useFormControl(triggerElement)
// Hidden form input is a sibling (not nested) of the control to avoid the
// `nested-interactive` a11y violation; forward the parent scope id for scoped styles.
const scopeIdAttrs = useForwardScopeId()

// DOM-bound: resolves the associated `[for]` label text through the element's
// root (shadow-safe). Stays in the shell (needs `triggerElement`, SSR-guarded).
const ariaLabel = computed(() => props.id && triggerElement.value ? (getRootNode(triggerElement.value).querySelector(`[for="${props.id}"]`) as HTMLLabelElement)?.innerText : undefined)

// role/aria-checked/disabled/value/required/name + data-state/data-disabled and
// the click protocol (`radio.select` → check → in-form propagation stop) come
// from the shared surface builder — the same derivation `useRadioGroup()`'s
// item surface composes. `isFormControl` is the one DOM-bound seam, injected.
const radio = getRadioSurface({
  checked,
  disabled: () => props.disabled,
  required: () => props.required,
  value: () => props.value,
  name: () => props.name,
  onSelect: event => emits('select', event),
  isFormControl,
  onCheckedChange: (value, event) => setChecked(value, 'item-press', event),
})

// Listener order is part of the contract: `v-bind="$attrs"` sat BEFORE
// `@click.stop` (a consumer listener runs first and observes the pre-check
// state). `mergeProps` chains same-named listeners in argument order, so the
// surface's `onClick` is bound separately below, after `$attrs`.
const radioAttrs = computed(() => {
  const { onClick: _onClick, ...attrs } = radio.attrs.value
  return attrs
})
</script>

<template>
  <Primitive
    :id="id"
    :ref="forwardRef"
    :type="as === 'button' ? 'button' : undefined"
    :as="as"
    :aria-label="ariaLabel"
    :as-child="asChild"
    v-bind="mergeProps(radioAttrs, scopeIdAttrs, $attrs)"
    @click="radio.props.value.onClick"
  >
    <slot :checked="checked" />
  </Primitive>

  <VisuallyHiddenInput
    v-if="isFormControl && name"
    type="radio"
    tabindex="-1"
    :value="value"
    :checked="!!checked"
    :name="name"
    :disabled="disabled"
    :required="required"
    v-bind="scopeIdAttrs"
  />
</template>
