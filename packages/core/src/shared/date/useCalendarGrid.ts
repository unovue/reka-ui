import type { DateValue } from '@internationalized/date'
import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { CalendarGridData, CalendarLayout, CalendarPageFunction, CalendarUnit, CalendarUnitAdapter, Matcher, WeekDayFormat, WeekStartsOn } from '@/date'
import type { DateFormatterOptions, Formatter } from '@/shared/useDateFormatter'
import { computed, ref, toValue, watch } from 'vue'
import { getUnitAdapter, isAfter, isBefore, toDate } from '@/date'
import { useDateFormatter } from '@/shared/useDateFormatter'

export interface UseCalendarGridProps {
  /** The unit the grid renders: the calendar's active `view`. */
  unit: MaybeRefOrGetter<CalendarUnit>
  /** The date that decides which page is shown. Read-only here; paging goes through `setPlaceholder`. */
  placeholder: Ref<DateValue>
  /** Called when Prev / Next (or a custom paging function) lands on a new page. */
  setPlaceholder: (date: DateValue) => void
  locale: MaybeRefOrGetter<string>
  weekStartsOn: MaybeRefOrGetter<WeekStartsOn>
  /** @default 'narrow' */
  weekdayFormat?: MaybeRefOrGetter<WeekDayFormat | undefined>
  /** @default false */
  fixedWeeks?: MaybeRefOrGetter<boolean | undefined>
  /** @default 1 */
  numberOfMonths?: MaybeRefOrGetter<number | undefined>
  /** @default false */
  pagedNavigation?: MaybeRefOrGetter<boolean | undefined>
  /** @default 12 */
  yearsPerPage?: MaybeRefOrGetter<number | undefined>
  /** Cells per row in the month and year views. @default 4 */
  columns?: MaybeRefOrGetter<number | undefined>
  minValue?: MaybeRefOrGetter<DateValue | undefined>
  maxValue?: MaybeRefOrGetter<DateValue | undefined>
  /** @default false */
  disabled?: MaybeRefOrGetter<boolean | undefined>
  isDateDisabled?: MaybeRefOrGetter<Matcher | undefined>
  isDateUnavailable?: MaybeRefOrGetter<Matcher | undefined>
  calendarLabel?: MaybeRefOrGetter<string | undefined>
  /** Root-level custom paging (the `nextPage` prop). */
  nextPage?: MaybeRefOrGetter<CalendarPageFunction | undefined>
  /** Root-level custom paging (the `prevPage` prop). */
  prevPage?: MaybeRefOrGetter<CalendarPageFunction | undefined>
}

export interface UseCalendarGridReturn {
  unit: ComputedRef<CalendarUnit>
  adapter: ComputedRef<CalendarUnitAdapter>
  layout: ComputedRef<CalendarLayout>
  formatter: Formatter
  /** The rendered page(s). Always an array, whatever the unit. */
  grid: Ref<CalendarGridData[]>
  /** The page values (`grid[i].value`). */
  visibleView: ComputedRef<DateValue[]>
  /** Weekday labels for the day view; `[]` otherwise. */
  weekdays: ComputedRef<string[]>
  headingValue: ComputedRef<string>
  fullCalendarLabel: ComputedRef<string>
  /** Up/down keyboard stride: 7 in the day view, `columns` otherwise. */
  rowLength: ComputedRef<number>
  isOutsideVisibleView: (date: DateValue) => boolean
  /** `true` for cells the user cannot select: disabled matcher, `disabled`, outside `minValue` / `maxValue`. */
  isDateDisabled: Matcher
  isDateUnavailable: Matcher
  nextPage: (fn?: CalendarPageFunction) => void
  prevPage: (fn?: CalendarPageFunction) => void
  isNextButtonDisabled: (fn?: CalendarPageFunction) => boolean
  isPrevButtonDisabled: (fn?: CalendarPageFunction) => boolean
  /** Whether the placeholder's cell can take focus (rendered, enabled, available). */
  isPlaceholderFocusable: ComputedRef<boolean>
  /** The first rendered cell that can take focus when the placeholder cannot. */
  firstFocusableDate: ComputedRef<DateValue | undefined>
}

/**
 * The grid, paging, bounds and heading logic shared by every calendar view.
 * One implementation parameterised by a `CalendarUnitAdapter` replaces the
 * v2 `useCalendar` (day), `useMonthPicker` and `useYearPicker` composables.
 *
 * Selection is deliberately not here: `useCalendar()` / `useRangeCalendar()`
 * own the model and compose this per active view.
 *
 * @experimental
 * @lifecycle setup — installs watchers on the placeholder, locale and layout.
 */
