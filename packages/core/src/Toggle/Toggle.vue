<script lang="ts">
import type { ToggleChangeReason } from './useTogglePressed'
import type { PrimitiveProps } from '@/Primitive'
import type { ChangeEventDetails } from '@/shared'
import type { FormFieldProps } from '@/shared/types'
import { useFormControl, useForwardExpose, useForwardScopeId } from '@/shared'
import { injectToggleGroupRootContext } from '@/ToggleGroup/ToggleGroupRoot.vue'
import VisuallyHiddenInput from '@/VisuallyHidden/VisuallyHiddenInput.vue'

export type ToggleEmits = {
  /** Event handler called before the value of the toggle changes; `details.cancel()` vetoes the change. */
  'beforeUpdate:modelValue': [value: boolean, details: ChangeEventDetails<ToggleChangeReason>]
  /** Event handler called when the value of the toggle changes. */
  'update:modelValue': [value: boolean, details: ChangeEventDetails<ToggleChangeReason>]
}

export interface ToggleProps extends PrimitiveProps, FormFieldProps {
  /**
   * The pressed state of the toggle when it is initially rendered. Use when you do not need to control its open state.
   */
  defaultValue?: boolean
  /**
   * The controlled pressed state of the toggle. Can be bind as `v-model`.
   */
  modelValue?: boolean | null
  /**
   * When `true`, prevents the user from interacting with the toggle.
   */
  disabled?: boolean
}
</script>

<script setup lang="ts">
import type { ComputedRef } from 'vue'
import { computed, mergeProps } from 'vue'
import { Primitive } from '@/Primitive'
import { useTogglePressed } from './useTogglePressed'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<ToggleProps>(), {
  modelValue: undefined,
  disabled: false,
  as: 'button',
})

const emits = defineEmits<ToggleEmits>()

defineSlots<{
  default?: (props: {
    /** Current value */
    modelValue: typeof modelValue.value
    /** Current state */
    state: typeof root.state.value.state
    /** Current pressed state */
    pressed: typeof modelValue.value
    /** Current disabled state */
    disabled: boolean
  }) => any
}>()

const { forwardRef, currentElement } = useForwardExpose()
// Hidden form input is a sibling (not nested) of the control to avoid the
// `nested-interactive` a11y violation; forward the parent scope id for scoped styles.
const scopeIdAttrs = useForwardScopeId()
const toggleGroupContext = injectToggleGroupRootContext(null)

// Controlled/uncontrolled + `beforeUpdate:` / `update:` emits live in the
// composable's `useControllableState` (`modelValue === undefined` → uncontrolled;
// `null` is controlled and reads through, exactly as `useVModel` did).
const toggle = useTogglePressed({
  modelValue: () => props.modelValue,
  defaultValue: props.defaultValue,
  disabled: () => props.disabled,
  emit: emits,
})
const { root } = toggle
// Slot type parity with v2 (`useVModel(...) as Ref<boolean>`).
const modelValue = toggle.modelValue as ComputedRef<boolean>

const isFormControl = useFormControl(currentElement)

// Listener order is part of the v2 contract: `v-bind="$attrs"` sat AFTER the
// `aria-*` / `data-*` / `disabled` bindings (a consumer attribute wins) but
// BEFORE `@click` (a consumer listener runs first and observes the pre-toggle
// model). `mergeProps` chains same-named listeners in argument order, so the
// composable's click handler is bound separately below, after `$attrs`.
const rootAttrs = computed(() => {
  const { onClick: _onClick, ...attrs } = root.attrs.value
  return attrs
})
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :type="as === 'button' ? 'button' : undefined"
    :as-child="props.asChild"
    :as="as"
    v-bind="mergeProps(rootAttrs, scopeIdAttrs, $attrs)"
    @click="root.props.value.onClick"
  >
    <slot
      :model-value="modelValue"
      :disabled="disabled"
      :pressed="modelValue"
      :state="root.state.value.state"
    />
  </Primitive>

  <VisuallyHiddenInput
    v-if="isFormControl && name && !toggleGroupContext"
    type="checkbox"
    :name="name"
    :value="modelValue"
    :required="required"
    v-bind="scopeIdAttrs"
  />
</template>
