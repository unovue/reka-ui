<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import type { AcceptableValue, Direction, FormFieldProps } from '@/shared/types'
import { Primitive, usePrimitiveElement } from '@/Primitive'
import { createContext, useDirection, useFormControl, useKbd, valueComparator } from '@/shared'
import { VisuallyHiddenInput } from '@/VisuallyHidden'

type GridboxRootContext<T> = {
  modelValue: Ref<T | Array<T> | undefined>
  onValueChange: (val: T) => void
  multiple: Ref<boolean>
  dir: Ref<Direction>
  disabled: Ref<boolean>
  highlightOnHover: Ref<boolean>
  highlightedElement: Ref<HTMLElement | null>
  isVirtual: Ref<boolean>
  virtualFocusHook: EventHook<Event | null | undefined>
  virtualKeydownHook: EventHook<KeyboardEvent>
  virtualHighlightHook: EventHook<any>
  by?: string | ((a: T, b: T) => boolean)
  firstValue?: Ref<T | undefined>
  selectionBehavior?: Ref<'toggle' | 'replace'>

  focusable: Ref<boolean>

  onLeave: (event: Event) => void
  onEnter: (event: Event) => void
  changeHighlight: (el: HTMLElement, scrollIntoView?: boolean) => void
  onKeydownNavigation: (event: KeyboardEvent) => void
  onKeydownEnter: (event: KeyboardEvent) => void
  onKeydownTypeAhead: (event: KeyboardEvent) => void
  highlightFirstItem: () => void
}

export const [injectGridboxRootContext, provideGridboxRootContext]
  = createContext<GridboxRootContext<AcceptableValue>>('GridboxRoot')

export interface GridboxRootProps<T = AcceptableValue> extends PrimitiveProps, FormFieldProps {
  /** The controlled value of the gridbox. Can be binded with `v-model`. */
  modelValue?: T | Array<T>
  /**
   * The value of the gridbox when initially rendered.
   * Use when you do not need to control the state of the gridbox.
   */
  defaultValue?: T | Array<T>
  /** Whether multiple options can be selected or not. */
  multiple?: boolean
  /** When `true`, prevents the user from interacting with the gridbox */
  disabled?: boolean
  /** Use this to compare objects by a particular field, or pass your own comparison function for complete control over how objects are compared. */
  by?: string | ((a: T, b: T) => boolean)
  /**
   * How multiple selection should behave in the collection.
   * @defaultValue 'toggle'
   */
  selectionBehavior?: 'toggle' | 'replace'
  /** When `true`, hover over item will trigger highlight */
  highlightOnHover?: boolean
  /**
   * The reading direction when applicable.
   * If omitted, inherits globally from `ConfigProvider` or assumes LTR.
   */
  dir?: Direction
}

export type GridboxRootEmits<T = AcceptableValue> = {
  /** Event handler called when the value changes. */
  'update:modelValue': [value: T]
  /** Event handler when highlighted element changes. */
  'highlight': [payload: { ref: HTMLElement, value: T } | undefined]
  /** Event handler called when container is being focused. Can be prevented. */
  'entryFocus': [event: CustomEvent]
  /** Event handler called when the mouse leave the container. */
  'leave': [event: Event]
}
</script>

<script setup lang="ts" generic="T extends AcceptableValue = AcceptableValue">
import type { EventHook } from '@vueuse/core'
import type { Ref } from 'vue'
import { createEventHook, useVModel } from '@vueuse/core'
import { nextTick, ref, toRefs, watch } from 'vue'
import { useCollection } from '@/Collection'

const props = withDefaults(defineProps<GridboxRootProps>(), {
  selectionBehavior: 'toggle',
})
const emits = defineEmits<GridboxRootEmits>()

defineSlots<{
  default?: (props: {
    /** Current active value. */
    modelValue: typeof modelValue.value
  }) => any
}>()

const { multiple, disabled, selectionBehavior, highlightOnHover, dir: propDir } = toRefs(props)
const { primitiveElement, currentElement } = usePrimitiveElement()
const { getItems } = useCollection<{ value: T, row: number, col: number }>({ isProvider: true })
const kbd = useKbd()
const dir = useDirection(propDir)

