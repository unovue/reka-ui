<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import {
  type DateValue,
  getLocalTimeZone,
  isSameDay,
  isSameMonth,
  isToday,
} from '@internationalized/date'
import { computed, nextTick } from 'vue'
import { useKbd } from '@/shared'
import { getDaysInMonth, isBetweenInclusive, toDate } from '@/date'

export interface RangeCalendarCellTriggerProps extends PrimitiveProps {
  day: DateValue
  month: DateValue
}

export interface RangeCalendarCellTriggerSlot {
  default: (props: {
    /** Current day */
    dayValue: string
    /** Current disable state */
    disabled: boolean
    /** Current selected state */
    selected: boolean
    /** Current today state */
    today: boolean
    /** Current outside view state */
    outsideView: boolean
    /** Current outside visible view state */
    outsideVisibleView: boolean
    /** Current unavailable state */
    unavailable: boolean
    /** Current highlighted state */
    highlighted: boolean
    /** Current highlighted start state */
    highlightedStart: boolean
    /** Current highlighted end state */
    highlightedEnd: boolean
    /** Current selection start state */
    selectionStart: boolean
    /** Current selection end state */
    selectionEnd: boolean

  }) => any
}
</script>

<script setup lang="ts">
import { Primitive, usePrimitiveElement } from '@/Primitive'
import { injectRangeCalendarRootContext } from './RangeCalendarRoot.vue'

const props = withDefaults(defineProps<RangeCalendarCellTriggerProps>(), { as: 'div' })
defineSlots<RangeCalendarCellTriggerSlot>()

const rootContext = injectRangeCalendarRootContext()

const kbd = useKbd()

const { primitiveElement, currentElement } = usePrimitiveElement()

const labelText = computed(() => rootContext.formatter.custom(toDate(props.day), {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
}))

const isDisabled = computed(() => rootContext.isDateDisabled(props.day))
const isUnavailable = computed(() => rootContext.isDateUnavailable?.(props.day) ?? false)
const isSelectedDate = computed(() => rootContext.isSelected(props.day))
const isSelectionStart = computed(() => rootContext.isSelectionStart(props.day))
const isSelectionEnd = computed(() => rootContext.isSelectionEnd(props.day))
const isHighlightStart = computed(() => rootContext.isHighlightedStart(props.day))
const isHighlightEnd = computed(() => rootContext.isHighlightedEnd(props.day))
const isHighlighted = computed(() => rootContext.highlightedRange.value
  ? isBetweenInclusive(props.day, rootContext.highlightedRange.value.start, rootContext.highlightedRange.value.end)
  : false)

const SELECTOR
  = '[data-reka-calendar-cell-trigger]:not([data-disabled]):not([data-outside-view]):not([data-outside-visible-view])'

const isDateToday = computed(() => {
  return isToday(props.day, getLocalTimeZone())
})
const isOutsideView = computed(() => {
  return !isSameMonth(props.day, props.month)
})
const isOutsideVisibleView = computed(() =>
  rootContext.isOutsideVisibleView(props.day),
)

const dayValue = computed(() => props.day.day.toLocaleString(rootContext.locale.value))

const isFocusedDate = computed(() => {
  return !rootContext.disabled.value && isSameDay(props.day, rootContext.placeholder.value)
})

function changeDate(e: MouseEvent | KeyboardEvent, date: DateValue) {
  if (rootContext.readonly.value)
    return
  if (rootContext.isDateDisabled(date) || rootContext.isDateUnavailable?.(date))
    return

  rootContext.lastPressedDateValue.value = date.copy()

  if (rootContext.startValue.value && rootContext.highlightedRange.value === null) {
    if (isSameDay(date, rootContext.startValue.value) && !rootContext.preventDeselect.value && !rootContext.endValue.value) {
      rootContext.startValue.value = undefined
      rootContext.onPlaceholderChange(date)
      return
    }
    else if (!rootContext.endValue.value) {
      e.preventDefault()
      if (rootContext.lastPressedDateValue.value && isSameDay(rootContext.lastPressedDateValue.value, date))
        rootContext.startValue.value = date.copy()
      return
    }
  }

  if (rootContext.startValue.value && rootContext.endValue.value && isSameDay(rootContext.endValue.value, date) && !rootContext.preventDeselect.value) {
    rootContext.startValue.value = undefined
    rootContext.endValue.value = undefined
    rootContext.onPlaceholderChange(date)
    return
  }

  if (!rootContext.startValue.value) {
    rootContext.startValue.value = date.copy()
  }
  else if (!rootContext.endValue.value) {
    rootContext.endValue.value = date.copy()
  }
  else if (rootContext.endValue.value && rootContext.startValue.value) {
    rootContext.endValue.value = undefined
    rootContext.startValue.value = date.copy()
  }
}

function handleClick(e: MouseEvent) {
  changeDate(e, props.day)
}

