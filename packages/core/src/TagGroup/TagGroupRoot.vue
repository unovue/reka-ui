<script lang="ts">
import type { Ref } from 'vue'
import type { TagGroupChangeReason } from './useTagGroup'
import type { PrimitiveProps } from '@/Primitive'
import type { BaseChangeReason, ChangeEventDetails } from '@/shared'
import type { AcceptableValue, Direction } from '@/shared/types'
import { createContext, useDirection, useForwardElement } from '@/shared'

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
  /** Event handler called before the selection changes; `details.cancel()` vetoes the change. */
  'beforeUpdate:modelValue': [value: T | Array<T> | undefined, details: ChangeEventDetails<TagGroupChangeReason>]
  /** Event handler called when the selection changes. */
  'update:modelValue': [value: T | Array<T> | undefined, details: ChangeEventDetails<TagGroupChangeReason>]
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

export interface TagGroupRootContext<T = AcceptableValue> {
  /** Read-only; change the selection with `toggleSelection`. */
  modelValue: Ref<T | Array<T> | undefined>
  selectionMode: Ref<TagGroupSelectionMode>
  disabled: Ref<boolean>
  currentTabStopId: Ref<string | null | undefined>
  allowsRemoving: () => boolean
  isSelected: (value: T) => boolean
  /** Returns `false` when the selection is unchanged or the change was cancelled. */
  toggleSelection: (value: T, reason?: TagGroupChangeReason | BaseChangeReason, event?: Event) => boolean
  removeTags: (value: T, withSelection: boolean, reason?: TagGroupChangeReason | BaseChangeReason, event?: Event) => void
  registerItem: (item: TagGroupItemRegistration) => () => void
  onFocusedItemUnmount: (element: HTMLElement) => void
  handleTypeahead: (key: string) => void
}

export const [injectTagGroupRootContext, provideTagGroupRootContext]
  = createContext<TagGroupRootContext>('TagGroupRoot')
</script>

<script setup lang="ts" generic="T extends AcceptableValue = AcceptableValue">
import { getCurrentInstance, onBeforeUnmount, onMounted, ref, toRefs } from 'vue'
import { injectFieldRootContext } from '@/Field'
import { Primitive } from '@/Primitive'
import { RovingFocusGroup } from '@/RovingFocus'
import { useTagGroup } from './useTagGroup'

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

const { dir: propDir } = toRefs(props)
const dir = useDirection(propDir)
const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)
const instance = getCurrentInstance()

// Optional Field participation: `injectFieldRootContext(null)` returns `null`
// outside a `FieldRoot`, so every binding below is inert without a Field.
const fieldContext = injectFieldRootContext(null)

// Tags register during their setup, which happens while this component
// renders, so the group reads "empty" only once mounted.
const isMounted = ref(false)
onMounted(() => {
  isMounted.value = true
})

const { modelValue, root, context, getFocusTarget } = useTagGroup<T>({
  modelValue: () => props.modelValue,
  defaultValue: props.defaultValue,
  selectionMode: () => props.selectionMode,
  disallowEmptySelection: () => props.disallowEmptySelection,
  escapeKeyBehavior: () => props.escapeKeyBehavior,
  disabled: () => Boolean(props.disabled || fieldContext?.disabled.value),
  dir,
  by: () => props.by,
  // Tags are removable only when the consumer listens to `remove`, as there is
  // nothing to remove them from otherwise.
  allowsRemoving: () => Boolean(instance?.vnode.props?.onRemove),
  mounted: isMounted,
  rootElement: currentElement,
  emit: emits,
})

function mergeIds(consumerValue: unknown, fieldValue: string | undefined) {
  return [consumerValue as string | undefined, fieldValue].filter(Boolean).join(' ') || undefined
}

let unregisterControl: (() => void) | undefined
onMounted(() => {
  unregisterControl = fieldContext?.registerControl({
    element: getFocusTarget,
    getValue: () => modelValue.value,
  })
})
onBeforeUnmount(() => unregisterControl?.())

// RovingFocusGroup owns the tab stop; the tags read it to make their delete button tabbable.
const currentTabStopId = context.currentTabStopId

provideTagGroupRootContext(context as unknown as TagGroupRootContext)
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
      v-bind="root.attrs.value"
      :aria-labelledby="mergeIds($attrs['aria-labelledby'], fieldContext?.labelId.value)"
      :aria-describedby="mergeIds($attrs['aria-describedby'], fieldContext?.describedBy.value)"
    >
      <slot :model-value="modelValue" />
    </Primitive>
  </RovingFocusGroup>
</template>
