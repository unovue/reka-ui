import type { DateValue, DayOfWeek } from '@internationalized/date'
import type { WeekStartsOn } from '@/date'
import { getDayOfWeek } from '@internationalized/date'
import { nextTick } from 'vue'
import { getDaysInMonth } from '@/date'

export const MAX_FOCUS_RETRIES = 24

const weekStartsOnToDayOfWeek: Record<WeekStartsOn, DayOfWeek> = {
  0: 'sun',
  1: 'mon',
  2: 'tue',
  3: 'wed',
  4: 'thu',
  5: 'fri',
  6: 'sat',
}

function toDayOfWeek(weekStartsOn: WeekStartsOn): DayOfWeek {
  return weekStartsOnToDayOfWeek[weekStartsOn]
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
  const target = getWeekBoundaryDay(baseDate, locale, weekStartsOn, boundary)
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
    return pageDate.set({ day: 1 })
  }

  if (isOutsideVisibleView(target)) {
    if (isNext && !options.isNextButtonDisabled(customPageFn))
      options.nextPage(customPageFn)
    else if (!isNext && !options.isPrevButtonDisabled(customPageFn))
      options.prevPage(customPageFn)
  }

  focusDate({ ...options, target, directionSign: amount })
}

export function getWeekBoundaryDay(
  date: DateValue,
  locale: string,
  weekStartsOn: WeekStartsOn,
  boundary: 'start' | 'end',
): DateValue {
  const dayOfWeek = getDayOfWeek(date, locale, toDayOfWeek(weekStartsOn))
  const offset = boundary === 'start' ? -dayOfWeek : 6 - dayOfWeek
  return date.add({ days: offset })
}

export function getTargetMonthDay(date: DateValue, unit: 'month' | 'year', amount: number): DateValue {
  const targetBase = date.add(unit === 'month' ? { months: amount } : { years: amount })
  const daysInTargetMonth = getDaysInMonth(targetBase)
  const targetDay = Math.min(date.day, daysInTargetMonth)
  return targetBase.set({ day: targetDay })
}

export function clampTargetDate(date: DateValue, minValue?: DateValue, maxValue?: DateValue): DateValue {
  let candidateDay = date

  if (minValue && candidateDay.compare(minValue) < 0)
    candidateDay = minValue.copy()

  if (maxValue && candidateDay.compare(maxValue) > 0)
    candidateDay = maxValue.copy()

  return candidateDay
}

function focusDate(options: FocusDateOptions) {
  const clampedTarget = clampTargetDate(options.target, options.minValue, options.maxValue)

  // Determine safe direction:
  // - unclamped target within bounds -> original directionSign
  // - clamped to minValue from negative movement -> +1 (inward)
  // - clamped to maxValue from positive movement -> -1 (inward)
  // - otherwise -> 0
  let safeDirection = 0
  const isClampedToMin = options.minValue && clampedTarget.compare(options.minValue) === 0
  const isClampedToMax = options.maxValue && clampedTarget.compare(options.maxValue) === 0
  const wasClamped = isClampedToMin || isClampedToMax

  if (!wasClamped) {
    safeDirection = options.directionSign
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

  const candidateSelector = options.allowOutsideView
    ? `[data-value='${target.toString()}']`
    : `[data-value='${target.toString()}']:not([data-outside-view])`
  const candidateDay = parentElement.querySelector<HTMLElement>(candidateSelector)

  if (!candidateDay) {
    nextTick(() => tryFocusDate(parentElement, target, directionSign, retries + 1, options))
    return
  }

  if (candidateDay.hasAttribute('data-disabled') || candidateDay.hasAttribute('data-unavailable')) {
    if (!directionSign)
      return

    const nextTarget = clampTargetDate(target.add({ days: directionSign }), options.minValue, options.maxValue)
    if (nextTarget.compare(target) === 0)
      return

    options.onPlaceholderChange(nextTarget)
    nextTick(() => tryFocusDate(parentElement, nextTarget, directionSign, retries + 1, options))
    return
  }

  if (options.allowOutsideView && candidateDay.hasAttribute('data-outside-view') && !candidateDay.hasAttribute('tabindex'))
    candidateDay.setAttribute('tabindex', '-1')

  candidateDay.focus()
}
