import type { Ref } from 'vue'
import type { Grid, Matcher } from '@/date'
import type { DateFormatterOptions } from '@/shared/useDateFormatter'
import type { TemporalDate } from '@/temporal/types'
import { Temporal } from 'temporal-polyfill'
import { computed, ref, watch } from 'vue'
import { createMonthGrid, endOfMonth, isAfter, isBefore, isSameYearMonth, toDate } from '@/date'
import { useDateFormatter } from '@/shared'

export type UseMonthPickerProps = {
  locale: Ref<string>
  placeholder: Ref<TemporalDate>
  minValue: Ref<TemporalDate | undefined>
  maxValue: Ref<TemporalDate | undefined>
  disabled: Ref<boolean>
  isMonthDisabled?: Matcher | Ref<Matcher | undefined>
  isMonthUnavailable?: Matcher | Ref<Matcher | undefined>
  calendarLabel: Ref<string | undefined>
  nextPage: Ref<((placeholder: TemporalDate) => TemporalDate) | undefined>
  prevPage: Ref<((placeholder: TemporalDate) => TemporalDate) | undefined>
}

export type UseMonthPickerStateProps = {
  isMonthDisabled: Matcher
  isMonthUnavailable: Matcher
  date: Ref<TemporalDate | TemporalDate[] | undefined>
}

export function useMonthPickerState(props: UseMonthPickerStateProps) {
  function isMonthSelected(dateObj: TemporalDate) {
    if (Array.isArray(props.date.value))
      return props.date.value.some(d => isSameYearMonth(d, dateObj))
    else if (!props.date.value)
      return false
    else
      return isSameYearMonth(props.date.value, dateObj)
  }

  const isInvalid = computed(() => {
    if (Array.isArray(props.date.value)) {
      if (!props.date.value.length)
        return false
      for (const dateObj of props.date.value) {
        if (props.isMonthDisabled?.(dateObj))
          return true
        if (props.isMonthUnavailable?.(dateObj))
          return true
      }
    }
    else {
      if (!props.date.value)
        return false
      if (props.isMonthDisabled?.(props.date.value))
        return true
      if (props.isMonthUnavailable?.(props.date.value))
        return true
    }
    return false
  })

  return { isMonthSelected, isInvalid }
}

export function useMonthPicker(props: UseMonthPickerProps) {
  const formatter = useDateFormatter(props.locale.value)

  const resolveMatcher = (matcher?: Matcher | Ref<Matcher | undefined>) =>
    typeof matcher === 'function' ? matcher : matcher?.value

  const headingFormatOptions = computed(() => {
    const calendarId = props.placeholder.value.calendarId

    const options: DateFormatterOptions = {
      calendar: calendarId,
    }

    if (calendarId === 'gregory' && props.placeholder.value.era?.toUpperCase() === 'BC')
      options.era = 'short'

    return options
  })

  const grid = ref<Grid<TemporalDate>>(createMonthGrid({ dateObj: props.placeholder.value })) as Ref<Grid<TemporalDate>>

  function isMonthDisabled(dateObj: TemporalDate) {
    if (resolveMatcher(props.isMonthDisabled)?.(dateObj) || props.disabled.value)
      return true
    const monthStart = 'with' in dateObj
      ? dateObj.with({ day: 1 })
      : Temporal.PlainDate.from({ year: dateObj.year, month: dateObj.month, day: 1 })

    if (props.maxValue.value && isAfter(monthStart, props.maxValue.value))
      return true
    if (props.minValue.value && isBefore(endOfMonth(dateObj), props.minValue.value))
      return true
    return false
  }

  const isMonthUnavailable = (date: TemporalDate) => {
    if (resolveMatcher(props.isMonthUnavailable)?.(date))
      return true
    return false
  }

  const isNextButtonDisabled = (nextPageFunc?: (date: TemporalDate) => TemporalDate) => {
    if (!props.maxValue.value)
      return false
    if (props.disabled.value)
      return true

    const currentDate = grid.value.value
    if (nextPageFunc || props.nextPage.value) {
      const nextDate = (nextPageFunc || props.nextPage.value)!(currentDate)
      return isAfter(nextDate.with({ month: 1, day: 1 }), props.maxValue.value)
    }

    const nextYear = currentDate.add({ years: 1 }).with({ month: 1, day: 1 })
    return isAfter(nextYear, props.maxValue.value)
  }

  const isPrevButtonDisabled = (prevPageFunc?: (date: TemporalDate) => TemporalDate) => {
    if (!props.minValue.value)
      return false
    if (props.disabled.value)
      return true

    const currentDate = grid.value.value
    if (prevPageFunc || props.prevPage.value) {
      const prevDate = (prevPageFunc || props.prevPage.value)!(currentDate)
      return isBefore(endOfMonth(prevDate.with({ month: 12 })), props.minValue.value)
    }

    const prevYear = currentDate.subtract({ years: 1 }).with({ month: 12, day: 31 })
    return isBefore(prevYear, props.minValue.value)
  }

  const nextPage = (nextPageFunc?: (date: TemporalDate) => TemporalDate) => {
    const currentDate = grid.value.value

    if (nextPageFunc || props.nextPage.value) {
      const newDate = (nextPageFunc || props.nextPage.value)!(currentDate)
      grid.value = createMonthGrid({ dateObj: newDate })
      props.placeholder.value = newDate.with({ day: 1 })
      return
    }

    const newDate = currentDate.add({ years: 1 })
    grid.value = createMonthGrid({ dateObj: newDate })
    props.placeholder.value = newDate.with({ day: 1 })
  }

  const prevPage = (prevPageFunc?: (date: TemporalDate) => TemporalDate) => {
    const currentDate = grid.value.value

    if (prevPageFunc || props.prevPage.value) {
      const newDate = (prevPageFunc || props.prevPage.value)!(currentDate)
      grid.value = createMonthGrid({ dateObj: newDate })
      props.placeholder.value = newDate.with({ day: 1 })
      return
    }

    const newDate = currentDate.subtract({ years: 1 })
    grid.value = createMonthGrid({ dateObj: newDate })
    props.placeholder.value = newDate.with({ day: 1 })
  }

  watch(props.placeholder, (value) => {
    if (value.year === grid.value.value.year)
      return
    grid.value = createMonthGrid({ dateObj: value })
  })

  watch(props.locale, () => {
    formatter.setLocale(props.locale.value)
    grid.value = createMonthGrid({ dateObj: props.placeholder.value })
  })

  const headingValue = computed(() => {
    if (props.locale.value !== formatter.getLocale())
      formatter.setLocale(props.locale.value)

    return formatter.fullYear(toDate(grid.value.value), headingFormatOptions.value)
  })

  const fullCalendarLabel = computed(() => `${props.calendarLabel.value ?? 'Month Picker'}, ${headingValue.value}`)

  return {
    isMonthDisabled,
    isMonthUnavailable,
    isNextButtonDisabled,
    isPrevButtonDisabled,
    grid,
    formatter,
    nextPage,
    prevPage,
    headingValue,
    fullCalendarLabel,
  }
}
