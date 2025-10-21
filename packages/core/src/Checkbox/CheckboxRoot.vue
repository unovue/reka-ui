<script lang="ts">
import type { Ref } from 'vue'
import type { CheckedState } from './utils'
import type { PrimitiveProps } from '@/Primitive'
import type { AcceptableValue, FormFieldProps } from '@/shared/types'
import { useVModel } from '@vueuse/core'
import { createContext, isNullish, isValueEqualOrExist, useFormControl, useForwardExpose } from '@/shared'
import { injectCheckboxGroupRootContext } from './CheckboxGroupRoot.vue'

export interface CheckboxRootProps<TCheckedState extends CheckedState = CheckedState> extends PrimitiveProps, FormFieldProps {
  /** The value of the checkbox when it is initially rendered. Use when you do not need to control its value. */
  defaultValue?: TCheckedState
  /** The controlled value of the checkbox. Can be binded with v-model. */
  modelValue?: TCheckedState | null
  /** When `true`, prevents the user from interacting with the checkbox */
  disabled?: boolean
  /**
   * The value given as data when submitted with a `name`.
   *  @defaultValue "on"
   */
  value?: AcceptableValue
  /** Id of the element */
  id?: string
}

export type CheckboxRootEmits<TCheckedState extends CheckedState = CheckedState> = {
  /** Event handler called when the value of the checkbox changes. */
  'update:modelValue': [value: TCheckedState]
}

interface CheckboxRootContext {
  disabled: Ref<boolean>
  state: Ref<CheckedState>
}

export const [injectCheckboxRootContext, provideCheckboxRootContext]
  = createContext<CheckboxRootContext>('CheckboxRoot')
</script>

<script setup lang="ts" generic="TCheckedState extends CheckedState = CheckedState">
import { isEqual } from 'ohash'
import { computed } from 'vue'
import { Primitive } from '@/Primitive'
import { RovingFocusItem } from '@/RovingFocus'
import { VisuallyHiddenInput } from '@/VisuallyHidden'
import { getState, isIndeterminate } from './utils'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<CheckboxRootProps<TCheckedState>>(), {
  modelValue: undefined,
  value: 'on',
  as: 'button',
})
const emits = defineEmits<CheckboxRootEmits<TCheckedState>>()

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

const modelValue = useVModel<CheckboxRootProps<TCheckedState>, 'modelValue', 'update:modelValue'>(props, 'modelValue', emits, {
  defaultValue: props.defaultValue,
  passive: (props.modelValue === undefined) as false,
}) as Ref<TCheckedState>

const disabled = computed(() => checkboxGroupContext?.disabled.value || props.disabled)

const checkboxState = computed<TCheckedState>(() => {
  if (!isNullish(checkboxGroupContext?.modelValue.value)) {
    return isValueEqualOrExist(checkboxGroupContext.modelValue.value, props.value) as TCheckedState
  }
  else {
    return modelValue.value === 'indeterminate' ? 'indeterminate' as TCheckedState : modelValue.value
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
    modelValue.value = isIndeterminate(modelValue.value) ? true as TCheckedState : !modelValue.value as TCheckedState
  }
}

const isFormControl = useFormControl(currentElement)
const ariaLabel = computed(() => props.id && currentElement.value
  ? (document.querySelector(`[for="${props.id}"]`) as HTMLLabelElement)?.innerText
  : undefined)

provideCheckboxRootContext({
  disabled,
  state: checkboxState,
})
</script>

<template>
  <component
    v-bind="$attrs"
    :is="checkboxGroupContext?.rovingFocus.value ? RovingFocusItem : Primitive"
    :id="id"
    :ref="forwardRef"
    role="checkbox"
    :as-child="asChild"
    :as="as"
    :type="as === 'button' ? 'button' : undefined"
    :aria-checked="isIndeterminate(checkboxState) ? 'mixed' : checkboxState === true ? 'true' : 'false'"
    :aria-required="required"
    :aria-label="$attrs['aria-label'] || ariaLabel"
    :data-state="getState(checkboxState)"
    :data-disabled="disabled ? '' : undefined"
    :disabled="disabled"
    :focusable="checkboxGroupContext?.rovingFocus.value ? !disabled : undefined"
    @keydown.enter.prevent="() => {
      // According to WAI ARIA, Checkboxes don't activate on enter keypress
    }"
    @click="handleClick"
  >
    <slot
      :model-value="modelValue"
      :state="checkboxState"
    />

    <VisuallyHiddenInput
      v-if="isFormControl && name && !checkboxGroupContext"
      type="checkbox"
      :checked="!!checkboxState"
      :name="name"
      :value="value"
      :disabled="disabled"
      :required="required"
    />
  </component>
</template>