function handleFocus() {
  if (rootContext.isDateDisabled(props.day) || rootContext.isDateUnavailable?.(props.day))
    return
  rootContext.focusedValue.value = props.day.copy()
}

function handleArrowKey(e: KeyboardEvent) {
  e.preventDefault()
  e.stopPropagation()
  const parentElement = rootContext.parentElement.value!
  const allCollectionItems: HTMLElement[] = parentElement
    ? Array.from(parentElement.querySelectorAll(SELECTOR))
    : []

  const index = allCollectionItems.indexOf(currentElement.value)
  let newIndex = index
  const indexIncrementation = 7
  const sign = rootContext.dir.value === 'rtl' ? -1 : 1
  switch (e.code) {
    case kbd.ARROW_RIGHT:
      newIndex += sign
      break
    case kbd.ARROW_LEFT:
      newIndex -= sign
      break
    case kbd.ARROW_UP:
      newIndex -= indexIncrementation
      break
    case kbd.ARROW_DOWN:
      newIndex += indexIncrementation
      break
    case kbd.ENTER:
    case kbd.SPACE_CODE:
      changeDate(e, props.day)
      return
    default:
      return
  }

  if (newIndex >= 0 && newIndex < allCollectionItems.length) {
    allCollectionItems[newIndex].focus()
    return
  }

  if (newIndex < 0) {
    if (rootContext.isPrevButtonDisabled())
      return
    rootContext.prevPage()
    nextTick(() => {
      const newCollectionItems: HTMLElement[] = parentElement
        ? Array.from(parentElement.querySelectorAll(SELECTOR))
        : []
      if (!rootContext.pagedNavigation.value) {
        // Placeholder is set to first month of the new page
        const numberOfDays = getDaysInMonth(rootContext.placeholder.value)
        newCollectionItems[
          numberOfDays - Math.abs(newIndex)
        ].focus()
        return
      }
      newCollectionItems[
        newCollectionItems.length - Math.abs(newIndex)
      ].focus()
    })
    return
  }

  if (newIndex >= allCollectionItems.length) {
    if (rootContext.isNextButtonDisabled())
      return
    rootContext.nextPage()
    nextTick(() => {
      const newCollectionItems: HTMLElement[] = parentElement
        ? Array.from(parentElement.querySelectorAll(SELECTOR))
        : []

      if (!rootContext.pagedNavigation.value) {
        // Placeholder is set to first month of the new page
        const numberOfDays = getDaysInMonth(rootContext.placeholder.value.add({ months: rootContext.numberOfMonths.value - 1 }))
        newCollectionItems[newCollectionItems.length - numberOfDays + newIndex - allCollectionItems.length].focus()
        return
      }

      newCollectionItems[newIndex - allCollectionItems.length].focus()
    })
  }
}
</script>

<template>
  <Primitive
    ref="primitiveElement"
    v-bind="props"
    role="button"
    :aria-label="labelText"
    data-reka-calendar-cell-trigger
    :aria-selected="isSelectedDate && !isUnavailable ? true : undefined"
    :aria-disabled="isDisabled || isUnavailable ? true : undefined"
    :data-highlighted="isHighlighted && !isUnavailable ? '' : undefined"
    :data-selection-start="isSelectionStart ? true : undefined"
    :data-selection-end="isSelectionEnd ? true : undefined"
    :data-highlighted-start="isHighlightStart ? true : undefined"
    :data-highlighted-end="isHighlightEnd ? true : undefined"
    :data-selected="isSelectedDate && !isUnavailable ? true : undefined"
    :data-outside-visible-view="isOutsideVisibleView ? '' : undefined"
    :data-value="day.toString()"
    :data-disabled="isDisabled ? '' : undefined"
    :data-unavailable="isUnavailable ? '' : undefined"
    :data-today="isDateToday ? '' : undefined"
    :data-outside-view="isOutsideView ? '' : undefined"
    :data-focused="isFocusedDate ? '' : undefined"
    :tabindex="isFocusedDate ? 0 : isOutsideView || isDisabled ? undefined : -1"
    @click="handleClick"
    @focusin="handleFocus"
    @mouseenter="handleFocus"
    @keydown.up.down.left.right.enter.space="handleArrowKey"
  >
    <slot
      :day-value="dayValue"
      :disabled="isDisabled"
      :today="isDateToday"
      :selected="isSelectedDate"
      :outside-view="isOutsideView"
      :outside-visible-view="isOutsideVisibleView"
      :unavailable="isUnavailable"
      :highlighted="isHighlighted && !isUnavailable"
      :highlighted-start="isHighlightStart"
      :highlighted-end="isHighlightEnd"
      :selection-start="isSelectionStart"
      :selection-end="isSelectionEnd"
    >
      {{ dayValue }}
    </slot>
  </Primitive>
</template>
