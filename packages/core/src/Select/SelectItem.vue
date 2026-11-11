<script lang="ts">
import type { Ref } from 'vue'
import type { PrimitiveProps } from '@/Primitive'
import type { AcceptableValue } from '@/shared/types'
import { useCollection } from '@/Collection'
import { createContext, getActiveElement, handleAndDispatchCustomEvent, useForwardExpose, useId } from '@/shared'

interface SelectItemContext<T = AcceptableValue> {
  value: T
  textId: string
  disabled: Ref<boolean>
  isSelected: Ref<boolean>
  onItemTextChange: (node: HTMLElement | undefined) => void
}

export const [injectSelectItemContext, provideSelectItemContext]
  = createContext<SelectItemContext>('SelectItem')

export type SelectEvent<T> = CustomEvent<{ originalEvent: PointerEvent | KeyboardEvent, value?: T }>

export type SelectItemEmits<T = AcceptableValue> = {
  /** Event handler called when the selecting item. <br> It can be prevented by calling `event.preventDefault`. */
  select: [event: SelectEvent<T>]
}

export interface SelectItemProps<T = AcceptableValue> extends PrimitiveProps {
  /** The value given as data when submitted with a `name`. */
  value: T
  /** When `true`, prevents the user from interacting with the item. */
  disabled?: boolean
  /**
   * Optional text used for typeahead purposes.
   *
   * By default the typeahead behavior will use the `.textContent` of the `SelectItemText` part.
   *
   * Use this when the content is complex, or you have non-textual content inside.
   */
  textValue?: string
}
</script>

<script setup lang="ts" generic="T extends AcceptableValue = AcceptableValue">
import {
  computed,
  nextTick,
  onMounted,
  ref,
} from 'vue'
import { Primitive } from '@/Primitive'
import { injectSelectContentContext } from './SelectContentImpl.vue'
import { injectSelectRootContext } from './SelectRoot.vue'
import { SELECTION_KEYS, valueComparator } from './utils'

const props = defineProps<SelectItemProps>()

const emits = defineEmits<SelectItemEmits<T>>()
defineSlots<{
  default?: (props: {
    /** Whether the item is currently selected */
    selected: boolean
  }) => any
}>()
const rootContext = injectSelectRootContext()
const disabled = computed(() => Boolean(props.disabled || rootContext.disabled?.value))
const contentContext = injectSelectContentContext()
const { forwardRef, currentElement } = useForwardExpose()
const { CollectionItem } = useCollection()

const isSelected = computed(() => valueComparator(rootContext.modelValue?.value, props.value, rootContext.by))
const isFocused = ref(false)
const textValue = ref(props.textValue ?? '')
const textId = useId(undefined, 'reka-select-item-text')

const SELECT_SELECT = 'select.select'

async function handleSelectCustomEvent(ev: PointerEvent | KeyboardEvent) {
  if (ev.defaultPrevented || disabled.value)
    return

  const eventDetail = { originalEvent: ev, value: props.value as T }
  handleAndDispatchCustomEvent(SELECT_SELECT, handleSelect, eventDetail)
}

async function handleSelect(ev: SelectEvent<T>) {
  await nextTick()
  emits('select', ev)
  if (ev.defaultPrevented)
    return

  if (!disabled.value) {
    rootContext.onValueChange(props.value)
    if (!rootContext.multiple.value)
      rootContext.onOpenChange(false)
  }
}

// Touch selects on `click`: iOS Safari fires `pointerup` on whatever item ends up under the
// finger once a scroll through the list stops, while a `click` never follows a scroll.
// Mouse and pen keep selecting on `pointerup`, so they can press the trigger, move down the
// list and release over an item.
function isTouch(event: PointerEvent) {
  return event.pointerType === 'touch'
}

// Whether a touch press began on this item. The trigger opens the content on a touch
// `pointerup`, so the `click` that ends that same tap can land on an item that was just
// rendered under the finger; only a tap that started here may select.
let touchPressStarted = false
// That tap's `pointerup`, handed to `select` as the `originalEvent` just as when it selected itself.
let tapPointerUp: PointerEvent | undefined
// Whether a selection key is held. An item rendered as a native button turns that key into a
// `click` of its own, which must not select a second time.
let isSelectionKeyDown = false

