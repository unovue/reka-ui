<script lang="ts">
import type { KeyedSelector } from '@/shared/createKeyedSelector'
import type { Direction } from '@/shared/types'
import { createContext, useDirection, useForwardElement } from '@/shared'

export interface TreeRootProps<T = Record<string, any>, U extends Record<string, any> = Record<string, any>, M extends boolean = false> extends PrimitiveProps {
  /** The controlled value of the tree. Can be binded with `v-model`. */
  modelValue?: M extends true ? U[] : U
  /** The value of the tree when initially rendered. Use when you do not need to control the state of the tree */
  defaultValue?: M extends true ? U[] : U
  /** List of items */
  items?: T[]
  /** The controlled value of the expanded item. Can be binded with `v-model`. */
  expanded?: string[]
  /** The value of the expanded tree when initially rendered. Use when you do not need to control the state of the expanded tree */
  defaultExpanded?: string[]
  /** Returns a unique key for an item. Keys identify items in the selection and in `expanded`, so they must be strings: convert a numeric id with `String(item.id)`. */
  getKey: (val: T) => string
  /** Returns an item's children. `undefined` marks a leaf. An array, even an empty one, marks a branch that can be expanded: return `[]` for children that are loaded when the item expands. */
  getChildren?: (val: T) => T[] | undefined
  /** How multiple selection should behave in the collection. */
  selectionBehavior?: 'toggle' | 'replace'
  /** Whether multiple options can be selected or not.  */
  multiple?: M | boolean
  /** The reading direction of the listbox when applicable. <br> If omitted, inherits globally from `ConfigProvider` or assumes LTR (left-to-right) reading mode. */
  dir?: Direction
  /** When `true`, prevents the user from interacting with tree  */
  disabled?: boolean
  /** When `true`, selecting parent will select the descendants. Requires `multiple` to be `true`. */
  propagateSelect?: boolean
  /** When `true`, selecting children will update the parent state. Requires `multiple` to be `true`. */
  bubbleSelect?: boolean
  /** When `true`, keyboard navigation will loop from last item to first, and vice versa. */
  loop?: boolean
}

export type TreeRootEmits<T = Record<string, any>, M extends boolean = false> = {
  /** Event handler called before the selection changes; call `details.cancel()` to keep the current selection. */
  'beforeUpdate:modelValue': [val: M extends true ? T[] : T, details: ChangeEventDetails<TreeChangeReason>]
  /** Event handler called when the selection changes. */
  'update:modelValue': [val: M extends true ? T[] : T, details: ChangeEventDetails<TreeChangeReason>]
  /** Event handler called before the expanded items change; call `details.cancel()` to keep them. */
  'beforeUpdate:expanded': [val: string[], details: ChangeEventDetails<TreeExpandedChangeReason>]
  /** Event handler called when the expanded items change. */
  'update:expanded': [val: string[], details: ChangeEventDetails<TreeExpandedChangeReason>]
}

export interface TreeRootContext<T = Record<string, any>> {
  /** Read-only: call `onSelect` to change the selection. */
  modelValue: Readonly<Ref<T | T[] | undefined>>
  selectedKeys: Readonly<Ref<string[]>>
  /** Returns `false` when the selection is unchanged or the change was cancelled. */
  onSelect: (val: T, reason?: TreeChangeReason | BaseChangeReason, event?: Event) => boolean
  /** Writes the whole selection in one change (no toggle rules), e.g. a select-all part. Returns `false` when unchanged or cancelled. */
  setModelValue: (value: T | T[] | undefined, reason?: TreeChangeReason | BaseChangeReason, event?: Event) => boolean
  /** Read-only: call `onToggle` to expand or collapse an item. */
  expanded: Readonly<Ref<string[]>>
  /** `expanded` as a keyed selector: items read their own cell. */
  expandedSelector?: KeyedSelector<string>
  /** `selectedKeys` as a keyed selector: items read their own cell. */
  selectedSelector?: KeyedSelector<string>
  /** Returns `false` when the item has no children, or the change was cancelled. */
  onToggle: (val: T, reason?: TreeExpandedChangeReason | BaseChangeReason, event?: Event) => boolean
  /** Writes the expanded keys in one change, e.g. an expand-all part. Returns `false` when unchanged or cancelled. */
  setExpanded: (value: string[], reason?: TreeExpandedChangeReason | BaseChangeReason, event?: Event) => boolean
  /** The `items` prop; `undefined` when none was passed. */
  items: Readonly<Ref<T[] | undefined>>
  expandedItems: Readonly<Ref<FlattenedItem<T>[]>>
  getKey: (val: T) => string
  getChildren: (val: T) => T[] | undefined
  multiple: Readonly<Ref<boolean>>
  disabled: Readonly<Ref<boolean>>
  dir: Readonly<Ref<Direction>>
  propagateSelect: Readonly<Ref<boolean>>
  bubbleSelect: Readonly<Ref<boolean>>
  loop: Readonly<Ref<boolean>>
  isVirtual: Ref<boolean>
  virtualKeydownHook: EventHook<KeyboardEvent>

