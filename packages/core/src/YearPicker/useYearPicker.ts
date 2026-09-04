import type { Ref } from 'vue'
import type { Grid, Matcher } from '@/date'
import type { DateFormatterOptions } from '@/shared/useDateFormatter'
import type { TemporalDate } from '@/temporal/types'
import { computed, ref, watch } from 'vue'
import { createYearGrid, isAfter, isBefore, isSameYear, startOfYear, toDate } from '@/date'
import { useDateFormatter } from '@/shared'
import { endOfYear } from '@/temporal/comparators'

export type UseYearPickerProps = {
  locale: Ref<string>
  placeholder: Ref<TemporalDate>
  minValue: Ref<TemporalDate | undefined>
  maxValue: Ref<TemporalDate | undefined>
  disabled: Ref<boolean>
  yearsPerPage: Ref<number>
  isYearDisabled?: Matcher | Ref<Matcher | undefined>
  isYearUnavailable?: Matcher | Ref<Matcher | undefined>
  calendarLabel: Ref<string | undefined>
  nextPage: Ref<((placeholder: TemporalDate) => TemporalDate) | undefined>
  prevPage: Ref<((placeholder: TemporalDate) => TemporalDate) | undefined>
}

export type UseYearPickerStateProps = {
  isYearDisabled: Matcher
  isYearUnavailable: Matcher
  date: Ref<TemporalDate | TemporalDate[] | undefined>
}

export function useYearPickerState(props: UseYearPickerStateProps) {
  function isYearSelected(dateObj: TemporalDate) {
    if (Array.isArray(props.date.value))
      return props.date.value.some(d => isSameYear(d, dateObj))
    else if (!props.date.value)
      return false
    else
      return isSameYear(props.date.value, dateObj)
  }

  const isInvalid = computed(() => {
    if (Array.isArray(props.date.value)) {
      if (!props.date.value.length)
        return false
      for (const dateObj of props.date.value) {
        if (props.isYearDisabled?.(dateObj))
          return true
        if (props.isYearUnavailable?.(dateObj))
          return true
      }
    }
    else {
      if (!props.date.value)
        return false
      if (props.isYearDisabled?.(props.date.value))
        return true
      if (props.isYearUnavailable?.(props.date.value))
        return true
    }
    return false
  })

  return { isYearSelected, isInvalid }
}

