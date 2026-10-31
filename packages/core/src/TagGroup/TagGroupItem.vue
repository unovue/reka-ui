<script lang="ts">
import type { ComputedRef, Ref } from 'vue'
import type { PrimitiveProps } from '@/Primitive'
import type { AcceptableValue } from '@/shared/types'
import { createContext, useForwardElement, useId } from '@/shared'

export interface TagGroupItemProps<T = AcceptableValue> extends PrimitiveProps {
  /** The unique value of the tag. */
  value: T
  /** When `true`, prevents the user from interacting with the tag. */
  disabled?: boolean
  /** A string representation of the tag's contents, used for typeahead and as the tag's accessible name. Defaults to the text of `TagGroupItemText`. */
  textValue?: string
}

export interface TagGroupItemContext {
  id: string
  disabled: ComputedRef<boolean>
  isTabStop: ComputedRef<boolean>
  textElement: Ref<HTMLElement | undefined>
  remove: (event?: Event) => void
}

export const [injectTagGroupItemContext, provideTagGroupItemContext]
  = createContext<TagGroupItemContext>('TagGroupItem')
</script>

<script setup lang="ts" generic="T extends AcceptableValue = AcceptableValue">
import { mergeProps, onBeforeUnmount } from 'vue'
import { renderAs } from '@/Primitive/renderAs'
import { useRovingFocusItem } from '@/RovingFocus/useRovingFocusItem'
import { injectTagGroupRootContext } from './TagGroupRoot.vue'
import { createTagGroupItem } from './useTagGroup'

defineOptions({
  // `$attrs` are merged under the roving and part bindings: the precedence
  // the former `RovingFocusItem` wrapper gave them.
  inheritAttrs: false,
})

const props = withDefaults(defineProps<TagGroupItemProps<T>>(), {
  as: 'div',
})

defineSlots<{
  default?: (props: {
    /** Whether the tag is selected */
    selected: boolean
    /** Whether the tag is disabled */
    disabled: boolean
  }) => any
}>()

const rootContext = injectTagGroupRootContext()
const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)

// Created (and registered) during setup so the group knows it has tags on its
// first render. Same factory as `useTagGroup().createItem`.
const { row, isSelected, disabled, context, unregister } = createTagGroupItem<AcceptableValue>(rootContext, {
  id: useId(undefined, 'reka-tag-group-item'),
  value: () => props.value,
  disabled: () => props.disabled,
  textValue: () => props.textValue,
  element: currentElement,
})
onBeforeUnmount(unregister)

// Like React Aria, a row owns its content through a `gridcell` wrapper, which
// `display: contents` keeps out of the layout. With `asChild` there is no
// element to wrap the content in, so the consumer provides the `gridcell`.
provideTagGroupItemContext(context)

// Arrow-key navigation (as a composable; the group handles the keys).
const roving = useRovingFocusItem({
  element: currentElement,
  tabStopId: () => context.id,
  focusable: () => !disabled.value,
})!
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="forwardRef"
    v-bind="mergeProps($attrs, roving.attrs(), row.attrs.value)"
  >
    <slot
      v-if="asChild"
      :selected="isSelected"
      :disabled="disabled"
    />
    <div
      v-else
      role="gridcell"
      style="display: contents"
    >
      <slot
        :selected="isSelected"
        :disabled="disabled"
      />
    </div>
  </component>
</template>
