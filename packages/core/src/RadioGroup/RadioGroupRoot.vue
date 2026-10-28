<script lang="ts">
import type { Ref } from 'vue'
import type { RadioGroupChangeReason } from './useRadioGroup'
import type { PrimitiveProps } from '@/Primitive'
import type { BaseChangeReason, ChangeEventDetails } from '@/shared'
import type { AcceptableValue, DataOrientation, Direction, FormFieldProps } from '@/shared/types'
import { createContext, useDirection, useFormControl, useForwardElement } from '@/shared'

export interface RadioGroupRootProps extends PrimitiveProps, FormFieldProps {
  /** The controlled value of the radio item to check. Can be binded as `v-model`. */
  modelValue?: AcceptableValue
  /**
   * The value of the radio item that should be checked when initially rendered.
   *
   * Use when you do not need to control the state of the radio items.
   */
  defaultValue?: AcceptableValue
  /** When `true`, prevents the user from interacting with radio items. */
  disabled?: boolean
  /** The orientation of the component. */
  orientation?: DataOrientation
  /** The reading direction of the combobox when applicable. <br> If omitted, inherits globally from `ConfigProvider` or assumes LTR (left-to-right) reading mode. */
  dir?: Direction
  /** When `true`, keyboard navigation will loop from last item to first, and vice versa. */
  loop?: boolean
}
export type RadioGroupRootEmits = {
  /** Event handler called before the radio group value changes; call `details.cancel()` to keep the current value */
  'beforeUpdate:modelValue': [payload: AcceptableValue, details: ChangeEventDetails<RadioGroupChangeReason>]
  /** Event handler called when the radio group value changes */
  'update:modelValue': [payload: AcceptableValue, details: ChangeEventDetails<RadioGroupChangeReason>]
}

export interface RadioGroupRootContext {
  modelValue?: Readonly<Ref<AcceptableValue | undefined>>
  /** Returns `false` when the value is unchanged or the change was cancelled. */
  changeModelValue: (value?: AcceptableValue, reason?: RadioGroupChangeReason | BaseChangeReason, event?: Event) => boolean
  disabled: Ref<boolean>
  loop: Ref<boolean>
  orientation: Ref<DataOrientation | undefined>
  name?: string
  required: Ref<boolean>
}

export const [injectRadioGroupRootContext, provideRadioGroupRootContext]
  = createContext<RadioGroupRootContext>('RadioGroupRoot')
</script>

<script setup lang="ts">
import { mergeProps } from 'vue'
import { renderAs } from '@/Primitive/renderAs'
import { useRovingFocusGroup } from '@/RovingFocus/useRovingFocusGroup'
import { VisuallyHiddenInput } from '@/VisuallyHidden'
import { useRadioGroup } from './useRadioGroup'
import { useArrowKeyListeners } from './utils'

defineOptions({
  // `$attrs` are merged under the roving and root bindings: the precedence
  // the former `<RovingFocusGroup as-child>` wrapper gave them.
  inheritAttrs: false,
})

const props = withDefaults(defineProps<RadioGroupRootProps>(), {
  disabled: false,
  required: false,
  orientation: undefined,
  loop: true,
})

const emits = defineEmits<RadioGroupRootEmits>()

defineSlots<{
  default?: (props: {
    /** Current input values */
    modelValue: typeof modelValue.value
  }) => any
}>()

const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)

// `dir` resolution (ConfigProvider-aware) stays in the shell; the composable
// owns the controlled/uncontrolled model (`useControllableState`) and emits.
const dir = useDirection(() => props.dir)
const isFormControl = useFormControl(currentElement)

const { modelValue, root, context } = useRadioGroup({
  modelValue: () => props.modelValue,
  defaultValue: props.defaultValue,
  emit: emits,
  disabled: () => props.disabled,
  required: () => props.required,
  orientation: () => props.orientation,
  loop: () => props.loop,
  dir,
  name: () => props.name,
})

provideRadioGroupRootContext(context)

// Arrow-key navigation between the radios.
const roving = useRovingFocusGroup({
  element: currentElement,
  orientation: () => props.orientation,
  dir: () => dir.value,
  loop: () => props.loop,
})

// The window arrow-key flag the items read on focus (one shared pair of
// listeners, not one per item).
useArrowKeyListeners()
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="forwardRef"
    v-bind="mergeProps($attrs, roving.attrs(), root.attrs.value)"
  >
    <slot :model-value="modelValue" />

    <VisuallyHiddenInput
      v-if="isFormControl && name"
      :required="required"
      :disabled="disabled"
      :value="modelValue"
      :name="name"
    />
  </component>
</template>
