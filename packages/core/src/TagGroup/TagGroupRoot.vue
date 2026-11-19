<script lang="ts">
import type { Ref } from 'vue'
import type { PrimitiveProps } from '@/Primitive'
import type { AcceptableValue, Direction } from '@/shared/types'
import { useVModel } from '@vueuse/core'
import { createContext, getActiveElement, useDirection, useForwardExpose, useTypeahead } from '@/shared'

export type TagGroupSelectionMode = 'none' | 'single' | 'multiple'

export interface TagGroupRootProps<T = AcceptableValue> extends PrimitiveProps {
  /** The controlled value of the selected tag(s). Can be binded with `v-model`. An array when `selectionMode` is `multiple`. */
  modelValue?: T | Array<T>
  /** The value of the selected tag(s) when initially rendered. Use when you do not need to control the selection. */
  defaultValue?: T | Array<T>
  /**
   * The type of selection that is allowed. Tags are not selectable when `none`.
   * @defaultValue 'none'
   */
  selectionMode?: TagGroupSelectionMode
  /** When `true`, the user cannot deselect the last selected tag. */
  disallowEmptySelection?: boolean
  /**
   * Whether pressing <kbd>Escape</kbd> clears the selection.
   * @defaultValue 'clearSelection'
   */
  escapeKeyBehavior?: 'clearSelection' | 'none'
  /** When `true`, prevents the user from interacting with the tag group and all its tags. */
  disabled?: boolean
  /** The reading direction of the tag group when applicable. <br> If omitted, inherits globally from `ConfigProvider` or assumes LTR (left-to-right) reading mode. */
  dir?: Direction
  /**
   * When `true`, keyboard navigation will loop from last tag to first, and vice versa.
   * @defaultValue true
   */
  loop?: boolean
  /** Use this to compare objects by a particular field, or pass your own comparison function for complete control over how objects are compared. */
  by?: string | ((a: T, b: T) => boolean)
}

export type TagGroupRootEmits<T = AcceptableValue> = {
  /** Event handler called when the selection changes. */
  'update:modelValue': [value: T | Array<T> | undefined]
  /**
   * Event handler called when the user removes tags, with the values to remove.
   * Tags are only removable when this event has a listener; remove the values from your own list to remove the tags.
   */
  'remove': [values: Array<T>]
}

export interface TagGroupItemRegistration {
  value: () => AcceptableValue
  element: () => HTMLElement | undefined
  disabled: () => boolean
  textValue: () => string
}

interface TagGroupRootContext<T = AcceptableValue> {
  modelValue: Ref<T | Array<T> | undefined>
  selectionMode: Ref<TagGroupSelectionMode>
  disabled: Ref<boolean>
  currentTabStopId: Ref<string | null | undefined>
  allowsRemoving: () => boolean
  isSelected: (value: T) => boolean
  toggleSelection: (value: T) => void
  removeTags: (value: T, withSelection: boolean) => void
  registerItem: (item: TagGroupItemRegistration) => () => void
  onFocusedItemUnmount: (element: HTMLElement) => void
  handleTypeahead: (key: string) => void
}

export const [injectTagGroupRootContext, provideTagGroupRootContext]
  = createContext<TagGroupRootContext>('TagGroupRoot')
</script>

<script setup lang="ts" generic="T extends AcceptableValue = AcceptableValue">
import { computed, getCurrentInstance, nextTick, onBeforeUnmount, onMounted, ref, shallowReactive, toRefs } from 'vue'
import { injectFieldRootContext } from '@/Field'
import { compare, valueComparator } from '@/Listbox/utils'
import { Primitive } from '@/Primitive'
import { RovingFocusGroup } from '@/RovingFocus'

const props = withDefaults(defineProps<TagGroupRootProps<T>>(), {
  selectionMode: 'none',
  escapeKeyBehavior: 'clearSelection',
  loop: true,
  as: 'div',
})
const emits = defineEmits<TagGroupRootEmits<T>>()

defineSlots<{
  default?: (props: {
    /** Current selected value(s) */
    modelValue: typeof modelValue.value
  }) => any
}>()

const { selectionMode, loop, dir: propDir } = toRefs(props)
const dir = useDirection(propDir)
const { forwardRef, currentElement } = useForwardExpose()
const instance = getCurrentInstance()

// Optional Field participation: `injectFieldRootContext(null)` returns `null`
// outside a `FieldRoot`, so every binding below is inert without a Field.
const fieldContext = injectFieldRootContext(null)
const disabled = computed(() => Boolean(props.disabled || fieldContext?.disabled.value))

const modelValue = useVModel(props, 'modelValue', emits, {
  defaultValue: (props.defaultValue ?? (props.selectionMode === 'multiple' ? [] : undefined)) as any,
  passive: (props.modelValue === undefined) as false,
}) as Ref<T | Array<T> | undefined>

const selectedValues = computed<T[]>(() => {
  const value = modelValue.value
  if (value === undefined || value === null)
    return []
  return Array.isArray(value) ? value : [value]
})

function isSelected(value: AcceptableValue) {
  return selectionMode.value !== 'none' && valueComparator(selectedValues.value, value as T, props.by)
}

function setSelection(values: T[]) {
  modelValue.value = selectionMode.value === 'multiple' ? values : values[0]
}

function toggleSelection(value: AcceptableValue) {
  if (selectionMode.value === 'none' || disabled.value)
    return

  if (isSelected(value)) {
    const next = selectedValues.value.filter(item => !compare(item, value as T, props.by))
    if (props.disallowEmptySelection && next.length === 0)
      return
    setSelection(next)
  }
  else {
    setSelection(selectionMode.value === 'multiple' ? [...selectedValues.value, value as T] : [value as T])
  }
}

