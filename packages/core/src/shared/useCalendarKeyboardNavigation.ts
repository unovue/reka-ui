import type { WeekStartsOn } from '@/date'
import type { DateValue } from '@/date/types'
import { nextTick } from 'vue'
import { getDaysInMonth, getLastFirstDayOfWeek, getNextLastDayOfWeek } from '@/date'
import { compareDateValues, compareDays, toCalendar, toIsoString, toPlainDate } from '@/date/temporal'

/**
 * Upper bound on focus-search steps when skipping over disabled/unavailable
 * days or waiting for an async grid re-render. Covers a generous run of
 * consecutive blocked days (more than three weeks) while guaranteeing the
 * recursion terminates if no focusable day can be found.
 */
export const MAX_FOCUS_RETRIES = 24

/**
 * Tabindex for a calendar or picker cell trigger. The focused cell is the only
 * tab stop; other cells get `-1` so keyboard navigation can still focus them.
 * Skipped cells (disabled or outside the view) drop the attribute only when
 * rendered as the default `div`. Any other tag, a component or `asChild` may
 * render something natively focusable, so those cells keep `-1`.
 */
export function getCalendarCellTabindex(
  isFocused: boolean | undefined,
  isSkipped: boolean | undefined,
  primitive: { as?: unknown, asChild?: boolean },
): 0 | -1 | undefined {
  if (isFocused)
    return 0
  if (isSkipped && primitive.as === 'div' && !primitive.asChild)
    return undefined
  return -1
}

interface FocusDateOptions {
  parentElement: HTMLElement
  target: DateValue
  directionSign: number
  minValue?: DateValue
  maxValue?: DateValue
  onPlaceholderChange: (date: DateValue) => void
  allowOutsideView?: boolean
}

interface FocusWeekBoundaryOptions extends Omit<FocusDateOptions, 'target' | 'directionSign'> {
  baseDate: DateValue
  boundary: 'start' | 'end'
  locale: string
  weekStartsOn: WeekStartsOn
}

interface FocusPaginationOptions extends Omit<FocusDateOptions, 'target' | 'directionSign'> {
  baseDate: DateValue
  isNext: boolean
  isYear: boolean
  isOutsideVisibleView: (date: DateValue) => boolean
  isNextButtonDisabled: (customPageFn?: (date: DateValue) => DateValue) => boolean
  isPrevButtonDisabled: (customPageFn?: (date: DateValue) => DateValue) => boolean
  nextPage: (customPageFn?: (date: DateValue) => DateValue) => void
  prevPage: (customPageFn?: (date: DateValue) => DateValue) => void
}

export function focusWeekBoundary(options: FocusWeekBoundaryOptions) {
  const { baseDate, boundary, locale, weekStartsOn } = options
  const target = boundary === 'start'
    ? getLastFirstDayOfWeek(baseDate, weekStartsOn, locale)
    : getNextLastDayOfWeek(baseDate, weekStartsOn, locale)
  // The sign points outward toward the boundary; clamp/fallback logic in
  // `focusDate` turns it inward when the boundary day itself is not focusable.
  const directionSign = boundary === 'start' ? -1 : 1
  focusDate({ ...options, target, directionSign, allowOutsideView: true })
}

export function focusPagination(options: FocusPaginationOptions) {
  const { baseDate, isNext, isYear, isOutsideVisibleView } = options
  const amount = isNext ? 1 : -1
  const target = clampTargetDate(
    getTargetMonthDay(baseDate, isYear ? 'year' : 'month', amount),
    options.minValue,
    options.maxValue,
  )

  const customPageFn = (date: DateValue) => {
    const pageDate = isYear ? date.add({ years: amount }) : date.add({ months: amount })
    return pageDate.with({ day: 1 })
  }

  if (isOutsideVisibleView(target)) {
    if (isNext && !options.isNextButtonDisabled(customPageFn))
      options.nextPage(customPageFn)
    else if (!isNext && !options.isPrevButtonDisabled(customPageFn))
      options.prevPage(customPageFn)
  }

  focusDate({ ...options, target, directionSign: amount })
}

export function getTargetMonthDay(date: DateValue, unit: 'month' | 'year', amount: number): DateValue {
  const targetBase = date.add(unit === 'month' ? { months: amount } : { years: amount })
  const daysInTargetMonth = getDaysInMonth(targetBase)
  const targetDay = Math.min(date.day, daysInTargetMonth)
  return targetBase.with({ day: targetDay })
}

/** Compares the calendar days of two dates, ignoring their time and type. */
const compareDay = compareDays

/**
 * Moves `date` to the day of `bound`. The result keeps the type, time and
 * calendar of `date`, because the grid cells it has to match are built from
 * the placeholder and not from `minValue` / `maxValue`.
 */
