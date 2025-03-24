<script lang="ts">
import { createContext, getActiveElement, useDirection, useSelectionBehavior, useTypeahead } from '@/shared'
import type { Direction } from '@/shared/types'
import { flatten } from './utils'

export interface TreeRootProps<T = Record<string, any>, U extends Record<string, any> = Record<string, any>> extends PrimitiveProps {
  /** The controlled value of the tree. Can be binded with with `v-model`. */
  modelValue?: U | U[]
  /** The value of the tree when initially rendered. Use when you do not need to control the state of the tree */
  defaultValue?: U | U[]
  /** List of items */
  items?: T[]
  /** The controlled value of the expanded item. Can be binded with with `v-model`. */
  expanded?: string[]
  /** The value of the expanded tree when initially rendered. Use when you do not need to control the state of the expanded tree */
  defaultExpanded?: string[]
  /** This function is passed the index of each item and should return a unique key for that item */
  getKey: (val: T) => string
  /** This function is passed the index of each item and should return a list of children for that item */
  getChildren?: (val: T) => T[] | undefined
  /** How multiple selection should behave in the collection. */
  selectionBehavior?: 'toggle' | 'replace'
  /** Whether multiple options can be selected or not.  */
  multiple?: boolean
  /** The reading direction of the listbox when applicable. <br> If omitted, inherits globally from `ConfigProvider` or assumes LTR (left-to-right) reading mode. */
  dir?: Direction
  /** When `true`, prevents the user from interacting with tree  */
  disabled?: boolean
  /** When `true`, selecting parent will select the descendants. */
  propagateSelect?: boolean
}

export type TreeRootEmits<T = Record<string, any>> = {
  'update:modelValue': [val: T]
  'update:expanded': [val: string[]]
}

interface TreeRootContext<T = Record<string, any>> {
  modelValue: Ref<T | T[]>
  selectedKeys: Ref<string[]>
  onSelect: (val: T) => void
  expanded: Ref<string[]>
  onToggle: (val: T) => void
  items: Ref<T[]>
  expandedItems: Ref<T[]>
  getKey: (val: T) => string
  getChildren: (val: T) => T[] | undefined
  multiple: Ref<boolean>
  disabled: Ref<boolean>
  dir: Ref<Direction>
  propagateSelect: Ref<boolean>
  isVirtual: Ref<boolean>
  virtualKeydownHook: EventHook<KeyboardEvent>

  handleMultipleReplace: ReturnType<typeof useSelectionBehavior>['handleMultipleReplace']
}

export const [injectTreeRootContext, provideTreeRootContext] = createContext<TreeRootContext<any>>('TreeRoot')
</script>

<script setup lang="ts" generic="T extends Record<string, any>, U extends Record<string, any>">
import { Primitive, type PrimitiveProps } from '@/Primitive'
import { type EventHook, createEventHook, useVModel } from '@vueuse/core'
import { RovingFocusGroup } from '@/RovingFocus'
import { type Ref, computed, nextTick, ref, toRefs } from 'vue'
import { MAP_KEY_TO_FOCUS_INTENT } from '@/RovingFocus/utils'
import { flattenedItems, flattenItems, flattenFilter } from './utils'

const props = withDefaults(defineProps<TreeRootProps<T, U>>(), {
  as: 'ul',
  selectionBehavior: 'toggle',
  getChildren: (val: T) => val.children,
})
const emits = defineEmits<TreeRootEmits<U>>()

defineSlots<{
  default: (props: {
    flattenItems: FlattenedItem<T>[]
    modelValue: typeof modelValue.value
    expanded: typeof expanded.value
  }) => any
}>()

const { items, multiple, disabled, propagateSelect, dir: propDir } = toRefs(props)
const { handleTypeaheadSearch } = useTypeahead()
const dir = useDirection(propDir)
const rovingFocusGroupRef = ref<InstanceType<typeof RovingFocusGroup>>()

// Virtualizer
const isVirtual = ref(false)
const virtualKeydownHook = createEventHook<KeyboardEvent>()