const isFormControl = useFormControl(currentElement)
const highlightedElement = ref<HTMLElement | null>(null)
const previousElement = ref<HTMLElement | null>(null)
const isUserAction = ref(false)
const focusable = ref(true)
const firstValue = ref<T>()
const isVirtual = ref(false)
const virtualFocusHook = createEventHook<Event | null | undefined>()
const virtualKeydownHook = createEventHook<KeyboardEvent>()
const virtualHighlightHook = createEventHook<T>()

const modelValue = useVModel(props, 'modelValue', emits, {
  defaultValue: props.defaultValue ?? (multiple.value ? [] : undefined),
  passive: (props.modelValue === undefined) as false,
  deep: true,
}) as Ref<T | Array<T> | undefined>

function onValueChange(val: T) {
  isUserAction.value = true
  if (props.multiple) {
    const modelArray = Array.isArray(modelValue.value) ? [...modelValue.value] : []
    const index = modelArray.findIndex(i => valueComparator(i, val, props.by))
    if (props.selectionBehavior === 'toggle') {
      index === -1 ? modelArray.push(val) : modelArray.splice(index, 1)
      modelValue.value = modelArray
    }
    else {
      modelValue.value = [val]
    }
  }
  else {
    if (props.selectionBehavior === 'toggle') {
      if (valueComparator(modelValue.value, val, props.by))
        modelValue.value = undefined
      else
        modelValue.value = val
    }
    else {
      modelValue.value = val
    }
  }
  setTimeout(() => {
    isUserAction.value = false
  }, 1)
}

function getCollectionItems() {
  return getItems().map(i => i.ref).filter(i => i.dataset.disabled !== '')
}

function getGridStructure() {
  const items = getItems().filter(i => i.ref.dataset.disabled !== '')
  const grid: T[][] = []
  const cellMap = new Map<HTMLElement, { row: number, col: number, value: T }>()

  let currentRow = -1
  items.forEach((item) => {
    const row = Number(item.ref.dataset.row) || 0
    const col = Number(item.ref.dataset.col) || 0

    if (row !== currentRow) {
      currentRow = row
      grid[row] = grid[row] || []
    }

    grid[row][col] = item.value.value
    cellMap.set(item.ref, { row, col, value: item.value.value })
  })

  return { grid, cellMap }
}

function onKeydownEnter(event: KeyboardEvent) {
  if (highlightedElement.value && highlightedElement.value.isConnected) {
    event.preventDefault()
    event.stopPropagation()

    highlightedElement.value.click()
  }
}

function onKeydownTypeAhead(event: KeyboardEvent) {
  if (!focusable.value)
    return

  isUserAction.value = true
  if (isVirtual.value) {
    virtualKeydownHook.trigger(event)
  }
  else {
    const isMetaKey = event.altKey || event.ctrlKey || event.metaKey

    if (isMetaKey && event.key === 'a' && multiple.value) {
      const collection = getItems()
      const values = collection.map(i => i.value.value)
      modelValue.value = [...values]
      event.preventDefault()
      if (collection.length) {
        changeHighlight(collection[collection.length - 1].ref)
      }
    }
  }

  setTimeout(() => {
    isUserAction.value = false
  }, 1)
}

function onKeydownNavigation(event: KeyboardEvent) {
  if (isVirtual.value) {
    return virtualKeydownHook.trigger(event)
  }

  if (!highlightedElement.value)
    return

  const { grid, cellMap } = getGridStructure()
  const currentCell = cellMap.get(highlightedElement.value)
  if (!currentCell)
    return

  let targetRow = currentCell.row
  let targetCol = currentCell.col

  switch (event.key) {
    case kbd.ARROW_RIGHT:
      targetCol = Math.min(targetCol + 1, grid[targetRow]?.length - 1 || 0)
      if (targetCol === currentCell.col && targetRow < grid.length - 1) {
        targetRow++
        targetCol = 0
      }
      break
    case kbd.ARROW_LEFT:
      targetCol = Math.max(targetCol - 1, 0)
      if (targetCol === currentCell.col && targetRow > 0) {
        targetRow--
        targetCol = grid[targetRow]?.length - 1 || 0
      }
      break
    case kbd.ARROW_DOWN:
      targetRow = Math.min(targetRow + 1, grid.length - 1)
      targetCol = Math.min(targetCol, grid[targetRow]?.length - 1 || 0)
      break
    case kbd.ARROW_UP:
      targetRow = Math.max(targetRow - 1, 0)
      targetCol = Math.min(targetCol, grid[targetRow]?.length - 1 || 0)
      break
    case kbd.HOME:
      targetCol = 0
      break
    case kbd.END:
      targetCol = grid[targetRow]?.length - 1 || 0
      break
    default:
      return
  }

  const targetValue = grid[targetRow]?.[targetCol]
  if (targetValue) {
    const targetItem = getItems().find(i =>
      valueComparator(i.value.value, targetValue, props.by),
    )
    if (targetItem) {
      changeHighlight(targetItem.ref)
    }
  }
}

