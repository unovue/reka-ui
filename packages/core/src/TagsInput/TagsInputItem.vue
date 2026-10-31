<script lang="ts">
import type { ComputedRef, Ref } from 'vue'
import type { AcceptableInputValue } from './TagsInputRoot.vue'
import type { PrimitiveProps } from '@/Primitive'
import { computed, mergeProps, toRef } from 'vue'
import { createContext, useForwardElement } from '@/shared'
import { injectTagsInputRootContext } from './TagsInputRoot.vue'
import { createTagsInputItemContext, getTagsInputItemSurface } from './useTagsInput'

export interface TagsInputItemProps extends PrimitiveProps {
  /** Value associated with the tags */
  value: AcceptableInputValue
  /** When `true`, prevents the user from interacting with the tags input. */
  disabled?: boolean
}

export interface TagsInputItemContext {
  value: Ref<AcceptableInputValue>
  displayValue: ComputedRef<string>
  isSelected: Ref<boolean>
  disabled?: Ref<boolean>
  /** Filled in by `TagsInputItemText`; backed by a ref, so assigning it updates `aria-labelledby`. */
  textId: string
}

export const [injectTagsInputItemContext, provideTagsInputItemContext]
  = createContext<TagsInputItemContext>('TagsInputItem')
</script>

<script setup lang="ts">
import { useCollectionItem } from '@/Collection'
import { renderAs } from '@/Primitive/renderAs'
import { useSelectorKey } from '@/shared/createKeyedSelector'
import { getterRef } from '@/shared/partSurface'

defineOptions({
  // `$attrs` are merged under the item's own bindings: the precedence the
  // former `CollectionItem` wrapper gave them.
  inheritAttrs: false,
})

const props = defineProps<TagsInputItemProps>()
const value = toRef(props, 'value')

const context = injectTagsInputRootContext()
const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)
// Registered with the root's collection from setup; no wrapper component.
useCollectionItem(currentElement, () => props.value)

// A keyed selector cell: moving the selection re-renders only the old and the new tag.
const isSelected = getterRef(context.selected
  ? useSelectorKey(context.selected, () => currentElement.value)
  : () => context.selectedElement.value === currentElement.value)

const disabled = computed(() => props.disabled || context.disabled.value)

const itemContext = provideTagsInputItemContext(createTagsInputItemContext(context, { value, isSelected, disabled }))
const item = getTagsInputItemSurface(itemContext)
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="forwardRef"
    data-reka-collection-item=""
    v-bind="mergeProps($attrs, item.attrs.value)"
  >
    <slot />
  </component>
</template>
