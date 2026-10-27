<script lang="ts">
import type { ComputedRef, Ref } from 'vue'
import type { SelectChangeReason, SelectModelValue, SelectNavigationIntent, SelectOpenChangeReason } from './useSelect'
import type { BaseChangeReason, By, ChangeEventDetails, LabelRegistry } from '@/shared'
import type { AcceptableValue, Direction, FormFieldProps } from '@/shared/types'
import { useCollection } from '@/Collection'
import { compare, createContext, isNullish, useDirection, useFormControl, useId } from '@/shared'

export interface SelectRootProps<T = AcceptableValue> extends FormFieldProps {
  /** The controlled open state of the Select. Can be bind as `v-model:open`. */
  open?: boolean
  /** The open state of the select when it is initially rendered. Use when you do not need to control its open state. */
  defaultOpen?: boolean
  /** The value of the select when initially rendered. Use when you do not need to control the state of the Select */
  defaultValue?: T | Array<T>
  /** The controlled value of the Select. Can be bind as `v-model`. */
  modelValue?: T | Array<T>
  /** The value of the hidden native select option when the model value is nullish. */
  nullableValue?: string
  /** Use this to compare objects by a particular field, or pass your own comparison function for complete control over how objects are compared. */
  by?: string | ((a: T, b: T) => boolean)
  /** The reading direction of the combobox when applicable. <br> If omitted, inherits globally from `ConfigProvider` or assumes LTR (left-to-right) reading mode. */
  dir?: Direction
  /** Whether multiple options can be selected or not. */
  multiple?: boolean
  /** Native html input `autocomplete` attribute. */
  autocomplete?: string
  /** When `true`, prevents the user from interacting with Select */
  disabled?: boolean
  /**
   * The text shown for a selected value. Wins over the text of its `SelectItemText`, so the value can be shown before
   * the content ever rendered; with it set, the closed content is not rendered just to collect the item texts.
   */
  displayValue?: (value: T) => string
  /**
   * Resolves what a keydown in the content means for keyboard navigation. Return `undefined` to fall back to the
   * default mapping (ArrowUp, ArrowDown, Home, End), `null` to opt the key out (for Enter and Space this also skips the
   * selection), or `'select'` to select the focused item as Enter does.
   */
  getNavigationIntent?: (event: KeyboardEvent) => SelectNavigationIntent | null | undefined
}

export type SelectRootEmits<T = AcceptableValue, M extends boolean = boolean> = {
  /**
   * Event handler called before the value changes; call `details.cancel()` to keep the current value. The value is an
   * array when `multiple`.
   */
  'beforeUpdate:modelValue': [value: SelectModelValue<T, M>, details: ChangeEventDetails<SelectChangeReason>]
  /** Event handler called when the value changes. The value is an array when `multiple`. */
  'update:modelValue': [value: SelectModelValue<T, M>, details: ChangeEventDetails<SelectChangeReason>]
  /** Event handler called before the open state changes; call `details.cancel()` to keep it. */
  'beforeUpdate:open': [value: boolean, details: ChangeEventDetails<SelectOpenChangeReason>]
  /** Event handler called when the open state of the select changes. */
  'update:open': [value: boolean, details: ChangeEventDetails<SelectOpenChangeReason>]
}

/** The sticky label registry on the Select root context, matched with `by`. */
export interface SelectLabelRegistry<T = AcceptableValue> extends LabelRegistry<T> {}

export interface SelectRootContext<T = AcceptableValue> {
  baseId: string
  /** `<baseId>-content`, set when the root is created. */
  contentId: string
  triggerElement: Ref<HTMLElement | undefined>
  onTriggerChange: (node: HTMLElement | undefined) => void
  valueElement: Ref<HTMLElement | undefined>
  onValueElementChange: (node: HTMLElement | undefined) => void
  modelValue: ComputedRef<T | Array<T> | undefined>
  /** Selects a value: replaces a single selection, toggles a multiple one. Returns `false` when unchanged or cancelled. */
  onValueChange: (value: T, reason?: SelectChangeReason | BaseChangeReason, event?: Event) => boolean
  /** Writes the whole model; returns `false` when unchanged or cancelled. */
  setModelValue: (value: T | T[] | undefined, reason?: SelectChangeReason | BaseChangeReason, event?: Event) => boolean
  /**
   * An item press: selects, then closes a single select unless the selection was cancelled. Returns `false` when it
   * was.
   */
  pressItem: (value: T, reason?: 'item-press' | 'item-keydown', event?: Event) => boolean
  isSelected: (value: T) => boolean
  open: ComputedRef<boolean>
  /** Returns `false` when unchanged or cancelled via `beforeUpdate:open`. */
  onOpenChange: (open: boolean, reason?: SelectOpenChangeReason | BaseChangeReason, event?: Event) => boolean
  multiple: Ref<boolean>
  required: Ref<boolean>
  by?: By<T>
  dir: Ref<Direction>
  triggerPointerDownPosRef: Ref<{ x: number, y: number } | null>
  isEmptyModelValue: Ref<boolean>
  disabled: Ref<boolean>
  /** The sticky label registry `SelectItemText` fills; entries are never removed on unmount. */
  labels: SelectLabelRegistry<T>
  /** Text of each selected value (`displayValue`, then `labels`). */
  selectedLabels: ComputedRef<string[]>
  /** The root's `displayValue` resolver, if any. */
  displayValue?: (value: T) => string
  /** The root's `getNavigationIntent` over the default mapping. */
  getNavigationIntent: (event: KeyboardEvent) => SelectNavigationIntent | null | undefined
}