export function useYearPicker(props: UseYearPickerProps) {
  const formatter = useDateFormatter(props.locale.value)

  const resolveMatcher = (matcher?: Matcher | Ref<Matcher | undefined>) =>
    typeof matcher === 'function' ? matcher : matcher?.value

  const headingFormatOptions = computed(() => {
    const calendarId = props.placeholder.value.calendarId
    const resolvedCalendar = calendarId === 'iso8601' ? 'gregory' : calendarId

    const options: DateFormatterOptions = {
      calendar: resolvedCalendar,
    }

    if (resolvedCalendar === 'gregory') {
      const parts = new Intl.DateTimeFormat(props.locale.value, {
        calendar: resolvedCalendar,
        era: 'short',
      }).formatToParts(toDate(props.placeholder.value))
      const eraPart = parts.find(p => p.type === 'era')
      if (eraPart && (eraPart.value.toLowerCase() === 'bc' || eraPart.value.toLowerCase() === 'bce')) {
        options.era = 'short'
      }
    }

    return options
  })

  const grid = ref<Grid<TemporalDate>>(createYearGrid({
    dateObj: props.placeholder.value,
    yearsPerPage: props.yearsPerPage.value,
  })) as Ref<Grid<TemporalDate>>

  function isYearDisabled(dateObj: TemporalDate) {
    if (resolveMatcher(props.isYearDisabled)?.(dateObj) || props.disabled.value)
      return true
    if (props.maxValue.value && isAfter(startOfYear(dateObj), props.maxValue.value))
      return true
    if (props.minValue.value && isBefore(endOfYear(dateObj), props.minValue.value))
      return true
    return false
  }

  const isYearUnavailable = (date: TemporalDate) => {
    if (resolveMatcher(props.isYearUnavailable)?.(date))
      return true
    return false
  }

  const isNextButtonDisabled = (nextPageFunc?: (date: TemporalDate) => TemporalDate) => {
    if (!props.maxValue.value)
      return false
    if (props.disabled.value)
      return true

    const lastYearInView = grid.value.cells.at(-1)!
    if (nextPageFunc || props.nextPage.value) {
      const nextDate = (nextPageFunc || props.nextPage.value)!(lastYearInView)
      return isAfter(startOfYear(nextDate), props.maxValue.value)
    }

    const nextPageStart = startOfYear(lastYearInView.add({ years: 1 }))
    return isAfter(nextPageStart, props.maxValue.value)
  }

  const isPrevButtonDisabled = (prevPageFunc?: (date: TemporalDate) => TemporalDate) => {
    if (!props.minValue.value)
      return false
    if (props.disabled.value)
      return true

    const firstYearInView = grid.value.value
    if (prevPageFunc || props.prevPage.value) {
      const prevDate = (prevPageFunc || props.prevPage.value)!(firstYearInView)
      return isBefore(endOfYear(prevDate), props.minValue.value)
    }

    const prevPageEnd = endOfYear(firstYearInView.subtract({ years: 1 }))
    return isBefore(prevPageEnd, props.minValue.value)
  }

  const nextPage = (nextPageFunc?: (date: TemporalDate) => TemporalDate) => {
    const firstYearInGrid = grid.value.value

    if (nextPageFunc || props.nextPage.value) {
      const newDate = (nextPageFunc || props.nextPage.value)!(firstYearInGrid)
      grid.value = createYearGrid({ dateObj: newDate, yearsPerPage: props.yearsPerPage.value, decadeAligned: false })
      props.placeholder.value = newDate.with({ month: 1, day: 1 })
      return
    }

    const newDate = firstYearInGrid.add({ years: props.yearsPerPage.value })
    grid.value = createYearGrid({ dateObj: newDate, yearsPerPage: props.yearsPerPage.value, decadeAligned: false })
    props.placeholder.value = newDate.with({ month: 1, day: 1 })
  }

  const prevPage = (prevPageFunc?: (date: TemporalDate) => TemporalDate) => {
    const firstYearInGrid = grid.value.value

    if (prevPageFunc || props.prevPage.value) {
      const newDate = (prevPageFunc || props.prevPage.value)!(firstYearInGrid)
      grid.value = createYearGrid({ dateObj: newDate, yearsPerPage: props.yearsPerPage.value, decadeAligned: false })
      props.placeholder.value = newDate.with({ month: 1, day: 1 })
      return
    }

    const newDate = firstYearInGrid.subtract({ years: props.yearsPerPage.value })
    grid.value = createYearGrid({ dateObj: newDate, yearsPerPage: props.yearsPerPage.value, decadeAligned: false })
    props.placeholder.value = newDate.with({ month: 1, day: 1 })
  }

  watch(props.placeholder, (value) => {
    const firstYearInGrid = grid.value.value
    const lastYearInGrid = grid.value.cells.at(-1)!
    if (value.year >= firstYearInGrid.year && value.year <= lastYearInGrid.year)
      return
    grid.value = createYearGrid({ dateObj: value, yearsPerPage: props.yearsPerPage.value })
  })

  watch([props.locale, props.yearsPerPage], () => {
    formatter.setLocale(props.locale.value)
    grid.value = createYearGrid({ dateObj: props.placeholder.value, yearsPerPage: props.yearsPerPage.value })
  })

  const headingValue = computed(() => {
    if (props.locale.value !== formatter.getLocale())
      formatter.setLocale(props.locale.value)

    const firstYear = grid.value.cells[0]
    const lastYear = grid.value.cells.at(-1)!

    return `${formatter.fullYear(toDate(firstYear), headingFormatOptions.value)} - ${formatter.fullYear(toDate(lastYear), headingFormatOptions.value)}`
  })

  const fullCalendarLabel = computed(() => `${props.calendarLabel.value ?? 'Year Picker'}, ${headingValue.value}`)

  return {
    isYearDisabled,
    isYearUnavailable,
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
