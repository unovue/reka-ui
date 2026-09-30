<script lang="ts">
import type { ComputedRef, Ref } from 'vue'
import type { PrimitiveProps } from '@/Primitive'
import type { AcceptableValue } from '@/shared/types'
import { createContext, getActiveElement, useForwardExpose, useId } from '@/shared'

export interface TagGroupItemProps<T = AcceptableValue> extends PrimitiveProps {
  /** The unique value of the tag. */
  value: T
  /** When `true`, prevents the user from interacting with the tag. */
  disabled?: boolean
  /** A string representation of the tag's contents, used for typeahead and as the tag's accessible name. Defaults to the text of `TagGroupItemText`. */
  textValue?: string
}

interface TagGroupItemContext {
  id: string
  disabled: ComputedRef<boolean>
  isTabStop: ComputedRef<boolean>
  textElement: Ref<HTMLElement | undefined>
  remove: () => void
}

export const [injectTagGroupItemContext, provideTagGroupItemContext]
  = createContext<TagGroupItemContext>('TagGroupItem')
</script>

<script setup lang="ts" generic="T extends AcceptableValue = AcceptableValue">
import { computed, onBeforeUnmount, ref } from 'vue'
import { Primitive } from '@/Primitive'
import { RovingFocusItem } from '@/RovingFocus'
import { injectTagGroupRootContext } from './TagGroupRoot.vue'

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
const { forwardRef, currentElement } = useForwardExpose()

const id = useId(undefined, 'reka-tag-group-item')
const textElement = ref<HTMLElement>()

const disabled = computed(() => rootContext.disabled.value || props.disabled)
const isSelected = computed(() => rootContext.isSelected(props.value))
const isTabStop = computed(() => rootContext.currentTabStopId.value === id)

function getTextValue() {
  return props.textValue ?? textElement.value?.textContent?.trim() ?? currentElement.value?.textContent?.trim() ?? ''
}

function remove() {
  if (!disabled.value)
    rootContext.removeTags(props.value, false)
}

function handleKeydown(event: KeyboardEvent) {
  // Keys pressed on the tag's children (e.g. its delete button) are theirs.
  if (event.target !== event.currentTarget || disabled.value)
    return

  switch (event.key) {
    case 'Delete':
    case 'Backspace':
      if (!rootContext.allowsRemoving())
        return
      event.preventDefault()
      rootContext.removeTags(props.value, true)
      return
    case 'Enter':
    case ' ':
      if (rootContext.selectionMode.value === 'none')
        return
      event.preventDefault()
      rootContext.toggleSelection(props.value)
      return
  }

  if (event.key.length === 1 && event.key !== ' ' && !event.ctrlKey && !event.metaKey && !event.altKey)
    rootContext.handleTypeahead(event.key)
}

// Registered during setup so the group knows it has tags on its first render.
const unregister = rootContext.registerItem({
  value: () => props.value,
  element: () => currentElement.value,
  disabled: () => disabled.value,
  textValue: getTextValue,
})
onBeforeUnmount(() => {
  const element = currentElement.value
  if (element?.contains(getActiveElement()))
    rootContext.onFocusedItemUnmount(element)
  unregister()
})

// Like React Aria, a row owns its content through a `gridcell` wrapper, which
// `display: contents` keeps out of the layout. With `asChild` there is no
// element to wrap the content in, so the consumer provides the `gridcell`.
provideTagGroupItemContext({
  id,
  disabled,
  isTabStop,
  textElement,
  remove,
})
</script>

<template>
  <RovingFocusItem
    as-child
    :tab-stop-id="id"
    :focusable="!disabled"
  >
    <Primitive
      :id="id"
      :ref="forwardRef"
      :as="as"
      :as-child="asChild"
      role="row"
      :aria-label="textValue"
      :aria-selected="rootContext.selectionMode.value !== 'none' ? isSelected : undefined"
      :aria-disabled="disabled || undefined"
      :data-state="rootContext.selectionMode.value !== 'none' ? (isSelected ? 'checked' : 'unchecked') : undefined"
      :data-disabled="disabled ? '' : undefined"
      @click="!disabled && rootContext.toggleSelection(value)"
      @keydown="handleKeydown"
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
    </Primitive>
  </RovingFocusItem>
</template>
