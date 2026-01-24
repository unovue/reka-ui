<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import type { TemporalDate } from '@/temporal/types'
import { Temporal } from 'temporal-polyfill'
import { computed, nextTick } from 'vue'
import { isBetweenInclusive, toDate } from '@/date'
import { useKbd } from '@/shared'
import { isEqualMonth, isSameDay, isToday, toPlainDate } from '@/temporal/comparators'

export interface RangeCalendarCellTriggerProps extends PrimitiveProps {
  day: TemporalDate
  month: TemporalDate
}

export interface RangeCalendarCellTriggerSlot {
  default?: (props: {
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

const isUnavailable = computed(() => rootContext.isDateUnavailable?.(props.day) ?? false)
const isSelectedDate = computed(() => rootContext.isSelected(props.day))
const isSelectionStart = computed(() => rootContext.isSelectionStart(props.day))
const isSelectionEnd = computed(() => rootContext.isSelectionEnd(props.day))
const isHighlightStart = computed(() => rootContext.isHighlightedStart(props.day))
const isHighlightEnd = computed(() => rootContext.isHighlightedEnd(props.day))
const isHighlighted = computed(() => rootContext.highlightedRange.value
  ? isBetweenInclusive(props.day, rootContext.highlightedRange.value.start, rootContext.highlightedRange.value.end)
  : false)
const allowNonContiguousRanges = computed(() => rootContext.allowNonContiguousRanges.value)

const isDateToday = computed(() => {
  return isToday(props.day)
})
const isOutsideView = computed(() => {
  return !isEqualMonth(props.day, props.month)
})
const isOutsideVisibleView = computed(() =>
  rootContext.isOutsideVisibleView(props.day),
)

const isDisabled = computed(() => rootContext.isDateDisabled(props.day) || (rootContext.disableDaysOutsideCurrentView.value && isOutsideView.value))

const dayValue = computed(() => props.day.day.toLocaleString(rootContext.locale.value))

const isFocusedDate = computed(() => {
  if (isOutsideView.value || isDisabled.value)
    return false
  if (!rootContext.disabled.value && rootContext.isPlaceholderFocusable.value && isSameDay(props.day, rootContext.placeholder.value))
    return true
  if (!rootContext.disabled.value && rootContext.selectedFocusableDate.value && !rootContext.isPlaceholderFocusable.value)
    return isSameDay(props.day, rootContext.selectedFocusableDate.value)
  if (!rootContext.disabled.value && (!rootContext.hasSelectedDate.value || rootContext.isSelectedDisabled.value) && !rootContext.isPlaceholderFocusable.value)
    return rootContext.firstFocusableDate.value && isSameDay(props.day, rootContext.firstFocusableDate.value)
  return false
})

function changeDate(e: MouseEvent | KeyboardEvent, date: TemporalDate) {
  if (rootContext.readonly.value)
    return
  if (rootContext.isDateDisabled(date) || rootContext.isDateUnavailable?.(date))
    return

<<<<<<< HEAD
=======
  rootContext.lastPressedDateValue.value = date

>>>>>>> 4920baae (feat(RangeCalendar): migrate to temporal)
  if (rootContext.startValue.value && rootContext.highlightedRange.value === null) {
    if (isSameDay(date, rootContext.startValue.value) && !rootContext.preventDeselect.value && !rootContext.endValue.value) {
      rootContext.startValue.value = undefined
      rootContext.onPlaceholderChange(date)
      rootContext.lastPressedDateValue.value = date.copy()
      return
    }
    else if (!rootContext.endValue.value) {
      e.preventDefault()
      if (rootContext.lastPressedDateValue.value && isSameDay(rootContext.lastPressedDateValue.value, date))
<<<<<<< HEAD
        rootContext.startValue.value = date.copy()
      rootContext.lastPressedDateValue.value = date.copy()
=======
        rootContext.startValue.value = date
>>>>>>> 4920baae (feat(RangeCalendar): migrate to temporal)
      return
    }
  }

  rootContext.lastPressedDateValue.value = date.copy()

  if (
    rootContext.startValue.value
    && rootContext.endValue.value
    && isSameDay(rootContext.startValue.value, rootContext.endValue.value)
    && isSameDay(rootContext.startValue.value, date)
    && !rootContext.preventDeselect.value
  ) {
    rootContext.startValue.value = undefined
    rootContext.endValue.value = undefined
    rootContext.onPlaceholderChange(date)
    return
  }

  if (!rootContext.startValue.value) {
    rootContext.startValue.value = date
  }
  else if (!rootContext.endValue.value) {
    rootContext.endValue.value = date
  }
  else if (rootContext.endValue.value && rootContext.startValue.value) {
    if (!rootContext.fixedDate.value) {
      rootContext.endValue.value = undefined
      rootContext.startValue.value = date
    }
    else if (rootContext.fixedDate.value === 'start') {
      if (Temporal.PlainDate.compare(toPlainDate(date), toPlainDate(rootContext.startValue.value)) < 0) {
        rootContext.startValue.value = date
      }
      else {
        rootContext.endValue.value = date
      }
    }
    else if (rootContext.fixedDate.value === 'end') {
      if (Temporal.PlainDate.compare(toPlainDate(date), toPlainDate(rootContext.endValue.value)) > 0) {
        rootContext.endValue.value = date
      }
      else {
        rootContext.startValue.value = date
      }
    }
  }
}

function handleClick(e: MouseEvent) {
  if (isDisabled.value)
    return
  changeDate(e, props.day)
}

function handleFocus() {
  if (isDisabled.value || rootContext.isDateUnavailable?.(props.day))
    return
  rootContext.focusedValue.value = props.day
}

function handleArrowKey(e: KeyboardEvent) {
  if (isDisabled.value)
    return
  // Modifier combos on Enter/Space (e.g. Ctrl+Enter) are not handled by the cell —
  // let them bubble so parent listeners can react (e.g. submit a form).
  if ((e.code === kbd.ENTER || e.code === kbd.SPACE_CODE) && (e.ctrlKey || e.metaKey || e.altKey))
    return
  e.preventDefault()
  e.stopPropagation()
  const parentElement = rootContext.parentElement.value!
  const indexIncrementation = 7
  const sign = rootContext.dir.value === 'rtl' ? -1 : 1
  switch (e.code) {
    case kbd.ARROW_RIGHT:
      shiftFocus(props.day, sign)
      break
    case kbd.ARROW_LEFT:
      shiftFocus(props.day, -sign)
      break
    case kbd.ARROW_UP:
      shiftFocus(props.day, -indexIncrementation)
      break
    case kbd.ARROW_DOWN:
      shiftFocus(props.day, indexIncrementation)
      break
    case kbd.ENTER:
    case kbd.SPACE_CODE:
      changeDate(e, props.day)
  }

  function shiftFocus(day: TemporalDate, add: number) {
    const candidateDayValue = day.add({ days: add })

    if ((rootContext.minValue.value && Temporal.PlainDate.compare(toPlainDate(candidateDayValue), toPlainDate(rootContext.minValue.value)) < 0) || (rootContext.maxValue.value && Temporal.PlainDate.compare(toPlainDate(candidateDayValue), toPlainDate(rootContext.maxValue.value)) > 0))
      return

    const candidateDay = parentElement.querySelector<HTMLElement>(`[data-value='${candidateDayValue.toString()}']:not([data-outside-view])`)
    // If the date is not found it means we must change the page
    if (!candidateDay) {
      if (add > 0) {
        if (rootContext.isNextButtonDisabled())
          return
        rootContext.nextPage()
      }
      else {
        if (rootContext.isPrevButtonDisabled())
          return
        rootContext.prevPage()
      }
      nextTick(() => {
        shiftFocus(day, add)
      })
      return
    }

    if (candidateDay && candidateDay.hasAttribute('data-disabled')) {
      return shiftFocus(candidateDayValue, add)
    }
    rootContext.onPlaceholderChange(candidateDayValue)
    candidateDay?.focus()
  }
}
</script>

<template>
  <Primitive
    ref="primitiveElement"
    :as="as"
    :as-child="asChild"
    role="button"
    :aria-label="labelText"
    data-reka-calendar-cell-trigger
    :aria-pressed="isSelectedDate && (allowNonContiguousRanges || !isUnavailable) ? true : undefined"
    :aria-disabled="isDisabled || isUnavailable ? true : undefined"
    :data-highlighted="isHighlighted && (allowNonContiguousRanges || !isUnavailable) ? '' : undefined"
    :data-selection-start="isSelectionStart ? true : undefined"
    :data-selection-end="isSelectionEnd ? true : undefined"
    :data-highlighted-start="isHighlightStart ? true : undefined"
    :data-highlighted-end="isHighlightEnd ? true : undefined"
    :data-selected="isSelectedDate && (allowNonContiguousRanges || !isUnavailable) ? true : undefined"
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
      :highlighted="isHighlighted && (allowNonContiguousRanges || !isUnavailable)"
      :highlighted-start="isHighlightStart"
      :highlighted-end="isHighlightEnd"
      :selection-start="isSelectionStart"
      :selection-end="isSelectionEnd"
    >
      {{ dayValue }}
    </slot>
  </Primitive>
</template>
