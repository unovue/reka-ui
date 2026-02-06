/*
  * Adapted from https://github.com/melt-ui/melt-ui/blob/develop/src/lib/builders/calendar/create.ts
*/

import type { Ref } from 'vue'
import type { Grid, Matcher, WeekDayFormat, WeekStartsOn } from '@/date'
import type { DateFormatterOptions } from '@/shared/useDateFormatter'
import type { TemporalDate } from '@/temporal/types'
import { Temporal } from 'temporal-polyfill'
import { computed, ref, watch } from 'vue'
import { createMonths } from '@/date'
import { useDateFormatter } from '@/shared'
import { getDaysInMonth, isAfter, isBefore, isEqualMonth, isSameDay, isZonedDateTime, toPlainDate } from '@/temporal/comparators'

export type UseCalendarProps = {
  locale: Ref<string>
  placeholder: Ref<TemporalDate>
  weekStartsOn: Ref<WeekStartsOn>
  fixedWeeks: Ref<boolean>
  numberOfMonths: Ref<number>
  minValue: Ref<TemporalDate | undefined>
  maxValue: Ref<TemporalDate | undefined>
  disabled: Ref<boolean>
  weekdayFormat: Ref<WeekDayFormat>
  pagedNavigation: Ref<boolean>
  isDateDisabled?: Matcher
  isDateUnavailable?: Matcher
  calendarLabel: Ref<string | undefined>
  nextPage: Ref<((placeholder: TemporalDate) => TemporalDate) | undefined>
  prevPage: Ref<((placeholder: TemporalDate) => TemporalDate) | undefined>
}

export type UseCalendarStateProps = {
  isDateDisabled: Matcher
  isDateUnavailable: Matcher
  date: Ref<TemporalDate | TemporalDate[] | undefined>
}

function toDate(dateValue: TemporalDate, timeZone: string = Temporal.Now.timeZoneId()) {
  if (isZonedDateTime(dateValue)) {
    return new Date(dateValue.toInstant().epochMilliseconds)
  }

  if (dateValue instanceof Temporal.PlainDateTime) {
    const zoned = dateValue.toZonedDateTime(timeZone)
    return new Date(zoned.toInstant().epochMilliseconds)
  }

  const zoned = dateValue.toZonedDateTime({
    timeZone,
    plainTime: Temporal.PlainTime.from({ hour: 0, minute: 0, second: 0 }),
  })
  return new Date(zoned.toInstant().epochMilliseconds)
}

export function useCalendarState(props: UseCalendarStateProps) {
  function isDateSelected(dateObj: TemporalDate) {
    if (Array.isArray(props.date.value))
      return props.date.value.some(d => isSameDay(d, dateObj))

    else if (!props.date.value)
      return false

    else
      return isSameDay(props.date.value, dateObj)
  }

  const isInvalid = computed(
    () => {
      if (Array.isArray(props.date.value)) {
        if (!props.date.value.length)
          return false
        for (const dateObj of props.date.value) {
          if (props.isDateDisabled?.(dateObj))
            return true
          if (props.isDateUnavailable?.(dateObj))
            return true
        }
      }
      else {
        if (!props.date.value)
          return false
        if (props.isDateDisabled?.(props.date.value))
          return true
        if (props.isDateUnavailable?.(props.date.value))
          return true
      }
      return false
    },
  )

  const hasSelectedDate = computed(() => {
    return Array.isArray(props.date.value) ? props.date.value.length > 0 : !!props.date.value
  })

  const isSelectedDateDisabled = computed(() => {
    if (Array.isArray(props.date.value)) {
      if (!props.date.value.length)
        return false
      return props.date.value.some(dateObj => props.isDateDisabled?.(dateObj))
    }
    if (!props.date.value)
      return false
    return !!props.isDateDisabled?.(props.date.value)
  })

  return {
    isDateSelected,
    isInvalid,
    hasSelectedDate,
    isSelectedDateDisabled,
  }
}

function handleNextDisabled(lastPeriodInView: TemporalDate, nextPageFunc: (date: TemporalDate) => TemporalDate): TemporalDate {
  const firstPeriodOfNextPage = nextPageFunc(lastPeriodInView)
  const diff = Temporal.PlainDate.compare(toPlainDate(firstPeriodOfNextPage), toPlainDate(lastPeriodInView))
  const duration: { day?: number, month?: number } = {}
  if (diff >= 7)
    duration.day = 1
  if (diff >= getDaysInMonth(lastPeriodInView))
    duration.month = 1
  return Object.keys(duration).length
    ? firstPeriodOfNextPage.with({ ...duration })
    : firstPeriodOfNextPage
}
function handlePrevDisabled(firstPeriodInView: TemporalDate, prevPageFunc: (date: TemporalDate) => TemporalDate): TemporalDate {
  const lastPeriodOfPrevPage = prevPageFunc(firstPeriodInView)
  const diff = Temporal.PlainDate.compare(toPlainDate(firstPeriodInView), toPlainDate(lastPeriodOfPrevPage))
  const duration: { day?: number, month?: number } = {}
  if (diff >= 7)
    duration.day = 35
  if (diff >= getDaysInMonth(firstPeriodInView))
    duration.month = 13
  return Object.keys(duration).length
    ? lastPeriodOfPrevPage.with({ ...duration })
    : lastPeriodOfPrevPage
}
function handleNextPage(date: TemporalDate, nextPageFunc: (date: TemporalDate) => TemporalDate): TemporalDate {
  return nextPageFunc(date)
}

