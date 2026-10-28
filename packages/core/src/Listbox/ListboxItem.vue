<script lang="ts">
import type { Ref } from 'vue'
import type { PrimitiveProps } from '..'
import type { AcceptableValue } from '@/shared/types'
import { createContext, useForwardElement, useId } from '@/shared'

export interface ListboxItemProps<T = AcceptableValue> extends PrimitiveProps {
  /** The value given as data when submitted with a `name`. */
  value: T
  /** When `true`, prevents the user from interacting with the item. */
  disabled?: boolean
  /** Text used for the label registry; defaults to the rendered text content. */
  textValue?: string
}
export type SelectEvent<T> = CustomEvent<{ originalEvent: PointerEvent, value?: T }>

export type ListboxItemEmits<T = AcceptableValue> = {
  /** Event handler called when the selecting item. <br> It can be prevented by calling `event.preventDefault`. */
  select: [event: SelectEvent<T>]
}

interface ListboxItemContext {
  isSelected: Ref<boolean>
}

export const [injectListboxItemContext, provideListboxItemContext]
  = createContext<ListboxItemContext>('ListboxItem')
</script>

<script setup lang="ts"  generic="T extends AcceptableValue = AcceptableValue">
import { computed, mergeProps, onUnmounted, onUpdated, ref, watch, watchPostEffect } from 'vue'
import { useCollection } from '@/Collection'
import { Primitive } from '..'
import { injectListboxGroupContext } from './ListboxGroup.vue'
import { injectListboxRootContext } from './ListboxRoot.vue'
import { getListboxItemSurface } from './useListbox'
import { compare } from './utils'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<ListboxItemProps<T>>(), {
  as: 'div',
})
const emits = defineEmits<ListboxItemEmits<T>>()

defineSlots<{
  default?: (props: {
    /** Whether the item is currently selected */
    selected: boolean
  }) => any
}>()

const id = useId(undefined, 'reka-listbox-item')
const { CollectionItem } = useCollection()
const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)
const rootContext = injectListboxRootContext()

// role/tabindex/aria-selected/disabled + the click/Space select protocol and
// the hover highlight all come from the shared surface builder (single source
// with `useListboxRoot()`); the collection registration, the SSR id and the
// label registration stay in the SFC.
const surface = getListboxItemSurface(rootContext, () => props.value, () => props.disabled, {
  element: currentElement,
  onSelect: event => emits('select', event as SelectEvent<T>),
})

const isHighlighted = computed(() => surface.state.value.highlighted)
const isSelected = computed(() => surface.state.value.state === 'checked')
const disabled = computed(() => surface.state.value.disabled)

// Sticky: registered once mounted, never unregistered (#2824). Re-registered
// whenever `value` / `textValue` / `disabled` change (the post effect) or the
// item re-renders (`onUpdated`, which covers slot text that is not a prop);
// the registry ignores a rewrite that changes nothing. Text that changes
// without re-rendering this item (a child component updating on its own) is
// what `textValue` is for.
//
// A filtered-out item (#2824 item 7) renders nothing, so it has no text to
// read: it keeps the label it last rendered with.
const label = ref<string>()
// A reused item (index-keyed `v-for`) that now holds another value must not
// keep the old value's text: forget it, so the item renders once and re-measures.
watch(() => props.value, (value, old) => {
  if (!compare(value, old, rootContext.by))
    label.value = undefined
})
// What this item last registered: a re-render that changes none of it (a
// filter keystroke re-rendering a still-visible item) skips the registry.
// The skip compares the value's registry key, read here so the post effect
// tracks it: an object mutated in place under `by: 'id'` changes its key and
// must re-register. An object the registry keys by its whole content (no `by`,
// or a function `by`) always registers, which reads (and tracks) its fields.
const ALWAYS_REGISTER = Symbol('always')
function registryKey(value: T): unknown {
  if (value === null || typeof value !== 'object')
    return value
  const key = typeof rootContext.by === 'string' ? (value as Record<string, unknown>)[rootContext.by] : ALWAYS_REGISTER
  return key !== null && typeof key === 'object' ? ALWAYS_REGISTER : key
}
let registered: { value: T, key: unknown, text: string, disabled: boolean } | undefined
function syncLabel() {
  const text = props.textValue ?? (isFilteredOut.value ? label.value : currentElement.value?.textContent ?? '')
  if (text === undefined)
    return
  label.value = text
  const value = props.value
  const key = registryKey(value)
  const isDisabled = disabled.value
  if (key !== ALWAYS_REGISTER && registered && registered.value === value && Object.is(registered.key, key) && registered.text === text && registered.disabled === isDisabled)
    return
  registered = { value, key, text, disabled: isDisabled }
  rootContext.labels.register(value, text, isDisabled)
}

// Filtering: the item stays mounted (so it keeps its registrations) but
// renders nothing while filtered out, which also takes it out of the
// collection that navigation, typeahead and select-all walk.
const groupContext = injectListboxGroupContext(null)
const unregisterFilterItem = rootContext.registerFilterItem(id, {
  value: () => props.value,
  label: () => props.textValue ?? label.value,
  group: groupContext?.id,
})
onUnmounted(unregisterFilterItem)
const isFilteredOut = computed(() => rootContext.isFilteredOut(id))

watchPostEffect(syncLabel)
onUpdated(syncLabel)

provideListboxItemContext({
  isSelected,
})

// Binding order is part of the v2 contract: `v-bind="$attrs"` sat after `:id`
// and before every other binding, so a consumer `id` (e.g. ComboboxItem's)
// overrides the generated one, the surface's role/aria/data-* override
// same-named `$attrs`, and a consumer listener runs before the surface's
// handler. `mergeProps($attrs, surface.attrs.value)` in the template keeps
// exactly that precedence and listener chaining (never an object spread, which
// would clobber the handlers).
</script>

<template>
  <CollectionItem
    v-if="!isFilteredOut"
    :value="value"
  >
    <Primitive
      :id="id"
      v-bind="mergeProps($attrs, surface.attrs.value)"
      :ref="forwardRef"
      v-memo="[isHighlighted, isSelected, disabled, rootContext.focusable.value, ...Object.entries($attrs).flat()]"
      :as="as"
      :as-child="asChild"
    >
      <slot :selected="isSelected" />
    </Primitive>
  </CollectionItem>
</template>
