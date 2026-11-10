<script lang="ts">
import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { PinInputChangeReason } from './usePinInput'
import type { PrimitiveProps } from '@/Primitive'
import type { BaseChangeReason, ChangeEventDetails } from '@/shared'
import type { Direction, FormFieldProps } from '@/shared/types'
import { createContext, useDirection, useForwardElement } from '@/shared'
import VisuallyHiddenInput from '@/VisuallyHidden/VisuallyHiddenInput.vue'

export type PinInputType = 'text' | 'number'

// Using this type to avoid mixed arrays (string | number)[].
// The value type can be (number | undefined)[] only when the type is explicitly set to 'number'.
// Cleared inputs leave gaps, so numeric values may be `undefined`.
export type PinInputValue<Type extends PinInputType> = [Type] extends ['number'] ? (number | undefined)[] : string[]

// provide the mixed arrays because the `type` is dynamic in the context
export type PinInputContextValue<Type extends PinInputType = 'text'>
  = Type extends 'number'
    ? Type extends 'string'
      ? string[] | (number | undefined)[]
      : (number | undefined)[]
    : string[]

export type PinInputRootEmits<Type extends PinInputType = 'text'> = {
  /** Event handler called before the value changes; `details.cancel()` vetoes the change. */
  'beforeUpdate:modelValue': [value: PinInputValue<Type>, details: ChangeEventDetails<PinInputChangeReason>]
  /** Event handler called when the value changes. */
  'update:modelValue': [value: PinInputValue<Type>, details: ChangeEventDetails<PinInputChangeReason>]
  /** Event handler called when every input is filled. */
  'complete': [value: PinInputValue<Type>]
}

export interface PinInputRootProps<Type extends PinInputType = 'text'> extends PrimitiveProps, FormFieldProps {
  /** The controlled checked state of the pin input. Can be binded as `v-model`. */
  modelValue?: PinInputValue<Type> | null
  /** The default value of the pin inputs when it is initially rendered. Use when you do not need to control its checked state. */
  defaultValue?: PinInputValue<Type>
  /** The placeholder character to use for empty pin-inputs. */
  placeholder?: string
  /** When `true`, pin inputs will be treated as password. */
  mask?: boolean
  /** When `true`, mobile devices will autodetect the OTP from messages or clipboard, and enable the autocomplete field. */
  otp?: boolean
  /** Input type for the inputs. */
  type?: Type
  /** The reading direction of the combobox when applicable. <br> If omitted, inherits globally from `ConfigProvider` or assumes LTR (left-to-right) reading mode. */
  dir?: Direction
  /** When `true`, prevents the user from interacting with the pin input */
  disabled?: boolean
  /** Id of the element */
  id?: string
}

export interface PinInputRootContext<Type extends PinInputType = 'text'> {
  /** Read-only; write through `setModelValue` / `updateModelValueAt`. */
  modelValue: Readonly<Ref<PinInputContextValue<Type>>>
  currentModelValue: ComputedRef<PinInputContextValue<Type>>
  mask: Readonly<Ref<boolean>>
  otp: Readonly<Ref<boolean>>
  placeholder: Readonly<Ref<string>>
  type: Readonly<Ref<PinInputType>>
  dir: Readonly<Ref<Direction>>
  disabled: Readonly<Ref<boolean>>
  isCompleted: ComputedRef<boolean>
  inputElements?: Ref<Set<HTMLInputElement>>
  /** Registers an input with its `index`, which orders the inputs. */
  onInputElementChange: (el: HTMLInputElement, index?: MaybeRefOrGetter<number>) => void
  isNumericMode: ComputedRef<boolean>
  /** Replaces the whole value. Returns `false` when unchanged or cancelled. */
  setModelValue: (value: PinInputContextValue<Type>, reason?: PinInputChangeReason | BaseChangeReason, event?: Event) => boolean
  /** Writes one input's value (`''` clears it). Returns `false` when unchanged or cancelled. */
  updateModelValueAt: (index: number, value: string, reason?: PinInputChangeReason | BaseChangeReason, event?: Event) => boolean
}

export const [injectPinInputRootContext, providePinInputRootContext]
  = createContext<PinInputRootContext<PinInputType>>('PinInputRoot')

/**
 * Inside a Field: each mounted input's `index`, so filled can check the entry
 * at every slot. Provided only in a Field (`null` in a nested root outside one).
 * @internal
 */
export const [injectPinInputFieldSlots, providePinInputFieldSlots]
  = createContext<Map<HTMLInputElement, () => number> | null>('PinInputRoot', 'PinInputFieldSlots')
</script>

<script setup lang="ts" generic="Type extends PinInputType">
import { mergeProps, useAttrs, watch } from 'vue'
import { useFieldBinding } from '@/Field/useFieldBinding'
import { useFieldFocusWithin } from '@/Field/useFieldFocusWithin'
import { renderAs } from '@/Primitive/renderAs'
import { formResetBinder } from '@/shared/formReset'
import { resetControllableState } from '@/shared/useControllableState'
import { orderInputElements, usePinInput } from './usePinInput'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<PinInputRootProps<Type>>(), {
  placeholder: '',
  type: 'text' as any,
})
const emits = defineEmits<PinInputRootEmits<Type>>()

defineSlots<{
  default?: (props: {
    /** Current input values */
    modelValue: typeof modelValue.value
  }) => any
}>()

