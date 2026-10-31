<script lang="ts">
import type { ComputedRef, Ref, ShallowRef } from 'vue'
import type { SelectClosedItems } from './closedItems'
import type { SelectChangeReason, SelectItemData, SelectItems, SelectModelValue, SelectNavigationIntent, SelectOpenChangeReason, SelectTypeaheadItem } from './useSelect'
import type { BaseChangeReason, By, ChangeEventDetails, LabelRegistry } from '@/shared'
import type { SelectionSelector } from '@/shared/selectionSelector'
import type { AcceptableValue, Direction, FormFieldProps } from '@/shared/types'
import { useCollection } from '@/Collection'
import { createContext, isNullish, useDirection, useFormControl, useId } from '@/shared'
import { isDisabledItem } from '@/shared/isDisabledItem'

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
   * the content ever rendered; with it set, the closed content is not rendered just to collect the item texts. The cost:
   * until the content has been opened once, the hidden native `select` only holds the selected values (so browser
   * autofill cannot pick another one) and the closed trigger's typeahead has no items to match.
   */
  displayValue?: (value: T) => string
  /**
   * The options as data, as in Base UI's `Select.Root items`: a record of value → label, or an array of
   * `{ value, label, disabled? }` (optionally in groups, `{ items: [...] }`). `SelectValue`, the closed trigger's
   * typeahead and the hidden native `select` then read its labels, so a selected value needs no closed render and its
   * label also renders on the server. The `SelectItem`s still render the open list; rendered items it does not list
   * still count.
   */
  items?: SelectItems<T>
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
  /** Event handler called after the open or close animations of the content have finished. */
  'update:openComplete': [value: boolean]
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
  /** The selection as a keyed selector: items read their own cell. */
  selection?: SelectionSelector<T>
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
  displayValue: Ref<((value: T) => string) | undefined>
  /** The root's `items`, flat; `undefined` without. */
  items?: Ref<SelectItemData<T>[] | undefined>
  /** The `items` option of a value (matched with `by`; a record by the value's string form). */
  getItemData?: (value: T) => SelectItemData<T> | undefined
  /** Whether `items` is a record (its values are its string keys). */
  isRecordItems?: () => boolean
  getItemRegistration?: (data: SelectItemData<T>) => { value: T, disabled: boolean } | undefined
  /**
   * What the closed content renders of its items, and what the closed trigger's typeahead matches.
   * @internal
   */
  closedItems?: SelectClosedItems<T>
  /** The root's `getNavigationIntent` over the default mapping. */
  getNavigationIntent: (event: KeyboardEvent) => SelectNavigationIntent | null | undefined
  /**
   * Set by a mounted `SelectVirtualizer`: every option with its typeahead text,
   * rendered or not, for the closed trigger's typeahead. Read lazily, so a long
   * list costs nothing until a key is typed.
   */
  virtualTypeaheadItems?: ShallowRef<(() => SelectTypeaheadItem<T>[]) | undefined>
  /** Called by the content once its open/close transitions finish; emits `update:openComplete`. */
  notifyOpenComplete?: (value: boolean) => void
}

export const [injectSelectRootContext, provideSelectRootContext]
  = createContext<SelectRootContext<AcceptableValue>>('SelectRoot')
</script>

<script setup lang="ts" generic="T extends AcceptableValue = AcceptableValue, M extends boolean = false">
import { computed, onBeforeUnmount, onMounted, toRef, watch } from 'vue'
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
    /** Current input values; `undefined` while a single select is empty */
    modelValue: M extends true ? T[] : T | undefined
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

// Every item registers here: the open content's and the closed ones the
// content renders while it needs their labels.
const { reactiveItems } = useCollection<{ value: { value: AcceptableValue, textValue: string } }>({ isProvider: true })
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
  displayValue: toRef(() => props.displayValue as ((value: AcceptableValue) => string) | undefined),
  items: () => props.items as SelectItems<AcceptableValue> | undefined,
  getNavigationIntent: event => props.getNavigationIntent?.(event),
  emit: emits,
  // User-driven selection (as opposed to a programmatic/parent-driven
  // `modelValue` change, handled by the `watch` below) — this is what should
  // mark the field dirty and run on-change validation. Report the resulting
  // selection explicitly: a controlled `modelValue` only updates once the
  // parent re-renders.
  onUpdate: value => fieldContext?.handleControlInput({ value }),
  onOpenComplete: value => emits('update:openComplete', value),
})
const { context, open, isEmptyModelValue, isSelected } = select
const modelValue = select.modelValue as unknown as Ref<M extends true ? T[] : T | undefined>

