<script lang="ts">
export interface TreeItemProps<T> extends PrimitiveProps {
  /** Value given to this item */
  value: T
  /** Level of depth */
  level: number
  /** When `true`, prevents the user from interacting with the item. */
  disabled?: boolean
}

export type SelectEvent<T> = CustomEvent<{ originalEvent: PointerEvent | KeyboardEvent, value?: T, isExpanded: boolean, isSelected: boolean }>
export type ToggleEvent<T> = CustomEvent<{ originalEvent: PointerEvent | KeyboardEvent, value?: T, isExpanded: boolean, isSelected: boolean }>

export type TreeItemEmits<T> = {
  /** Event handler called when the selecting item. <br> It can be prevented by calling `event.preventDefault`. */
  select: [event: SelectEvent<T>]
  /** Event handler called when the selecting item. <br> It can be prevented by calling `event.preventDefault`. */
  toggle: [event: ToggleEvent<T>]
}
</script>

<script setup lang="ts" generic="T extends Record<string, any>">
import type { PrimitiveProps } from '@/Primitive'
import { mergeProps } from 'vue'
import { useCollection } from '@/Collection'
import { Primitive } from '@/Primitive'
import { RovingFocusItem } from '@/RovingFocus'
import { mergeExpose, useForwardElement } from '@/shared'
import { injectTreeRootContext } from './TreeRoot.vue'
import { getTreeItemStatus, getTreeItemSurface } from './useTree'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<TreeItemProps<T>>(), {
  as: 'li',
})

const emits = defineEmits<TreeItemEmits<T>>()

defineSlots<{
  default?: (props: {
    isExpanded: boolean
    isSelected: boolean
    isIndeterminate: boolean | undefined
    isDisabled: boolean
    handleToggle: () => void
    handleSelect: () => void
  }) => any
}>()
const rootContext = injectTreeRootContext()
const { getItems } = useCollection()

// Item state, aria/data-* and the click/keydown handlers come from the shared
// builders (single source with `useTree().getItemSurface`); the
// `RovingFocusItem` wrapper (arrow-key focus) stays in the SFC. The template
// binds `mergeProps($attrs, surface.attrs)`: `$attrs` first keeps the v2
// precedence (the part's role/aria win over a consumer's) and chains listeners.
const status = getTreeItemStatus(rootContext, () => props.value, () => props.disabled)
const { isExpanded, isSelected, isIndeterminate, isDisabled } = status
const surface = getTreeItemSurface(rootContext, {
  value: () => props.value,
  level: () => props.level,
  status,
  getItems,
  onSelect: event => emits('select', event),
  onToggle: event => emits('toggle', event),
})

function handleToggle() {
  rootContext.onToggle(props.value)
}
function handleSelect() {
  rootContext.onSelect(props.value)
}

const { forwardRef, expose } = useForwardElement()
defineExpose(mergeExpose(expose, {
  isExpanded,
  isSelected,
  isIndeterminate,
  isDisabled,
  handleToggle,
  handleSelect,
}))
</script>

<template>
  <RovingFocusItem
    :ref="forwardRef"
    as-child
    :value="value"
    allow-shift-key
    :focusable="!isDisabled"
  >
    <Primitive
      :as="as"
      :as-child="asChild"
      v-bind="mergeProps($attrs, surface.attrs.value)"
    >
      <slot
        :is-expanded="isExpanded"
        :is-selected="isSelected"
        :is-indeterminate="isIndeterminate"
        :is-disabled="isDisabled"
        :handle-select="handleSelect"
        :handle-toggle="handleToggle"
      />
    </Primitive>
  </RovingFocusItem>
</template>
