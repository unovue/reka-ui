<script lang="ts">
import type { Ref } from 'vue'
import type { CheckboxGroupChangeReason } from './useCheckboxGroup'
import type { RovingFocusGroupProps } from '@/RovingFocus'
import type { BaseChangeReason, ChangeEventDetails } from '@/shared'
import type { AcceptableValue, FormFieldProps } from '@/shared/types'
import { computed, toRefs } from 'vue'
import { Primitive, usePrimitiveElement } from '@/Primitive'
import { createContext, useDirection, useFormControl } from '@/shared'

export interface CheckboxGroupRootProps<T = AcceptableValue> extends Pick<RovingFocusGroupProps, 'as' | 'asChild' | 'dir' | 'orientation' | 'loop'>, FormFieldProps {
  /** The value of the checkbox when it is initially rendered. Use when you do not need to control its value. */
  defaultValue?: T[]
  /** The controlled value of the checkbox. Can be binded with v-model. */
  modelValue?: T[]
  /** When `false`, navigating through the items using arrow keys will be disabled. */
  rovingFocus?: boolean
  /** When `true`, prevents the user from interacting with the checkboxes */
  disabled?: boolean
}

export type CheckboxGroupRootEmits<T = AcceptableValue> = {
  /** Event handler called before the value of the checkbox group changes; `details.cancel()` vetoes the change. */
  'beforeUpdate:modelValue': [value: T[], details: ChangeEventDetails<CheckboxGroupChangeReason>]
  /** Event handler called when the value of the checkbox changes. */
  'update:modelValue': [value: T[], details: ChangeEventDetails<CheckboxGroupChangeReason>]
}

export interface CheckboxGroupRootContext {
  modelValue: Ref<AcceptableValue[]>
  rovingFocus: Ref<boolean>
  disabled: Ref<boolean>
  /**
   * Route every write through the group's model (`beforeUpdate` + `update`);
   * returns `false` when unchanged or cancelled. Descendants never assign
   * `modelValue.value` directly.
   */
  changeModelValue: (value: AcceptableValue[], reason?: CheckboxGroupChangeReason | BaseChangeReason, event?: Event) => boolean
}

export const [injectCheckboxGroupRootContext, provideCheckboxGroupRootContext]
  = createContext<CheckboxGroupRootContext>('CheckboxGroupRoot')
</script>

<script setup lang="ts" generic="T extends AcceptableValue = AcceptableValue">
import { RovingFocusGroup } from '@/RovingFocus'
import { VisuallyHiddenInput } from '@/VisuallyHidden'
import { useCheckboxGroup } from './useCheckboxGroup'

const props = withDefaults(defineProps<CheckboxGroupRootProps<T>>(), {
  rovingFocus: true,
})
const emits = defineEmits<CheckboxGroupRootEmits<T>>()

const { disabled, rovingFocus, dir: propDir } = toRefs(props)
const dir = useDirection(propDir)

const { primitiveElement, currentElement } = usePrimitiveElement()
const isFormControl = useFormControl(currentElement)

// Controlled/uncontrolled + `beforeUpdate:` / `update:` emits live in the
// composable's `useControllableState` (`modelValue === undefined` → uncontrolled).
const { modelValue, context } = useCheckboxGroup<T>({
  modelValue: () => props.modelValue,
  defaultValue: props.defaultValue,
  emit: emits,
  disabled,
  rovingFocus,
})

const rovingFocusProps = computed(() => {
  return rovingFocus.value ? { loop: props.loop, dir: dir.value, orientation: props.orientation } : {}
})

provideCheckboxGroupRootContext(context)
</script>

<template>
  <component
    :is="rovingFocus ? RovingFocusGroup : Primitive"
    ref="primitiveElement"
    :as="as"
    :as-child="asChild"
    v-bind="rovingFocusProps"
  >
    <slot />

    <VisuallyHiddenInput
      v-if="isFormControl && name"
      :name="name"
      :value="modelValue"
      :required="required"
    />
  </component>
</template>