export function useCalendarGrid(props: UseCalendarGridProps): UseCalendarGridReturn {
  const unit = computed(() => toValue(props.unit))
  const adapter = computed(() => getUnitAdapter(unit.value))
  const locale = computed(() => toValue(props.locale))
  const minValue = computed(() => toValue(props.minValue))
  const maxValue = computed(() => toValue(props.maxValue))
  const disabled = computed(() => toValue(props.disabled) ?? false)

  const layout = computed<CalendarLayout>(() => ({
    locale: locale.value,
    weekStartsOn: toValue(props.weekStartsOn),
    fixedWeeks: toValue(props.fixedWeeks) ?? false,
    numberOfMonths: toValue(props.numberOfMonths) ?? 1,
    pagedNavigation: toValue(props.pagedNavigation) ?? false,
    yearsPerPage: toValue(props.yearsPerPage) ?? 12,
    columns: toValue(props.columns) ?? 4,
  }))

  const formatter = useDateFormatter(locale.value)

  const headingFormatOptions = computed(() => {
    const options: DateFormatterOptions = {
      calendar: props.placeholder.value.calendar.identifier,
    }
    if (props.placeholder.value.calendar.identifier === 'gregory' && props.placeholder.value.era === 'BC')
      options.era = 'short'
    return options
  })

  const grid = ref(adapter.value.createGrid(props.placeholder.value, layout.value)) as Ref<CalendarGridData[]>

  function rebuild(aligned = true) {
    grid.value = adapter.value.createGrid(props.placeholder.value, layout.value, { aligned })
  }

  const visibleView = computed(() => grid.value.map(page => page.value))

  function isOutsideVisibleView(date: DateValue) {
    return !adapter.value.isInVisibleView(date, grid.value)
  }

  const isDateDisabled: Matcher = (date) => {
    if (toValue(props.isDateDisabled)?.(date, unit.value) || disabled.value)
      return true
    if (maxValue.value && isAfter(adapter.value.startOf(date), maxValue.value))
      return true
    if (minValue.value && isBefore(adapter.value.endOf(date), minValue.value))
      return true
    return false
  }

  const isDateUnavailable: Matcher = date => !!toValue(props.isDateUnavailable)?.(date, unit.value)

  function resolvePageFn(explicit: CalendarPageFunction | undefined, prop: MaybeRefOrGetter<CalendarPageFunction | undefined> | undefined) {
    const fn = explicit ?? toValue(prop)
    const mode = explicit ? 'explicit-fn' : fn ? 'root-fn' : 'default'
    return { fn, mode } as const
  }

  function isNextButtonDisabled(explicit?: CalendarPageFunction) {
    if (!maxValue.value || !grid.value.length)
      return false
    if (disabled.value)
      return true
    const { fn } = resolvePageFn(explicit, props.nextPage)
    return isAfter(adapter.value.nextPageStart(grid.value, layout.value, fn), maxValue.value)
  }

  function isPrevButtonDisabled(explicit?: CalendarPageFunction) {
    if (!minValue.value || !grid.value.length)
      return false
    if (disabled.value)
      return true
    const { fn } = resolvePageFn(explicit, props.prevPage)
    return isBefore(adapter.value.prevPageEnd(grid.value, layout.value, fn), minValue.value)
  }

  function page(direction: 1 | -1, explicit?: CalendarPageFunction) {
    const { fn, mode } = resolvePageFn(explicit, direction > 0 ? props.nextPage : props.prevPage)
    const previousFirst = grid.value[0].value
    const target = adapter.value.pageTarget(grid.value, layout.value, direction, fn)
    const newGrid = adapter.value.createGrid(target, layout.value, { aligned: false })
    grid.value = newGrid
    props.setPlaceholder(adapter.value.placeholderAfterPaging(newGrid, previousFirst, props.placeholder.value, mode))
  }

  const nextPage = (fn?: CalendarPageFunction) => page(1, fn)
  const prevPage = (fn?: CalendarPageFunction) => page(-1, fn)

  // The placeholder moved (keyboard, selection, external `v-model:placeholder`)
  // outside the rendered page(s): follow it.
  watch(props.placeholder, (value) => {
    if (adapter.value.isInVisibleView(value, grid.value))
      return
    rebuild()
  })

  watch(locale, value => formatter.setLocale(value))
  watch([layout, unit], () => rebuild())

  const headingValue = computed(() => {
    if (locale.value !== formatter.getLocale())
      formatter.setLocale(locale.value)
    return adapter.value.formatHeading(formatter, grid.value, headingFormatOptions.value)
  })

  const fullCalendarLabel = computed(() => `${toValue(props.calendarLabel) ?? adapter.value.defaultLabel}, ${headingValue.value}`)

  const weekdays = computed(() => {
    if (unit.value !== 'day' || !grid.value.length)
      return []
    return grid.value[0].rows[0].map(date => formatter.dayOfWeek(toDate(date), toValue(props.weekdayFormat) ?? 'narrow'))
  })

  const rowLength = computed(() => adapter.value.rowLength(layout.value))

  const isPlaceholderFocusable = computed(() => {
    const placeholder = props.placeholder.value
    return !(isDateDisabled(placeholder) || isDateUnavailable(placeholder) || isOutsideVisibleView(placeholder))
  })

  const firstFocusableDate = computed(() => {
    for (const pageData of grid.value) {
      for (const cell of pageData.cells) {
        if (!adapter.value.isInPage(cell, pageData.value))
          continue
        if (isDateDisabled(cell) || isDateUnavailable(cell))
          continue
        return cell
      }
    }
    return undefined
  })

  return {
    unit,
    adapter,
    layout,
    formatter,
    grid,
    visibleView,
    weekdays,
    headingValue,
    fullCalendarLabel,
    rowLength,
    isOutsideVisibleView,
    isDateDisabled,
    isDateUnavailable,
    nextPage,
    prevPage,
    isNextButtonDisabled,
    isPrevButtonDisabled,
    isPlaceholderFocusable,
    firstFocusableDate,
  }
}