function onLeave(event: Event) {
  const el = highlightedElement.value

  if ((el as Node)?.isConnected) {
    previousElement.value = el
  }

  highlightedElement.value = null
  emits('leave', event)
}

function onEnter(event: Event) {
  const entryFocusEvent = new CustomEvent('gridbox.entryFocus', { bubbles: false, cancelable: true })
  event.currentTarget?.dispatchEvent(entryFocusEvent)
  emits('entryFocus', entryFocusEvent)

  if (entryFocusEvent.defaultPrevented)
    return

  if (previousElement.value) {
    changeHighlight(previousElement.value)
  }
  else {
    const el = getCollectionItems()?.[0]
    changeHighlight(el)
  }
}

function changeHighlight(el: HTMLElement, scrollIntoView = true) {
  if (!el)
    return

  highlightedElement.value = el
  if (focusable.value)
    highlightedElement.value.focus()
  if (scrollIntoView)
    highlightedElement.value.scrollIntoView({ block: 'nearest' })

  const highlightedItem = getItems().find(i => i.ref === el)
  emits('highlight', highlightedItem)
}

function highlightItem(value: T) {
  if (isVirtual.value) {
    virtualHighlightHook.trigger(value)
  }
  else {
    const item = getItems().find(i => valueComparator(i.value.value, value, props.by))
    if (item) {
      highlightedElement.value = item.ref
      changeHighlight(item.ref)
    }
  }
}

function highlightFirstItem() {
  nextTick(() => {
    const items = getCollectionItems()
    if (items.length) {
      changeHighlight(items[0])
    }
  })
}

async function highlightSelected(event?: Event) {
  await nextTick()
  if (isVirtual.value) {
    // Trigger on nextTick for Virtualizer to be mounted
    virtualFocusHook.trigger(event)
  }
  else {
    const collection = getCollectionItems()
    const item = collection.find(i => i.dataset.state === 'checked')
    if (item)
      changeHighlight(item)
    else if (collection.length)
      changeHighlight(collection[0])
  }
}

// Watch for programmatic changes
watch(modelValue, () => {
  if (!isUserAction.value) {
    nextTick(() => {
      highlightSelected()
    })
  }
}, { immediate: true, deep: true })

defineExpose({
  highlightedElement,
  highlightItem,
  highlightFirstItem,
  highlightSelected,
})

provideGridboxRootContext({
  modelValue,
  // @ts-expect-error Ignore generic types mismatch.
  onValueChange,
  multiple,
  dir,
  disabled,
  highlightOnHover,
  highlightedElement,
  isVirtual,
  virtualFocusHook,
  virtualKeydownHook,
  virtualHighlightHook,
  by: props.by,
  firstValue,
  selectionBehavior,

  focusable,

  onLeave,
  onEnter,
  changeHighlight,
  onKeydownNavigation,
  onKeydownEnter,
  onKeydownTypeAhead,
  highlightFirstItem,
})
</script>

<template>
  <Primitive
    ref="primitiveElement"
    :as="as"
    :as-child="asChild"
    :dir="dir"
    :data-disabled="disabled ? '' : undefined"
    @pointerleave="onLeave"
    @focusout="async (event: FocusEvent) => {
      const target = (event.relatedTarget || event.target) as HTMLElement | null
      await nextTick()
      if (highlightedElement && currentElement && !currentElement.contains(target)) {
        onLeave(event)
      }
    }"
  >
    <slot :model-value="modelValue" />

    <VisuallyHiddenInput
      v-if="isFormControl && name"
      :name="name"
      :value="modelValue"
      :disabled="disabled"
      :required="required"
    />
  </Primitive>
</template>
