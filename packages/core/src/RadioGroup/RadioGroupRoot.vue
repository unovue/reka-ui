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
import { mergeProps, useAttrs, watch } from 'vue'
import { useFieldControl } from '@/Field/useFieldControl'
import { useFieldFocusWithin } from '@/Field/useFieldFocusWithin'
import { renderAs } from '@/Primitive/renderAs'
import { useRovingFocusGroup } from '@/RovingFocus/useRovingFocusGroup'
import { vFormReset } from '@/shared/formReset'
import { resetControllableState } from '@/shared/useControllableState'
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
const attrs = useAttrs()

// The radio a Field focuses (an invalid submit, a non-native label's click):
// the checked one, else the first enabled one.
function getFocusTarget() {
  const radios = Array.from(currentElement.value?.querySelectorAll<HTMLElement>('[role="radio"]') ?? [])
    .filter(radio => !radio.hasAttribute('disabled') && !radio.hasAttribute('data-disabled'))
  return radios.find(radio => radio.getAttribute('aria-checked') === 'true') ?? radios[0]
}

// Optional Field participation: `null` outside a `FieldRoot`, so every
// binding below is inert without a Field. The group is the field's control:
// it takes the field's id and aria wiring, and the radios inside don't.
const field = useFieldControl({
  id: () => attrs.id as string | undefined,
  element: getFocusTarget,
  getValue: () => modelValue.value,
  required: () => props.required,
  // A radio's value can be `''`, which still counts as a choice.
  isFilled: value => value !== undefined && value !== null,
})
// Getters rather than computeds: cheap, and free for a standalone group.
const resolvedName = () => field ? field.name(props.name) : props.name
const resolvedRequired = () => field ? field.required(props.required) : props.required

const { modelValue, disabled, root, context, isControlled } = useRadioGroup({
  modelValue: () => props.modelValue,
  defaultValue: props.defaultValue,
  emit: emits,
  // The Field hears its own commits by reason (`change`): user input, or, for
  // a programmatic one (`setModelValue` and the like), only the watcher below,
  // which also reports a parent-driven change.
  onUpdate: field?.change,
  disabled: () => field ? field.disabled(props.disabled) : props.disabled,
  required: resolvedRequired,
  orientation: () => props.orientation,
  loop: () => props.loop,
  dir,
  name: resolvedName,
})

provideRadioGroupRootContext(context)

// A native reset of the owning form puts the value back to `defaultValue`.
function onFormReset(event: Event) { resetControllableState(isControlled, event) }

if (field)
  watch(modelValue, value => field.sync(value))

// Touched once focus leaves the whole group, not on every radio-to-radio move.
const focusWithin = useFieldFocusWithin(field, currentElement as Ref<HTMLElement | undefined>)

// Arrow-key navigation between the radios.
const roving = useRovingFocusGroup({
  consumerAttrs: true,
  element: currentElement,
  orientation: () => props.orientation,
  dir: () => dir.value,
  loop: () => props.loop,
})

// The window arrow-key flag the items read on focus (one shared pair of
// listeners, not one per item).
useArrowKeyListeners()

// `$attrs` isn't reactive, so the Field's wiring is read during render. Its
// state attributes fill in what the group leaves unset;
// its aria ids are merged with the consumer's.
function renderAttrs(attrs: Record<string, unknown>) {
  const own = mergeProps(roving.consumerAttrs(attrs), roving.attrs(), root.attrs.value)
  if (!field)
    return own
  return field.fillDataAttributes(mergeProps(
    own,
    { id: field.id(), ...field.ariaAttrs(attrs, disabled.value), onFocusin: focusWithin!.onFocusin, onFocusout: focusWithin!.onFocusout },
  ))
}
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="forwardRef"
    v-form-reset="onFormReset"
    v-bind="renderAttrs($attrs)"
  >
    <slot :model-value="modelValue" />

    <VisuallyHiddenInput
      v-if="isFormControl && resolvedName()"
      :required="resolvedRequired()"
      :disabled="disabled"
      :value="modelValue"
      :name="resolvedName()!"
    />
  </component>
</template>