  /** Extends a `multiple` + `'replace'` selection to the focused item; reports `'range-select'`. */
  handleMultipleReplace: (intent: TreeNavigationIntent, currentElement: HTMLElement | Element | null, getItems: () => TreeCollectionItem[], options: T[], event?: Event) => boolean
}

export type FlattenedItem<T> = {
  _id: string
  index: number
  value: T
  level: number
  hasChildren: boolean
  parentItem?: T
  bind: {
    value: T
    level: number
    [key: string]: any
  }
}

export const [injectTreeRootContext, provideTreeRootContext] = createContext<TreeRootContext<any>>('TreeRoot')
</script>

<script setup lang="ts" generic="T extends Record<string, any>, U extends Record<string, any>, M extends boolean = false">
import type { EventHook } from '@vueuse/core'
import type { Ref } from 'vue'
import type { TreeChangeReason, TreeCollectionItem, TreeExpandedChangeReason, TreeNavigationIntent } from './useTree'
import type { PrimitiveProps } from '@/Primitive'
import type { BaseChangeReason, ChangeEventDetails } from '@/shared'
import { mergeProps } from 'vue'
import { renderAs } from '@/Primitive/renderAs'
import { useRovingFocusGroup } from '@/RovingFocus/useRovingFocusGroup'
import { useTree } from './useTree'

defineOptions({
  // `$attrs` are merged under the roving and root bindings: the precedence
  // the former `<RovingFocusGroup as-child>` wrapper gave them.
  inheritAttrs: false,
})

const props = withDefaults(defineProps<TreeRootProps<T, U, M>>(), {
  as: 'ul',
  selectionBehavior: 'toggle',
  getChildren: (val: T) => val.children,
})
const emits = defineEmits<TreeRootEmits<U, M>>()

defineSlots<{
  default?: (props: {
    flattenItems: FlattenedItem<T>[]
    modelValue: M extends true ? U[] : U
    expanded: string[]
  }) => any
}>()

// `dir` resolution (ConfigProvider-aware) and the roving group (arrow-key
// focus) stay in the shell; the composable owns both models
// (`useControllableState`), the flattened items, typeahead and range selection.
const dir = useDirection(() => props.dir)
const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)

const { modelValue, expanded, flattenItems, root, context } = useTree<T>({
  items: () => props.items,
  getKey: val => props.getKey(val),
  getChildren: val => props.getChildren(val),
  modelValue: () => props.modelValue as T | T[] | undefined,
  defaultValue: props.defaultValue as T | T[] | undefined,
  expanded: () => props.expanded,
  defaultExpanded: props.defaultExpanded,
  multiple: () => props.multiple,
  selectionBehavior: () => props.selectionBehavior,
  disabled: () => props.disabled,
  dir,
  propagateSelect: () => props.propagateSelect,
  bubbleSelect: () => props.bubbleSelect,
  loop: () => props.loop,
  getItems: () => roving.getItems(),
  emit: emits,
})

provideTreeRootContext(context)

const isVirtual = context.isVirtual
const roving = useRovingFocusGroup({
  element: currentElement,
  orientation: () => 'vertical',
  dir: () => dir.value,
  loop: () => props.loop && !isVirtual.value,
})
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="forwardRef"
    v-bind="mergeProps($attrs, roving.attrs(), root.attrs.value)"
  >
    <slot
      :flatten-items="flattenItems"
      :model-value="modelValue as M extends true ? U[] : U"
      :expanded="expanded"
    />
  </component>
</template>