function setDay(date: DateValue, bound: DateValue): DateValue {
  const day = toCalendar(toPlainDate(bound), date.calendarId)
  return date.with({ year: day.year, month: day.month, day: day.day })
}

export function clampTargetDate(date: DateValue, minValue?: DateValue, maxValue?: DateValue): DateValue {
  let candidateDay = date

  if (minValue && compareDay(candidateDay, minValue) < 0)
    candidateDay = setDay(candidateDay, minValue)

  if (maxValue && compareDay(candidateDay, maxValue) > 0)
    candidateDay = setDay(candidateDay, maxValue)

  return candidateDay
}

function focusDate(options: FocusDateOptions) {
  const clampedTarget = clampTargetDate(options.target, options.minValue, options.maxValue)

  // Determine the direction to search when the target day is not focusable:
  // - clamped to minValue from negative movement -> +1 (inward from the lower bound)
  // - clamped to maxValue from positive movement -> -1 (inward from the upper bound)
  // - unclamped week boundary -> search back toward the base day so focus stays
  //   within the current week instead of spilling into the adjacent week
  // - unclamped pagination -> keep travelling in the navigation direction
  // - otherwise -> 0 (no search)
  let safeDirection = 0
  const isClampedToMin = options.minValue && compareDay(clampedTarget, options.minValue) === 0
  const isClampedToMax = options.maxValue && compareDay(clampedTarget, options.maxValue) === 0
  const wasClamped = isClampedToMin || isClampedToMax

  if (!wasClamped) {
    safeDirection = options.allowOutsideView ? -options.directionSign : options.directionSign
  }
  else if (isClampedToMin && options.directionSign < 0) {
    safeDirection = 1
  }
  else if (isClampedToMax && options.directionSign > 0) {
    safeDirection = -1
  }

  options.onPlaceholderChange(clampedTarget)
  nextTick(() => tryFocusDate(options.parentElement, clampedTarget, safeDirection, 0, options))
}

function tryFocusDate(
  parentElement: HTMLElement,
  target: DateValue,
  directionSign: number,
  retries: number,
  options: FocusDateOptions,
) {
  if (retries >= MAX_FOCUS_RETRIES)
    return

  // With multiple months, a date can render both in its own grid and as an
  // outside-view copy in a neighbouring grid; always prefer the in-month cell.
  const valueSelector = `[data-value='${toIsoString(target)}']`
  const candidateDay = parentElement.querySelector<HTMLElement>(`${valueSelector}:not([data-outside-view])`)
    ?? (options.allowOutsideView ? parentElement.querySelector<HTMLElement>(valueSelector) : null)

  if (!candidateDay) {
    nextTick(() => tryFocusDate(parentElement, target, directionSign, retries + 1, options))
    return
  }

  if (candidateDay.hasAttribute('data-disabled') || candidateDay.hasAttribute('data-unavailable')) {
    if (!directionSign)
      return

    const nextTarget = clampTargetDate(target.add({ days: directionSign }), options.minValue, options.maxValue)
    if (compareDateValues(nextTarget, target) === 0)
      return

    options.onPlaceholderChange(nextTarget)
    nextTick(() => tryFocusDate(parentElement, nextTarget, directionSign, retries + 1, options))
    return
  }

  if (options.allowOutsideView && candidateDay.hasAttribute('data-outside-view') && !candidateDay.hasAttribute('tabindex'))
    candidateDay.setAttribute('tabindex', '-1')

  candidateDay.focus()
}

/**
 * The key a calendar cell acts on, with Space spelled out.
 * `event.code` names the physical key, so the numeric keypad's Enter (`NumpadEnter`) and, without
 * NumLock, its arrows, Home, End and Page keys (`Numpad8`, …) would match nothing.
 */
export function getCalendarKey(event: KeyboardEvent): string {
  return event.key === ' ' ? 'Space' : event.key
}

/**
 * Finds the first (`start`) or last (`end`) enabled cell trigger in the grid row of `current`, for Home and End
 * in the month and year grids. `offset` is its distance from `current` in cells.
 */
export function getRowBoundaryCell(current: HTMLElement, boundary: 'start' | 'end', selector: string): { element: HTMLElement, offset: number } | undefined {
  const row = current.closest('[role="row"]')
  if (!row)
    return
  const cells = Array.from(row.querySelectorAll<HTMLElement>(selector))
  const currentIndex = cells.indexOf(current)
  if (currentIndex === -1)
    return
  const enabled = cells.filter(cell => !cell.hasAttribute('data-disabled'))
  const element = boundary === 'start' ? enabled[0] : enabled.at(-1)
  if (!element)
    return
  return { element, offset: cells.indexOf(element) - currentIndex }
}