// `dirty` is reported from `onUpdate` instead (the user-driven path) — this
// watcher also fires for a programmatic/parent-driven `modelValue` change,
// which should update `filled` but must not mark the field dirty.
watch(modelValue, () => {
  fieldContext?.reportControlState({ filled: !isEmptyModelValue.value })
})

const isFormControl = useFormControl(context.triggerElement)

// The mounted items, in document order, for the closed trigger's typeahead.
const closedItems = context.closedItems!
closedItems.liveItems = () => {
  const items = reactiveItems.value
  if (!items.length)
    return []
  return items
    .slice()
    .sort((a, b) => a.ref.compareDocumentPosition(b.ref) & Node.DOCUMENT_POSITION_PRECEDING ? 1 : -1)
    .map(item => ({ value: item.value.value, textValue: item.value.textValue, disabled: isDisabledItem(item.ref) }))
}

// The hidden native `select` of a named Select in a form offers every option
// to the browser's autofill, which can arrive at any time. `items` has them
// from the start, so its render waits for idle time; otherwise the closed
// content renders its lean items from the mount, while the name and form last.
closedItems.needsForm = () => isFormControl.value && !!resolvedName.value
onMounted(() => {
  // Past the mount (and the hydration), a selected value without a label
  // renders the closed items now, so the trigger shows it before the first paint.
  closedItems.activate()
  watch(() => closedItems.needsForm!() && !!context.items?.value, (defer) => {
    if (defer)
      closedItems.renderFormWhenIdle()
    else
      closedItems.dispose()
  }, { immediate: true })
})
onBeforeUnmount(() => closedItems.dispose())

// The registered labels `items` does not list, in the document order of the
// mounted lean items (a prepended or re-sorted list), then the ones no mounted
// item has (sticky). Its own computed: a model change cannot change the order.
const registeredOptions = computed(() => {
  const labels = context.labels
  const placed = new Set<unknown>()
  const ordered = []
  for (const value of closedItems.getOrderedValues()) {
    const entry = labels.entry(value)
    if (entry && !placed.has(entry)) {
      placed.add(entry)
      ordered.push(entry)
    }
  }
  const data = context.items?.value
  return [...ordered, ...labels.entries().filter(entry => !placed.has(entry))]
    .filter(entry => !data || !context.getItemData!(entry.value))
})

// The native `select` mirrors `items`, else the registered item texts, plus
// every selected value (a value whose item never rendered shows its
// `displayValue`), so it does not depend on which items are mounted. Each
// option carries `selected`, which also makes a `multiple` select submit every
// value.
const nativeOptions = computed(() => {
  const value = modelValue.value
  const selectedValues = (Array.isArray(value) ? value : isNullish(value) ? [] : [value]) as AcceptableValue[]
  const data = context.items?.value
  const getItemData = context.getItemData!
  // `items` first (their labels win), then the texts of rendered items it does
  // not list. A rendered item refines its option: its typed value and `disabled`.
  const selectedData = new Set(data ? selectedValues.map(getItemData) : [])
  const options = (data ?? []).map((entry) => {
    const registration = context.getItemRegistration!(entry)
    const optionValue = registration ? registration.value : entry.value
    return { value: optionValue, label: entry.label, disabled: !!entry.disabled || !!registration?.disabled, selected: selectedData.has(entry) || isSelected(optionValue) }
  })
  for (const entry of registeredOptions.value)
    options.push({ value: entry.value, label: entry.label, disabled: entry.disabled, selected: isSelected(entry.value) })
  for (const selected of selectedValues) {
    if (!(data && getItemData(selected)) && !context.labels.entry(selected))
      options.push({ value: selected, label: context.displayValue.value?.(selected) ?? '', disabled: false, selected: true })
  }
  return options
})

// The native `select` is patched in place (each option's `selected` is bound),
// never re-keyed: re-creating it on a model change would skip the `change`
// event `BubbleSelect` dispatches for that change.

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
        data-nullable
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
