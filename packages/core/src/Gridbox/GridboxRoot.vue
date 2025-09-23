<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import type { AcceptableValue, Direction, FormFieldProps } from '@/shared/types'
import { Primitive, usePrimitiveElement } from '@/Primitive'
import { createContext, useDirection, useFormControl, useKbd, useTypeahead, valueComparator } from '@/shared'
import { VisuallyHiddenInput } from '@/VisuallyHidden'

type GridboxRootContext<T> = {
  modelValue: Ref<T | Array<T> | undefined>
  multiple: Ref<boolean>
  disabled: Ref<boolean>
  by?: string | ((a: T, b: T) => boolean)

  // Navigation state
  focusedElement: Ref<HTMLElement | null>
  selectionBehavior: Ref<'toggle' | 'replace'>
  dir: Ref<Direction>
  focusable: Ref<boolean>

  // Navigation methods
  onValueChange: (val: T) => void
  changeFocus: (el: HTMLElement, scrollIntoView?: boolean) => void
  onKeydownNavigation: (event: KeyboardEvent) => void
  onKeydownEnter: (event: KeyboardEvent) => void
  onKeydownTypeAhead: (event: KeyboardEvent) => void
  onEnter: (event: Event) => void
  onLeave: (event: Event) => void
  highlightFirstItem: () => void
}

export const [injectGridboxRootContext, provideGridboxRootContext]
  = createContext<GridboxRootContext<AcceptableValue>>('GridboxRoot')

export interface GridboxRootProps<T = AcceptableValue> extends PrimitiveProps, FormFieldProps {
  /** The controlled value of the gridbox. Can be binded with `v-model`. */
  modelValue?: T | Array<T>
  /** The value of the gridbox when initially rendered. Use when you do not need to control the state of the gridbox. */
  defaultValue?: T | Array<T>
  /** Whether multiple options can be selected or not. */
  multiple?: boolean
  /** When `true`, prevents the user from interacting with the gridbox */
  disabled?: boolean
  /** Use this to compare objects by a particular field, or pass your own comparison function for complete control over how objects are compared. */
  by?: string | ((a: T, b: T) => boolean)
  /** How multiple selection should behave in the collection. @defaultValue 'toggle' */
  selectionBehavior?: 'toggle' | 'replace'
  /** The reading direction when applicable. If omitted, inherits globally from ConfigProvider or assumes LTR. */
  dir?: Direction
}

export type GridboxRootEmits<T = AcceptableValue> = {
  /** Event handler called when the value changes. */
  'update:modelValue': [value: T]
  /** Event handler when focused element changes. */
  'focus': [payload: { ref: HTMLElement, value: T } | undefined]
  /** Event handler called when container is being focused. Can be prevented. */
  'entryFocus': [event: CustomEvent]
  /** Event handler called when the mouse leave the container */
  'leave': [event: Event]
}
</script>

<script setup lang="ts" generic="T extends AcceptableValue = AcceptableValue">
import type { Ref } from 'vue'
import { useVModel } from '@vueuse/core'
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

const { multiple, disabled, selectionBehavior, dir: propDir } = toRefs(props)
const { primitiveElement, currentElement } = usePrimitiveElement()
const { getItems } = useCollection<{ value: T, row: number, col: number }>({ isProvider: true })
const { handleTypeaheadSearch } = useTypeahead()
const kbd = useKbd()
const dir = useDirection(propDir)

const isFormControl = useFormControl(currentElement)
const focusedElement = ref<HTMLElement | null>(null)
const previousElement = ref<HTMLElement | null>(null)
const isUserAction = ref(false)
const focusable = ref(true)
const isComposing = ref(false)

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
  let currentCol = 0

  items.forEach((item) => {
    const row = Number(item.ref.dataset.row) || 0
    const col = Number(item.ref.dataset.col) || 0

    if (row !== currentRow) {
      currentRow = row
      currentCol = 0
      grid[row] = grid[row] || []
    }

    grid[row][col] = item.value.value
    cellMap.set(item.ref, { row, col, value: item.value.value })
  })

  return { grid, cellMap }
}

function changeFocus(el: HTMLElement, scrollIntoView = true) {
  if (!el)
    return

  focusedElement.value = el
  if (focusable.value) {
    focusedElement.value.focus()
  }
  if (scrollIntoView) {
    focusedElement.value.scrollIntoView({ block: 'nearest' })
  }

  const focusedItem = getItems().find(i => i.ref === el)
  emits('focus', focusedItem)
}

function onKeydownEnter(event: KeyboardEvent) {
  if (focusedElement.value && focusedElement.value.isConnected) {
    event.preventDefault()
    event.stopPropagation()

    if (!isComposing.value) {
      focusedElement.value.click()
    }
  }
}

function onKeydownTypeAhead(event: KeyboardEvent) {
  if (!focusable.value)
    return

  isUserAction.value = true
  const isMetaKey = event.altKey || event.ctrlKey || event.metaKey

  if (isMetaKey && event.key === 'a' && multiple.value) {
    const collection = getItems()
    const values = collection.map(i => i.value.value)
    modelValue.value = [...values]
    event.preventDefault()
    if (collection.length) {
      changeFocus(collection[collection.length - 1].ref)
    }
  }
  else if (!isMetaKey) {
    const el = handleTypeaheadSearch(event.key, getItems())
    if (el) {
      changeFocus(el)
    }
  }

  setTimeout(() => {
    isUserAction.value = false
  }, 1)
}

function onKeydownNavigation(event: KeyboardEvent) {
  if (!focusedElement.value)
    return

  const { grid, cellMap } = getGridStructure()
  const currentCell = cellMap.get(focusedElement.value)
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
      changeFocus(targetItem.ref)
    }
  }
}

function highlightFirstItem() {
  nextTick(() => {
    const items = getCollectionItems()
    if (items.length) {
      changeFocus(items[0])
    }
  })
}

function onLeave(event: Event) {
  const el = focusedElement.value
  if (el?.isConnected) {
    previousElement.value = el
  }
  focusedElement.value = null
  emits('leave', event)
}

function onEnter(event: Event) {
  const entryFocusEvent = new CustomEvent('gridbox.entryFocus', { bubbles: false, cancelable: true })
  event.currentTarget?.dispatchEvent(entryFocusEvent)
  emits('entryFocus', entryFocusEvent)

  if (entryFocusEvent.defaultPrevented)
    return

  if (previousElement.value) {
    changeFocus(previousElement.value)
  }
  else {
    const items = getCollectionItems()
    if (items.length) {
      changeFocus(items[0])
    }
  }
}

function focusSelected(event?: Event) {
  nextTick(() => {
    const items = getCollectionItems()
    const selectedItem = items.find(i => i.dataset.state === 'checked')
    if (selectedItem) {
      changeFocus(selectedItem)
    }
    else if (items.length) {
      changeFocus(items[0])
    }
  })
}

// Watch for programmatic changes
watch(modelValue, () => {
  if (!isUserAction.value) {
    nextTick(() => {
      focusSelected()
    })
  }
}, { immediate: true, deep: true })

provideGridboxRootContext({
  modelValue,
  multiple,
  disabled,
  by: props.by,
  focusedElement,
  selectionBehavior,
  dir,
  focusable,
  // @ts-expect-error Ignore generic types mismatch.
  onValueChange,
  changeFocus,
  onKeydownNavigation,
  onKeydownEnter,
  onKeydownTypeAhead,
  onEnter,
  onLeave,
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
      if (focusedElement && currentElement && !currentElement.contains(target)) {
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
