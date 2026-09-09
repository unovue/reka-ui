<script lang="ts">
import type { ComputedRef, Ref } from 'vue'
import type { AcceptableValue, DataOrientation, Direction, FormFieldProps, SingleOrMultipleProps } from '../shared/types'
import type { ToggleGroupChangeReason } from './useToggleGroup'
import type { PrimitiveProps } from '@/Primitive'
import type { BaseChangeReason, ChangeEventDetails } from '@/shared'
import { createContext, useDirection, useFormControl, useForwardExpose } from '@/shared'
import VisuallyHiddenInput from '@/VisuallyHidden/VisuallyHiddenInput.vue'

export interface ToggleGroupRootProps<T = AcceptableValue | AcceptableValue[]>
  extends PrimitiveProps, FormFieldProps, SingleOrMultipleProps<T> {
  /** When `false`, navigating through the items using arrow keys will be disabled. */
  rovingFocus?: boolean
  /** When `true`, prevents the user from interacting with the toggle group and all its items. */
  disabled?: boolean
  /** The orientation of the component, which determines how focus moves: `horizontal` for left/right arrows and `vertical` for up/down arrows. */
  orientation?: DataOrientation
  /** The reading direction of the combobox when applicable. <br> If omitted, inherits globally from `ConfigProvider` or assumes LTR (left-to-right) reading mode. */
  dir?: Direction
  /** When `loop` and `rovingFocus` is `true`, keyboard navigation will loop from last item to first, and vice versa. */
  loop?: boolean
}
export type ToggleGroupRootEmits = {
  /** Event handler called before the value changes; call `details.cancel()` to keep the current value. */
  'beforeUpdate:modelValue': [payload: AcceptableValue | AcceptableValue[], details: ChangeEventDetails<ToggleGroupChangeReason>]
  /** Event handler called when the value changes. */
  'update:modelValue': [payload: AcceptableValue | AcceptableValue[], details: ChangeEventDetails<ToggleGroupChangeReason>]
}

export interface ToggleGroupRootContext {
  isSingle: ComputedRef<boolean>
  modelValue: Ref<AcceptableValue | AcceptableValue[] | undefined>
  /** Returns `false` when the value is unchanged or the change was cancelled. */
  changeModelValue: (value: AcceptableValue, reason?: ToggleGroupChangeReason | BaseChangeReason, event?: Event) => boolean
  dir?: Ref<Direction>
  orientation?: DataOrientation
  loop: Ref<boolean>
  rovingFocus: Ref<boolean>
  disabled?: Ref<boolean>
}

export const [injectToggleGroupRootContext, provideToggleGroupRootContext]
  = createContext<ToggleGroupRootContext>('ToggleGroupRoot')
</script>

<script setup lang="ts">
import { toRefs } from 'vue'
import { Primitive } from '@/Primitive'
import { RovingFocusGroup } from '@/RovingFocus'
import { useToggleGroup } from './useToggleGroup'

const props = withDefaults(defineProps<ToggleGroupRootProps>(), {
  loop: true,
  rovingFocus: true,
  disabled: false,
})
const emits = defineEmits<ToggleGroupRootEmits>()

defineSlots<{
  default?: (props: {
    /** Current toggle values */
    modelValue: typeof modelValue.value
  }) => any
}>()

// `dir` resolution (ConfigProvider-aware) stays in the shell; the composable
// owns the single/multiple model (`useControllableState`) and the emits.
const { dir: propDir } = toRefs(props)
const dir = useDirection(propDir)
const { forwardRef, currentElement } = useForwardExpose()

const { modelValue, root, context } = useToggleGroup({
  type: () => props.type,
  modelValue: () => props.modelValue,
  defaultValue: props.defaultValue,
  emit: emits,
  disabled: () => props.disabled,
  orientation: props.orientation,
  dir,
  loop: () => props.loop,
  rovingFocus: () => props.rovingFocus,
})
const isFormControl = useFormControl(currentElement)

provideToggleGroupRootContext(context)
</script>

<template>
  <component
    :is="rovingFocus ? RovingFocusGroup : Primitive"
    as-child
    :orientation="rovingFocus ? orientation : undefined"
    :dir="dir"
    :loop="rovingFocus ? loop : undefined"
  >
    <Primitive
      :ref="forwardRef"
      :as-child="asChild"
      :as="as"
      v-bind="root.attrs.value"
    >
      <slot :model-value="modelValue" />

      <VisuallyHiddenInput
        v-if="isFormControl && name"
        :name="name"
        :required="required"
        :value="modelValue"
      />
    </Primitive>
  </component>
</template>