// Tags are removable only when the consumer listens to `remove`, as there is
// nothing to remove them from otherwise.
function allowsRemoving() {
  return Boolean(instance?.vnode.props?.onRemove)
}

function removeTags(value: AcceptableValue, withSelection: boolean) {
  if (!allowsRemoving() || disabled.value)
    return

  // Removing a selected tag with the keyboard removes the whole selection,
  // except for disabled tags, which the user cannot interact with.
  const values = withSelection && isSelected(value)
    ? selectedValues.value.filter(selected => !isDisabledValue(selected))
    : [value as T]
  if (values.some(item => isSelected(item))) {
    const next = selectedValues.value.filter(item => !valueComparator(values, item, props.by))
    setSelection(next)
  }
  emits('remove', values)
}

const items = shallowReactive(new Set<TagGroupItemRegistration>())

function getOrderedItems() {
  return Array.from(items, item => ({ ...item, el: item.element() }))
    .filter((item): item is TagGroupItemRegistration & { el: HTMLElement } => !!item.el)
    .sort((a, b) => a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1)
}

function isDisabledValue(value: T) {
  return [...items].some(item => item.disabled() && compare(item.value() as T, value, props.by))
}

function registerItem(item: TagGroupItemRegistration) {
  items.add(item)
  return () => items.delete(item)
}

// Tags register during their setup, which happens while this component
// renders, so read the count only once mounted (and on later changes).
const isMounted = ref(false)
onMounted(() => {
  isMounted.value = true
})
const isEmpty = computed(() => isMounted.value && items.size === 0)

// When the focused tag is removed, move focus to the next remaining tag, or
// the previous one if it was the last, or the group itself once it is empty.
let pendingFocusRestore = false
function onFocusedItemUnmount(element: HTMLElement) {
  if (pendingFocusRestore)
    return
  pendingFocusRestore = true

  const snapshot = getOrderedItems()
  const index = snapshot.findIndex(item => item.el === element)
  const isCandidate = (item: typeof snapshot[number]) => item.el.isConnected && !item.disabled()

  nextTick(() => {
    pendingFocusRestore = false
    if (getActiveElement() && getActiveElement() !== document.body)
      return

    const next = snapshot.slice(index + 1).find(isCandidate)
      ?? snapshot.slice(0, Math.max(index, 0)).reverse().find(isCandidate)
    const target = next?.el ?? currentElement.value
    target?.focus()
  })
}

const { handleTypeaheadSearch } = useTypeahead()
function handleTypeahead(key: string) {
  const candidates = getOrderedItems()
    .filter(item => !item.disabled())
    .map(item => ({ ref: item.el, value: { textValue: item.textValue() } }))
  handleTypeaheadSearch(key, candidates)
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape' || props.escapeKeyBehavior !== 'clearSelection' || props.disallowEmptySelection)
    return
  if (selectionMode.value === 'none' || selectedValues.value.length === 0)
    return
  event.preventDefault()
  event.stopPropagation()
  setSelection([])
}

// While focus is inside, additions are announced (e.g. a tag added from an
// adjacent input), matching React Aria.
const isFocusWithin = ref(false)

const currentTabStopId = ref<string | null>()

function mergeIds(consumerValue: unknown, fieldValue: string | undefined) {
  return [consumerValue as string | undefined, fieldValue].filter(Boolean).join(' ') || undefined
}

let unregisterControl: (() => void) | undefined
onMounted(() => {
  unregisterControl = fieldContext?.registerControl({
    element: () => {
      const focusable = getOrderedItems().filter(item => !item.disabled())
      return focusable.find(item => item.el.tabIndex === 0)?.el ?? focusable[0]?.el ?? currentElement.value
    },
    getValue: () => modelValue.value,
  })
})
onBeforeUnmount(() => unregisterControl?.())

provideTagGroupRootContext({
  modelValue,
  selectionMode,
  disabled,
  currentTabStopId,
  allowsRemoving,
  isSelected,
  toggleSelection,
  removeTags,
  registerItem,
  onFocusedItemUnmount,
  handleTypeahead,
})
</script>

<template>
  <RovingFocusGroup
    v-model:current-tab-stop-id="currentTabStopId"
    as-child
    :dir="dir"
    :loop="loop"
  >
    <Primitive
      :ref="forwardRef"
      :as="as"
      :as-child="asChild"
      :role="isEmpty ? 'group' : 'grid'"
      v-bind="isEmpty ? { tabindex: 0 } : {}"
      :aria-multiselectable="!isEmpty && selectionMode === 'multiple' ? true : undefined"
      :aria-labelledby="mergeIds($attrs['aria-labelledby'], fieldContext?.labelId.value)"
      :aria-describedby="mergeIds($attrs['aria-describedby'], fieldContext?.describedBy.value)"
      aria-atomic="false"
      aria-relevant="additions"
      :aria-live="isFocusWithin ? 'polite' : 'off'"
      :data-disabled="disabled ? '' : undefined"
      :data-empty="isEmpty ? '' : undefined"
      :dir="dir"
      @keydown="handleKeydown"
      @focusin="isFocusWithin = true"
      @focusout="(event: FocusEvent) => { if (!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node)) isFocusWithin = false }"
    >
      <slot :model-value="modelValue" />
    </Primitive>
  </RovingFocusGroup>
</template>
