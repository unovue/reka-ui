<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import type { AcceptableValue } from '@/shared/types'
import { useCollection } from '@/Collection'
import { Primitive } from '@/Primitive'
import { createContext, useForwardExpose, useId, valueComparator } from '@/shared'
import { injectGridboxRootContext } from './GridboxRoot.vue'

export interface GridboxCellProps<T = AcceptableValue> extends PrimitiveProps {
  /** The value given as data when submitted with a `name`. */
  value: T
  /** When `true`, prevents the user from interacting with the item. */
  disabled?: boolean
  /** The row index of this cell in the grid. */
  row?: number
  /** The column index of this cell in the grid. */
  col?: number
}

export type GridboxCellEmits<T = AcceptableValue> = {
  /** Event handler called when the selecting item. <br> It can be prevented by calling `event.preventDefault`. */
  select: [event: SelectEvent<T>]
}
export type SelectEvent<T> = CustomEvent<{ originalEvent: PointerEvent, value?: T }>

const GRIDBOX_SELECT = 'gridbox.select'

interface GridboxCellContext {
  isSelected: Ref<boolean>
  isHighlighted: Ref<boolean>
}

export const [injectGridboxCellContext, provideGridboxCellContext]
  = createContext<GridboxCellContext>('GridboxCell')
</script>

<script setup lang="ts" generic="T extends AcceptableValue = AcceptableValue">
import type { Ref } from 'vue'
import { computed, onMounted } from 'vue'

const props = withDefaults(defineProps<GridboxCellProps<T>>(), {
  as: 'div',
  row: 0,
  col: 0,
})
const emits = defineEmits<GridboxCellEmits<T>>()

const id = useId(undefined, 'reka-gridbox-cell')
const { CollectionItem } = useCollection()
const { forwardRef, currentElement } = useForwardExpose()
const rootContext = injectGridboxRootContext()

const isHighlighted = computed(() => currentElement.value === rootContext.highlightedElement.value)
const isSelected = computed(() => valueComparator(rootContext.modelValue.value, props.value, rootContext.by))
const disabled = computed(() => rootContext.disabled.value || props.disabled)

function handleClick(event: PointerEvent) {
  if (disabled.value)
    return

  rootContext.changeHighlight(currentElement.value!)

  const selectEvent = new CustomEvent(GRIDBOX_SELECT, {
    bubbles: false,
    cancelable: true,
    detail: { originalEvent: event, value: props.value },
  })

  emits('select', selectEvent as SelectEvent<T>)

  if (!selectEvent.defaultPrevented) {
    rootContext.onValueChange(props.value)
  }
}

function handleMouseEnter() {
  if (disabled.value || !rootContext.highlightOnHover.value)
    return
  rootContext.changeHighlight(currentElement.value!)
}

onMounted(() => {
  if (currentElement.value) {
    currentElement.value.dataset.row = String(props.row)
    currentElement.value.dataset.col = String(props.col)
  }
})

provideGridboxCellContext({
  isSelected,
  isHighlighted,
})
</script>

<template>
  <CollectionItem :value="{ value, row, col }">
    <Primitive
      :id="id"
      v-bind="$attrs"
      :ref="forwardRef"
      v-memo="[isHighlighted, isSelected]"
      role="gridcell"
      :tabindex="isHighlighted ? '0' : '-1'"
      :aria-selected="isSelected"
      :as="as"
      :as-child="asChild"
      :disabled="disabled"
      :data-disabled="disabled ? '' : undefined"
      :data-state="isSelected ? 'checked' : 'unchecked'"
      :data-highlighted="isHighlighted ? '' : undefined"
      @click.left="handleClick"
      @mouseenter="handleMouseEnter"
      @focus="() => rootContext.changeHighlight(currentElement!)"
    >
      <slot />
    </Primitive>
  </CollectionItem>
</template>