function handlePointerDown(event: PointerEvent) {
  touchPressStarted = isTouch(event)
  tapPointerUp = undefined
  if (!touchPressStarted)
    (event.currentTarget as HTMLElement).focus({ preventScroll: true })
}

function handlePointerUp(event: PointerEvent) {
  if (!isTouch(event))
    handleSelectCustomEvent(event)
  else if (touchPressStarted)
    tapPointerUp = event
}

function handleClick(event: MouseEvent) {
  const startedOnItem = touchPressStarted
  const pointerUp = tapPointerUp
  touchPressStarted = false
  tapPointerUp = undefined
  if (event.defaultPrevented)
    return
  // A click that no pointer produced (`detail` is 0), e.g. from assistive technology
  const isVirtualClick = event.detail === 0 && !isSelectionKeyDown
  // Browsers dispatch `click` as a `PointerEvent`; it stands in when there was no `pointerup`.
  if (startedOnItem || isVirtualClick)
    handleSelectCustomEvent(pointerUp ?? event as PointerEvent)
}

function handleKeyUp() {
  // The `click` a native button makes from Space comes right after `keyup`
  setTimeout(() => {
    isSelectionKeyDown = false
  })
}

function handleBlur() {
  isFocused.value = false
  isSelectionKeyDown = false
}

async function handlePointerMove(event: PointerEvent) {
  await nextTick()
  if (event.defaultPrevented)
    return
  if (disabled.value) {
    contentContext.onItemLeave?.()
  }
  else if (!isTouch(event)) {
    // even though safari doesn't support this option, it's acceptable
    // as it only means it might scroll a few pixels when using the pointer.
    (event.currentTarget as HTMLElement | null)?.focus({ preventScroll: true })
  }
}

async function handlePointerLeave(event: PointerEvent) {
  await nextTick()
  if (event.defaultPrevented)
    return
  if (event.currentTarget === getActiveElement())
    contentContext.onItemLeave?.()
}

async function handleKeyDown(event: KeyboardEvent) {
  if (SELECTION_KEYS.includes(event.key))
    isSelectionKeyDown = true
  await nextTick()
  if (event.defaultPrevented)
    return
  const isTypingAhead = contentContext.searchRef?.value !== ''
  if (isTypingAhead && event.key === ' ')
    return
  if (SELECTION_KEYS.includes(event.key))
    handleSelectCustomEvent(event)
  // prevent page scroll if using the space key to select an item
  if (event.key === ' ')
    event.preventDefault()
}

if (props.value === '') {
  throw new Error(
    'A <SelectItem /> must have a value prop that is not an empty string. This is because the Select value can be set to an empty string to clear the selection and show the placeholder.',
  )
}

onMounted(() => {
  if (!currentElement.value)
    return
  contentContext.itemRefCallback(
    currentElement.value,
    props.value,
    props.disabled,
  )
})

provideSelectItemContext({
  value: props.value,
  // The item's own state only: `SelectItemText` registers the native `<option>` once on mount,
  // so the root's `disabled` must not leak in (the native `<select>` already carries it).
  disabled: computed(() => Boolean(props.disabled)),
  textId,
  isSelected,
  onItemTextChange: (node) => {
    textValue.value = ((textValue.value || node?.textContent) ?? '').trim()
  },
})
</script>

<template>
  <CollectionItem :value="{ textValue, value }">
    <Primitive
      :ref="forwardRef"
      role="option"
      :aria-labelledby="textId"
      :data-highlighted="isFocused ? '' : undefined"
      :aria-selected="isSelected"
      :data-state="isSelected ? 'checked' : 'unchecked'"
      :aria-disabled="disabled || undefined"
      :data-disabled="disabled ? '' : undefined"
      :tabindex="disabled ? undefined : -1"
      :as="as"
      :as-child="asChild"
      @focus="isFocused = true"
      @blur="handleBlur"
      @click="handleClick"
      @pointerup="handlePointerUp"
      @pointerdown="handlePointerDown"
      @pointermove="handlePointerMove"
      @pointerleave="handlePointerLeave"
      @keydown="handleKeyDown"
      @keyup="handleKeyUp"
    >
      <slot :selected="isSelected" />
    </Primitive>
  </CollectionItem>
</template>
