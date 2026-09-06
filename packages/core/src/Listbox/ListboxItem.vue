<script lang="ts">
import type { Ref } from 'vue'
import type { PrimitiveProps } from '..'
import type { AcceptableValue } from '@/shared/types'
import { createContext, useForwardExpose, useId } from '@/shared'

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
import { computed, mergeProps, onUpdated, watchPostEffect } from 'vue'
import { useCollection } from '@/Collection'
import { Primitive } from '..'
import { injectListboxRootContext } from './ListboxRoot.vue'
import { getListboxItemSurface } from './useListbox'

const props = withDefaults(defineProps<ListboxItemProps<T>>(), {
  as: 'div',
})
const emits = defineEmits<ListboxItemEmits<T>>()

const id = useId(undefined, 'reka-listbox-item')
const { CollectionItem } = useCollection()
const { forwardRef, currentElement } = useForwardExpose()
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
function syncLabel() {
  rootContext.labels.register(props.value, props.textValue ?? currentElement.value?.textContent ?? '', disabled.value)
}
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
  <CollectionItem :value="value">
    <Primitive
      :id="id"
      v-bind="mergeProps($attrs, surface.attrs.value)"
      :ref="forwardRef"
      v-memo="[isHighlighted, isSelected, disabled, rootContext.focusable.value]"
      :as="as"
      :as-child="asChild"
    >
      <slot />
    </Primitive>
  </CollectionItem>
</template>