export const [injectSelectRootContext, provideSelectRootContext]
  = createContext<SelectRootContext<AcceptableValue>>('SelectRoot')
</script>

<script setup lang="ts" generic="T extends AcceptableValue = AcceptableValue, M extends boolean = false">
import { computed, toRef, watch } from 'vue'
import { injectFieldRootContext } from '@/Field'
import { PopperRoot } from '@/Popper'
import BubbleSelect from './BubbleSelect.vue'
import { useSelectRoot } from './useSelect'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<SelectRootProps<T> & { multiple?: M }>(), {
  modelValue: undefined,
  open: undefined,
  nullableValue: '',
})
const emits = defineEmits<SelectRootEmits<T, M>>()

defineSlots<{
  default?: (props: {
    /** Current input values */
    modelValue: SelectModelValue<T, M>
    /** Current open state */
    open: boolean
  }) => any
}>()

// Optional Field participation: `injectFieldRootContext(null)` returns
// `null` (instead of throwing) outside a `FieldRoot`, so every binding below
// is inert — and byte-for-byte identical to before — when there is no Field.
// `SelectTrigger` (the focusable element) registers the Select as the
// field's control and owns the id/aria wiring. Field's `name`/`required`/
// `disabled` act as fallbacks for the local props (local props always win).
const fieldContext = injectFieldRootContext(null)

const resolvedName = computed(() => props.name ?? fieldContext?.name.value)
// `required` is a plain (non-optional-default) `Boolean` prop, so Vue casts
// it to `false` rather than `undefined` when omitted — `props.required` can
// never actually be `undefined`. Only fall back to the Field's `required`
// when a Field is present, so standalone output is untouched.
const required = computed(() => (fieldContext ? (props.required || fieldContext.required.value) : props.required))
const disabled = computed(() => Boolean(props.disabled || fieldContext?.disabled.value))

useCollection({ isProvider: true })
const dir = useDirection(toRef(() => props.dir))

const select = useSelectRoot<AcceptableValue>({
  modelValue: () => props.modelValue,
  defaultValue: props.defaultValue,
  multiple: () => props.multiple,
  by: props.by as By<AcceptableValue> | undefined,
  open: () => props.open,
  defaultOpen: props.defaultOpen,
  disabled,
  required,
  dir,
  baseId: useId(undefined, 'reka-select'),
  displayValue: props.displayValue && (value => props.displayValue!(value as T)),
  getNavigationIntent: event => props.getNavigationIntent?.(event),
  emit: emits,
  // User-driven selection (as opposed to a programmatic/parent-driven
  // `modelValue` change, handled by the `watch` below) — this is what should
  // mark the field dirty and run on-change validation. Report the resulting
  // selection explicitly: a controlled `modelValue` only updates once the
  // parent re-renders.
  onUpdate: value => fieldContext?.handleControlInput({ value }),
})
const { context, open, isEmptyModelValue, isSelected } = select
const modelValue = select.modelValue as unknown as Ref<SelectModelValue<T, M>>

// `dirty` is reported from `onUpdate` instead (the user-driven path) — this
// watcher also fires for a programmatic/parent-driven `modelValue` change,
// which should update `filled` but must not mark the field dirty.
watch(modelValue, () => {
  fieldContext?.reportControlState({ filled: !isEmptyModelValue.value })
})

const isFormControl = useFormControl(context.triggerElement)

// The native `select` mirrors the registered item texts plus every selected
// value (a value whose item never rendered shows its `displayValue`), so it
// does not depend on which items are mounted. Each option carries `selected`,
// which also makes a `multiple` select submit every value.
const nativeOptions = computed(() => {
  const entries = context.labels.entries()
  const options = entries.map(entry => ({ value: entry.value, label: entry.label, disabled: entry.disabled, selected: isSelected(entry.value) }))
  const value = modelValue.value
  const selectedValues = (Array.isArray(value) ? value : isNullish(value) ? [] : [value]) as AcceptableValue[]
  for (const selected of selectedValues) {
    if (!entries.some(entry => compare(entry.value, selected, context.by)))
      options.push({ value: selected, label: context.displayValue?.(selected) ?? '', disabled: false, selected: true })
  }
  return options
})

// The native `select` only associates the correct default value if the corresponding
// `option` is rendered as a child **at the same time** as itself.
// Because it might take a few renders for our items to gather the information to build
// the native `option`(s), we generate a key on the `select` to make sure Vue re-builds it
// each time the options change.
const nativeSelectKey = computed(() => nativeOptions.value.map(option => option.value).join(';'))

provideSelectRootContext(context)
</script>

<template>
  <PopperRoot>
    <slot
      :model-value="modelValue"
      :open="open"
    />

    <BubbleSelect
      v-if="isFormControl && resolvedName"
      :key="nativeSelectKey"
      aria-hidden="true"
      tabindex="-1"
      :multiple="multiple"
      :required="required"
      :name="resolvedName"
      :autocomplete="autocomplete"
      :disabled="disabled"
      :value="modelValue"
    >
      <option
        v-if="isNullish(modelValue)"
        :value="nullableValue"
        selected
      />
      <option
        v-for="(option, index) in nativeOptions"
        :key="index"
        :value="option.value"
        :disabled="option.disabled"
        :selected="option.selected"
      >
        {{ option.label }}
      </option>
    </BubbleSelect>
  </PopperRoot>
</template>