function handlePrevPage(date: TemporalDate, prevPageFunc: (date: TemporalDate) => TemporalDate): TemporalDate {
  return prevPageFunc(date)
}

export function useCalendar(props: UseCalendarProps) {
  const formatter = useDateFormatter(props.locale.value)

  const headingFormatOptions = computed(() => {
    const calendarId = props.placeholder.value.calendarId
    const options: DateFormatterOptions = {
      calendar: calendarId === 'iso8601' ? 'gregory' : calendarId,
    }

    if (calendarId === 'gregory' && props.placeholder.value.era === 'BC')
      options.era = 'short'

    return options
  })

  const grid = ref<Grid<TemporalDate>[]>(createMonths({
    dateObj: props.placeholder.value,
    weekStartsOn: props.weekStartsOn.value,
    locale: props.locale.value,
    fixedWeeks: props.fixedWeeks.value,
    numberOfMonths: props.numberOfMonths.value,
  })) as Ref<Grid<TemporalDate>[]>

  const visibleView = computed(() => {
    return grid.value.map(month => month.value)
  })

  function isOutsideVisibleView(date: TemporalDate) {
    return !visibleView.value.some(month => isEqualMonth(date, month))
  }

  const isNextButtonDisabled = (nextPageFunc?: (date: TemporalDate) => TemporalDate) => {
    if (!props.maxValue.value || !grid.value.length)
      return false
    if (props.disabled.value)
      return true

    const lastPeriodInView = grid.value.at(-1)!.value

    if (!nextPageFunc && !props.nextPage.value) {
      const firstPeriodOfNextPage = lastPeriodInView.add({ months: 1 }).with({ day: 1 })
      return isAfter(firstPeriodOfNextPage, props.maxValue.value)
    }

    const firstPeriodOfNextPage = handleNextDisabled(lastPeriodInView, nextPageFunc || props.nextPage.value!)
    return isAfter(firstPeriodOfNextPage, props.maxValue.value)
  }

  const isPrevButtonDisabled = (prevPageFunc?: (date: TemporalDate) => TemporalDate) => {
    if (!props.minValue.value || !grid.value.length)
      return false
    if (props.disabled.value)
      return true
    const firstPeriodInView = grid.value[0].value

    if (!prevPageFunc && !props.prevPage.value) {
      const lastPeriodOfPrevPage = firstPeriodInView.subtract({ months: 1 }).with({ day: 35 })
      return isBefore(lastPeriodOfPrevPage, props.minValue.value)
    }

    const lastPeriodOfPrevPage = handlePrevDisabled(firstPeriodInView, prevPageFunc || props.prevPage.value!)
    return isBefore(lastPeriodOfPrevPage, props.minValue.value)
  }

  function isDateDisabled(dateObj: TemporalDate) {
    if (props.isDateDisabled?.(dateObj) || props.disabled.value)
      return true
    if (props.maxValue.value && isAfter(dateObj, props.maxValue.value))
      return true
    if (props.minValue.value && isBefore(dateObj, props.minValue.value))
      return true
    return false
  }

  const isDateUnavailable = (date: TemporalDate) => {
    if (props.isDateUnavailable?.(date))
      return true
    return false
  }

  const weekdays = computed(() => {
    if (!grid.value.length)
      return []
    return grid.value[0].rows[0].map((date) => {
      return formatter.dayOfWeek(toDate(date), props.weekdayFormat.value)
    })
  })

  const nextPage = (nextPageFunc?: (date: TemporalDate) => TemporalDate) => {
    const firstDate = grid.value[0].value

    if (!nextPageFunc && !props.nextPage.value) {
      const newDate = firstDate.add({ months: props.pagedNavigation.value ? props.numberOfMonths.value : 1 })

      const newGrid = createMonths({
        dateObj: newDate,
        weekStartsOn: props.weekStartsOn.value,
        locale: props.locale.value,
        fixedWeeks: props.fixedWeeks.value,
        numberOfMonths: props.numberOfMonths.value,
      })

      grid.value = newGrid

      props.placeholder.value = newGrid[0].value.with({ day: 1 })
      return
    }

    const newDate = handleNextPage(firstDate, nextPageFunc || props.nextPage.value!)
    const newGrid = createMonths({
      dateObj: newDate,
      weekStartsOn: props.weekStartsOn.value,
      locale: props.locale.value,
      fixedWeeks: props.fixedWeeks.value,
      numberOfMonths: props.numberOfMonths.value,
    })

    grid.value = newGrid

    const duration: { day?: number, month?: number } = {}

    // Do not adjust the placeholder if the nextPageFunc is defined (overwrite)
    if (!nextPageFunc) {
      const diff = Temporal.PlainDate.compare(toPlainDate(newGrid[0].value), toPlainDate(firstDate))
      if (diff >= getDaysInMonth(firstDate))
        duration.day = 1

      if (diff >= 365)
        duration.month = 1
    }

    props.placeholder.value = Object.keys(duration).length
      ? newGrid[0].value.with({ ...duration })
      : newGrid[0].value
  }

  const prevPage = (prevPageFunc?: (date: TemporalDate) => TemporalDate) => {
    const firstDate = grid.value[0].value

    if (!prevPageFunc && !props.prevPage.value) {
      const newDate = firstDate.subtract({ months: props.pagedNavigation.value ? props.numberOfMonths.value : 1 })

      const newGrid = createMonths({
        dateObj: newDate,
        weekStartsOn: props.weekStartsOn.value,
        locale: props.locale.value,
        fixedWeeks: props.fixedWeeks.value,
        numberOfMonths: props.numberOfMonths.value,
      })

      grid.value = newGrid

      props.placeholder.value = newGrid[0].value.with({ day: 1 })
      return
    }

    const newDate = handlePrevPage(firstDate, prevPageFunc || props.prevPage.value!)
    const newGrid = createMonths({
      dateObj: newDate,
      weekStartsOn: props.weekStartsOn.value,
      locale: props.locale.value,
      fixedWeeks: props.fixedWeeks.value,
      numberOfMonths: props.numberOfMonths.value,
    })

    grid.value = newGrid

    const duration: { day?: number, month?: number } = {}

    // Do not adjust the placeholder if the prevPageFunc is defined (overwrite)
    if (!prevPageFunc) {
      const diff = Temporal.PlainDate.compare(toPlainDate(firstDate), toPlainDate(newGrid[0].value))
      if (diff >= getDaysInMonth(firstDate))
        duration.day = 1

      if (diff >= 365)
        duration.month = 1
    }

    props.placeholder.value = Object.keys(duration).length
      ? newGrid[0].value.with({ ...duration })
      : newGrid[0].value
  }

  watch(props.placeholder, (value) => {
    if (visibleView.value.some(month => isEqualMonth(month, value)))
      return
    grid.value = createMonths({
      dateObj: value,
      weekStartsOn: props.weekStartsOn.value,
      locale: props.locale.value,
      fixedWeeks: props.fixedWeeks.value,
      numberOfMonths: props.numberOfMonths.value,
    })
  })

  watch([props.locale, props.weekStartsOn, props.fixedWeeks, props.numberOfMonths], () => {
    grid.value = createMonths({
      dateObj: props.placeholder.value,
      weekStartsOn: props.weekStartsOn.value,
      locale: props.locale.value,
      fixedWeeks: props.fixedWeeks.value,
      numberOfMonths: props.numberOfMonths.value,
    })
  })

  const headingValue = computed(() => {
    if (!grid.value.length)
      return ''

    if (props.locale.value !== formatter.getLocale())
      formatter.setLocale(props.locale.value)

    if (grid.value.length === 1) {
      const month = grid.value[0].value
      return `${formatter.fullMonthAndYear(toDate(month), headingFormatOptions.value)}`
    }

    const startMonth = toDate(grid.value[0].value)
    const endMonth = toDate(grid.value.at(-1)!.value)

    const startMonthName = formatter.fullMonth(startMonth, headingFormatOptions.value)
    const endMonthName = formatter.fullMonth(endMonth, headingFormatOptions.value)
    const startMonthYear = formatter.fullYear(startMonth, headingFormatOptions.value)
    const endMonthYear = formatter.fullYear(endMonth, headingFormatOptions.value)

    const content
      = startMonthYear === endMonthYear
        ? `${startMonthName} - ${endMonthName} ${endMonthYear}`
        : `${startMonthName} ${startMonthYear} - ${endMonthName} ${endMonthYear}`

    return content
  })

  const fullCalendarLabel = computed(() => `${props.calendarLabel.value ?? 'Event Date'}, ${headingValue.value}`)

  const isPlaceholderFocusable = computed(() => {
    return !(isDateDisabled(props.placeholder.value) || isDateUnavailable(props.placeholder.value) || isOutsideVisibleView(props.placeholder.value))
  })

  const firstFocusableDate = computed(() => {
    for (const month of grid.value) {
      if (props.minValue.value && isBefore(month.value, props.minValue.value))
        continue

      const daysInMonth = getDaysInMonth(month.value)
      const startDay = props.minValue.value && isEqualMonth(props.minValue.value, month.value) ? props.minValue.value.day : 1

      for (let day = startDay; day <= daysInMonth; day++) {
        const date = month.value.with({ day })
        if (isDateDisabled(date) || isDateUnavailable(date))
          continue
        return date
      }
    }
  })

  return {
    isDateDisabled,
    isDateUnavailable,
    isNextButtonDisabled,
    isPrevButtonDisabled,
    grid,
    weekdays,
    visibleView,
    isOutsideVisibleView,
    formatter,
    nextPage,
    prevPage,
    headingValue,
    fullCalendarLabel,
    isPlaceholderFocusable,
    firstFocusableDate,
  }
}