const modelValue = useVModel(props, 'modelValue', emits, {
  // @ts-expect-error idk
  defaultValue: props.defaultValue ?? (multiple.value ? [] : undefined),
  passive: (props.modelValue === undefined) as false,
  deep: true,
}) as Ref<U | U[]>

const expanded = useVModel(props, 'expanded', emits, {
  // @ts-expect-error idk
  defaultValue: props.defaultExpanded ?? [],
  passive: (props.expanded === undefined) as false,
  deep: true,
}) as Ref<string[]>

const { onSelectItem, handleMultipleReplace } = useSelectionBehavior(modelValue, props)

const selectedKeys = computed(() => {
  if (multiple.value && Array.isArray(modelValue.value))
    return modelValue.value.map(i => props.getKey(i as any))
  else
    return [props.getKey(modelValue.value as any ?? {})]
})

const stext = ref<string>('')
const searchFunc : (T)=>bool = (i) ->props.getKey(item).toLowerCase().includes(stext.value)
const searchForceVisible = ref<string[]>([])

const expandedItems = computed(() => {
  const items = props.items ?? []
  const expandedKeys = expanded.value.map((i) => i)
  // when no search
  if (search.value === '') {
    return flattenItems(items, {
      expanded: expandedKeys,
      getKey: props.getKey,
      getChildren: props.getChildren,
    })
  } else {
    const st = search.value.toLowerCase()
    return flattenFilter(items, {
      predicate: searchFunc.value,
      forceVisible: searchForceVisible.value,
      getKey: props.getKey,
      getChildren: props.getChildren,
    })
  }
})

function handleKeydown(event: KeyboardEvent) {
  if (isVirtual.value) {
    virtualKeydownHook.trigger(event)
  }
  else {
    const collections = rovingFocusGroupRef.value?.getItems().map(i => i.ref)
    handleTypeaheadSearch(event.key, collections)
  }
}

function handleKeydownNavigation(event: KeyboardEvent) {
  if (isVirtual.value)
    return

  const intent = MAP_KEY_TO_FOCUS_INTENT[event.key]
  nextTick(() => {
    handleMultipleReplace(
      intent,
      getActiveElement(),
      rovingFocusGroupRef.value?.getItems!,
      expandedItems.value.map(i => i.value),
    )
  })
}

provideTreeRootContext({
  modelValue,
  selectedKeys,
  onSelect: (val) => {
    const condition = (baseValue: U) => props.getKey(baseValue as any ?? {}) === props.getKey(val)
    const exist = props.multiple && Array.isArray(modelValue.value) ? modelValue.value?.findIndex(condition) !== -1 : undefined
    onSelectItem(val, condition)

    if (props.propagateSelect && props.multiple && Array.isArray(modelValue.value)) {
      const children = flatten<U, any>(props.getChildren(val) ?? [])
      if (exist) {
        // remove all child
        modelValue.value = [...modelValue.value]
          .filter(i => !children.some(child => props.getKey(i as any ?? {}) === props.getKey(child as any)))
      }
      else {
        // select all child
        modelValue.value = [...modelValue.value, ...children]
      }
    }
  },
  expanded,
  onToggle(val) {
    const children = val ? props.getChildren(val) : undefined
    if (!children)
      return

    const key = props.getKey(val) ?? val
    if (expanded.value.includes(key))
      expanded.value = expanded.value.filter(val => val !== key)
    else
      expanded.value.push(key)
  },
  getKey: props.getKey,
  getChildren: props.getChildren,
  items,
  expandedItems,
  disabled,
  multiple,
  dir,
  propagateSelect,

  isVirtual,
  virtualKeydownHook,
  handleMultipleReplace,
})
</script>

<template>
  <RovingFocusGroup
    ref="rovingFocusGroupRef"
    as-child
    orientation="vertical"
    :dir="dir"
  >
    <Primitive
      role="tree"
      :as="as"
      :as-child="asChild"
      :aria-multiselectable="multiple ? true : undefined"
      @keydown="handleKeydown"
      @keydown.up.down.shift="handleKeydownNavigation"
    >
      <slot
        :flatten-items="expandedItems"
        :model-value="modelValue"
        :expanded="expanded"
      />
    </Primitive>
  </RovingFocusGroup>
</template>
