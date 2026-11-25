<script lang="ts">
import { createRekaContext, handleAndDispatchCustomEvent, useForwardExpose, useId } from '@/shared'

export interface ListboxItemProps<T = AcceptableValue> extends PrimitiveProps {
  /** The value given as data when submitted with a `name`. */
  value: T
  /** When `true`, prevents the user from interacting with the item. */
  disabled?: boolean
}
export type SelectEvent<T> = CustomEvent<{ originalEvent: PointerEvent, value?: T }>

export type ListboxItemEmits<T = AcceptableValue> = {
  /** Event handler called when the selecting item. <br> It can be prevented by calling `event.preventDefault`. */
  select: [event: SelectEvent<T>]
}

const LISTBOX_SELECT = 'listbox.select'

interface ListboxItemContext {
  isSelected: Ref<boolean>
}

export const [injectListboxItemContext, provideListboxItemContext]
  = createRekaContext<ListboxItemContext>('ListboxItem')
</script>

<script setup lang="ts"  generic="T extends AcceptableValue = AcceptableValue">
import type { Ref } from 'vue'
import type { PrimitiveProps } from '..'
import type { AcceptableValue } from '@/shared/types'
import { computed, onBeforeUnmount, onScopeDispose } from 'vue'
import { useCollection } from '@/Collection'
import { useSelectorKey } from '@/shared/createKeyedSelector'
import { useAgentItem } from '@/shared/useAgentRegistration'
import { Primitive } from '..'
import { injectListboxRootContext } from './ListboxRoot.vue'
import { valueComparator } from './utils'

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
const { forwardRef, currentElement } = useForwardExpose()
const rootContext = injectListboxRootContext()
useAgentItem(rootContext, props, currentElement)

// Read from the root's keyed selector (one cell per item element) rather than compared against
// `highlightedElement`: a highlight move then notifies the two items it flips, not every item.
// A context without the selector (a hand-made one) compares against the shared ref.
const isHighlighted = computed(rootContext.highlight
  ? useSelectorKey(rootContext.highlight, () => currentElement.value)
  : () => currentElement.value != null && currentElement.value === rootContext.highlightedElement.value)
// Likewise for the selection: the root's selector notifies the items that entered or left it.
const selection = rootContext.selection
const selectionHold = selection?.createHold()
if (selectionHold)
  onScopeDispose(() => selectionHold.release())
const isSelected = computed(() => selection
  ? selection.isSelected(props.value, selectionHold)
  : valueComparator(rootContext.modelValue.value, props.value, rootContext.by))

const disabled = computed(() => rootContext.disabled.value || props.disabled)

// `aria-activedescendant` names the highlighted item. An item that leaves the document releases the highlight.
// A virtualized list unmounts rows as it scrolls, so `ListboxVirtualizer` owns the highlight there.
onBeforeUnmount(() => {
  if (!rootContext.isVirtual.value && rootContext.highlightedElement.value === currentElement.value)
    rootContext.highlightedElement.value = null
})

async function handleSelect(ev: SelectEvent<T>) {
  emits('select', ev)
  if (ev?.defaultPrevented)
    return

  if (!disabled.value && ev) {
    rootContext.onValueChange(props.value)
    rootContext.changeHighlight(currentElement.value)
  }
}

function handleSelectCustomEvent(ev: PointerEvent) {
  const eventDetail = { originalEvent: ev, value: props.value as T }
  handleAndDispatchCustomEvent(LISTBOX_SELECT, handleSelect, eventDetail)
}

provideListboxItemContext({
  isSelected,
})
</script>

<template>
  <CollectionItem :value="value">
    <Primitive
      :id="id"
      v-bind="$attrs"
      :ref="forwardRef"
      v-memo="[isHighlighted, isSelected, disabled, rootContext.focusable.value, ...Object.entries($attrs).flat()]"
      role="option"
      :tabindex="rootContext.focusable.value ? isHighlighted ? '0' : '-1' : -1"
      :aria-selected="isSelected"
      :aria-disabled="disabled || undefined"
      :as="as"
      :as-child="asChild"
      :disabled="disabled ? '' : undefined"
      :data-disabled="disabled ? '' : undefined"
      :data-highlighted="isHighlighted ? '' : undefined"
      :data-state="isSelected ? 'checked' : 'unchecked'"
      @click="handleSelectCustomEvent"
      @keydown.space.prevent="handleSelectCustomEvent"
      @pointermove="() => {
        if (rootContext.highlightedElement.value === currentElement)
          return

        if (rootContext.highlightOnHover.value)
          rootContext.changeHighlight(currentElement, false, false)
      }"
    >
      <slot :selected="isSelected" />
    </Primitive>
  </CollectionItem>
</template>