const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)
const dir = useDirection(() => props.dir)

// Optional Field participation: `null` outside a `FieldRoot`, so every binding
// below is inert without a Field. As with the date fields, the hidden input
// takes the field's id (the label forwards focus to the first input) and the
// root, a `role="group"` inside a Field, carries the label/description wiring.
// The value collected is the model array, as `update:modelValue` emits it,
// without trailing empty entries (see `toFieldValue`). A required pin input
// needs every input filled, and only then is it filled.
const field = useFieldBinding({
  id: () => props.id,
  element: () => firstInput(),
  getValue: () => toFieldValue(modelValue.value),
  required: () => props.required,
  // Every mounted slot's entry, by its `index`: not a count, which an extra
  // entry past the last slot could make up for an empty one.
  isFilled: (value) => {
    const entries = Array.isArray(value) ? value : []
    const indexes = [...fieldSlots!.values()]
    return indexes.length > 0 && indexes.every((index) => {
      const item = entries[index()]
      return !!item || (context.isNumericMode.value && item === 0)
    })
  },
})
const fieldSlots = field ? new Map<HTMLInputElement, () => number>() : undefined
if (fieldSlots)
  providePinInputFieldSlots(fieldSlots)
// A nested pin input outside a Field only shadows an ancestor's slots, so its
// inputs don't register there; otherwise providing nothing already reads as
// `null`, and costs nothing.
else if (injectPinInputFieldSlots(null))
  providePinInputFieldSlots(null)
const resolvedId = () => field ? field.id() : props.id
const resolvedName = () => field ? field.name(props.name) : props.name
const resolvedRequired = () => field ? field.required(props.required) : props.required
const resolvedDisabled = () => field ? field.disabled(props.disabled) : props.disabled

// The model keeps a cleared input's entry in some cases (`undefined` in number
// mode, a gap before a later digit), so clearing every digit can leave
// `[undefined, undefined, undefined]`. The field sees the value without its
// trailing empty entries, so a cleared pin equals an initial `[]` (and isn't
// dirty) and submits as one. Done here rather than in FieldRoot's generic
// comparison: only the pin input knows an empty entry carries no value.
function toFieldValue(value: unknown) {
  const entries = Array.isArray(value) ? [...value] : []
  while (entries.length > 0 && (entries.at(-1) === undefined || entries.at(-1) === null || entries.at(-1) === ''))
    entries.pop()
  return entries
}

function firstInput() {
  return orderInputElements(context.inputElements!.value)[0]
}

// The composable owns the model (`useControllableState`), `beforeUpdate:` /
// `update:` and the `complete` watcher; the shell keeps `dir` resolution and
// the hidden form input.
const { modelValue: model, currentModelValue, root, context, isControlled } = usePinInput({
  modelValue: () => props.modelValue,
  defaultValue: props.defaultValue,
  type: () => props.type,
  mask: () => props.mask,
  otp: () => props.otp,
  placeholder: () => props.placeholder,
  dir,
  disabled: resolvedDisabled,
  emit: emits,
  // The Field hears its own commits by reason (`change`): user input, or, for
  // a programmatic one (`setModelValue` and the like), only the watcher below,
  // which also reports a parent-driven change.
  onUpdate: field ? (value, details) => field.change(toFieldValue(value), details) : undefined,
})
const modelValue = model as unknown as Readonly<Ref<PinInputValue<Type>>>

providePinInputRootContext(context)

// A native reset of the owning form puts the value back to `defaultValue`.
function onFormReset(event: Event) { resetControllableState(isControlled, event) }

// Touched once focus leaves the whole group, not when it moves between inputs.
const focusWithin = useFieldFocusWithin(field, currentElement as Ref<HTMLElement | undefined>)

// A slot mounting or unmounting changes `filled` too (e.g. an empty last
// input removed): the inputs register with both the slots and this set. So
// does a mounted input's `index` changing: the slot then reads another entry.
if (field) {
  watch([
    model,
    () => context.inputElements!.value.size,
    () => Array.from(fieldSlots!.values(), index => index()).join(),
  ], ([value]) => field.sync(value), { deep: true })
}

// `$attrs` isn't reactive, so the Field's wiring is read during render. Its
// state attributes go first and the root's own win; its aria ids are merged
// with the consumer's, and a consumer `aria-invalid` (or `role`) wins.
const attrs = useAttrs()
function getRootAttrs() {
  if (!field)
    return mergeProps(attrs, root.attrs.value)
  return mergeProps(
    field.dataAttributes(),
    { role: 'group' },
    attrs,
    { ...field.ariaAttrs(attrs, resolvedDisabled()) },
    root.attrs.value,
    { onFocusin: focusWithin!.onFocusin, onFocusout: focusWithin!.onFocusout },
  )
}

const bindFormReset = formResetBinder(onFormReset)
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    v-bind="getRootAttrs()"
    :ref="forwardRef"
    @vue:mounted="bindFormReset"
  >
    <slot :model-value="modelValue" />

    <VisuallyHiddenInput
      :id="resolvedId()"
      as="input"
      feature="focusable"
      aria-hidden="true"
      tabindex="-1"
      :value="currentModelValue.join('')"
      :name="resolvedName() ?? ''"
      :disabled="resolvedDisabled()"
      :required="resolvedRequired()"
      @focus="firstInput()?.focus()"
    />
  </component>
</template>
