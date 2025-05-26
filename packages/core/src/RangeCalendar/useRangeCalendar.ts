/*
  * Adapted from https://github.com/melt-ui/melt-ui/blob/develop/src/lib/builders/range-calendar/create.ts
*/

import type { DateValue } from '@internationalized/date'
import type { Ref } from 'vue'
import type { Matcher } from '@/date'
import { isSameDay } from '@internationalized/date'
import { computed } from 'vue'
import { areAllDaysBetweenValid, isBefore, isBetween } from '@/date'

export type UseRangeCalendarProps = {
  start: Ref<DateValue | undefined>
  end: Ref<DateValue | undefined>
  isDateDisabled: Matcher
  isDateUnavailable: Matcher
  isDateHighlightable?: Matcher
  focusedValue: Ref<DateValue | undefined>
  allowNonContiguousRanges: Ref<boolean>
  fixedDate: Ref<'start' | 'end' | undefined>
}

export function useRangeCalendarState(props: UseRangeCalendarProps) {
  const isStartInvalid = computed(() => {
    if (!props.start.value)
      return false
    if (props.isDateDisabled(props.start.value))
      return true
    return false
  })

  const isEndInvalid = computed(() => {
    if (!props.end.value)
      return false
    if (props.isDateDisabled(props.end.value))
      return true
    return false
  })

  const isInvalid = computed(
    () => {
      if (isStartInvalid.value || isEndInvalid.value)
        return false
      if (props.start.value && props.end.value && isBefore(props.end.value, props.start.value))
        return true
      return false
    },
  )

  const isSelectionStart = (date: DateValue) => {
    if (!props.start.value)
      return false
    return isSameDay(props.start.value, date)
  }

  const isSelectionEnd = (date: DateValue) => {
    if (!props.end.value)
      return false
    return isSameDay(props.end.value, date)
  }

  const isSelected = (date: DateValue) => {
    if (props.start.value && isSameDay(props.start.value, date))
      return true
    if (props.end.value && isSameDay(props.end.value, date))
      return true
    if (props.end.value && props.start.value)
      return isBetween(date, props.start.value, props.end.value)

    return false
  }

  const isDateHighlightable = (date: DateValue) => {
    if (props.isDateHighlightable?.(date))
      return true
    return false
  }

  const highlightedRange = computed(() => {
    if (props.start.value && props.end.value && !props.fixedDate.value)
      return null
    if (!props.start.value || !props.focusedValue.value)
      return null

    const isStartBeforeFocused = isBefore(props.start.value, props.focusedValue.value)
    const start = isStartBeforeFocused ? props.start.value : props.focusedValue.value
    const end = isStartBeforeFocused ? props.focusedValue.value : props.start.value

    if (isSameDay(start, end)) {
      return {
        start,
        end,
      }
    }

    const isValid = areAllDaysBetweenValid(start, end, props.allowNonContiguousRanges.value ? () => false : props.isDateUnavailable, props.isDateDisabled, props.isDateHighlightable)
    if (isValid) {
      return {
        start,
        end,
      }
    }
    return null
  })

  const isHighlightedStart = (date: DateValue) => {
    if (!highlightedRange.value || !highlightedRange.value.start)
      return false
    return isSameDay(highlightedRange.value.start, date)
  }

  const isHighlightedEnd = (date: DateValue) => {
    if (!highlightedRange.value || !highlightedRange.value.end)
      return false
    return isSameDay(highlightedRange.value.end, date)
  }

  return {
    isInvalid,
    isSelected,
    isDateHighlightable,
    highlightedRange,
    isSelectionStart,
    isSelectionEnd,
    isHighlightedStart,
    isHighlightedEnd,
  }
}
