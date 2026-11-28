import type { Ref } from 'vue'
import type { Granularity } from './comparators'
import type { DateInputType, DateStep, DateValue, HourCycle } from './types'
import type { Translate } from '@/shared/translations'
import { defu } from 'defu'
import { nextTick, watch } from 'vue'
import { toCalendar, toIsoString } from '@/date/temporal'
import { getActiveElement } from '@/shared/getActiveElement'
import { dateMessages } from '@/shared/translations'
import { useTranslations } from '@/shared/useTranslations'

/**
 * The value a range field submits in a form: `start - end` as ISO strings.
 * Only a complete range is a value: while either end is missing it is an
 * empty string, so `required` reports `valueMissing`.
 *
 * @internal
 */
export function toRangeFormValue(range: { start?: DateValue | Temporal.PlainTime | null, end?: DateValue | Temporal.PlainTime | null }): string {
  const { start, end } = range
  return start && end ? `${toIsoString(start)} - ${toIsoString(end)}` : ''
}

/**
 * The attributes of a calendar cell trigger for the element it renders. The
 * surface leaves `tabindex` off a skipped cell (disabled, or outside the view),
 * which keeps the default `div` out of the tab order. Any other `as` (a tag or
 * a component) or `asChild` may render something natively focusable, such as
 * a button, so those cells get `-1` instead.
 *
 * @internal
 */
export function withCellTriggerTabindex<T extends Record<string, unknown>>(attrs: T, primitive: { as?: unknown, asChild?: boolean }): T {
  if (attrs.tabindex !== undefined || (primitive.as === 'div' && !primitive.asChild))
    return attrs
  return { ...attrs, tabindex: -1 }
}

/**
 * The translate function of the nearest `ConfigProvider` when called in a
 * component's setup, else the built-in English one, so the date composables
 * also run outside a component (e.g. in an `effectScope`).
 *
 * @internal
 */
export function useDateTranslations(): Translate {
  return useTranslations(dateMessages)
}

export function getOptsByGranularity(granularity: Granularity, hourCycle: HourCycle, isTimeValue: boolean = false) {
  const opts: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
    hourCycle: normalizeHourCycle(hourCycle),
    hour12: normalizeHour12(hourCycle),
  }
  if (isTimeValue) {
    delete opts.year
    delete opts.month
    delete opts.day
  }

  if (granularity === 'day') {
    delete opts.second
    delete opts.hour
    delete opts.minute
    delete opts.timeZoneName
  }
  if (granularity === 'hour') {
    delete opts.minute
    delete opts.second
  }

  if (granularity === 'minute')
    delete opts.second

  return opts
}

type GetDefaultDateStepProps = {
  step?: DateStep
}

export function normalizeDateStep(props?: GetDefaultDateStepProps): DateStep {
  return defu(props?.step, {
    year: 1,
    month: 1,
    day: 1,
    hour: 1,
    minute: 1,
    second: 1,
    millisecond: 1,
  } satisfies DateStep)
}

export function handleCalendarInitialFocus(calendar: HTMLElement | undefined) {
  if (!calendar)
    return

  const selectedDay = calendar.querySelector<HTMLElement>('[data-selected]')
  if (selectedDay)
    return selectedDay.focus()

  const today = calendar.querySelector<HTMLElement>('[data-today]')
  if (today)
    return today.focus()

  const firstDay = calendar.querySelector<HTMLElement>('[data-value]:not([data-outside-view]):not([data-disabled])')
  if (firstDay)
    return firstDay.focus()
}

/**
 * Keeps keyboard focus inside the calendar when the view changes. Selecting a
 * month or year cell above the granularity drills down, which unmounts the
 * focused cell; without this the focus falls back to `<body>`. Focus moves to
 * the tabbable cell of the new view (the placeholder, else the first focusable
 * cell). A view change that leaves the focus alone (the view trigger, a
 * controlled `view`) is not touched.
 *
 * @lifecycle setup — installs a watcher.
 */
export function useCalendarViewFocus(calendar: Ref<HTMLElement | undefined>, view: Ref<unknown>) {
  // Default (pre) flush: runs before the outgoing view is unmounted.
  watch(view, () => {
    const root = calendar.value
    const active = root ? getActiveElement(root) : null
    if (!root || !active || !root.contains(active) || !active.hasAttribute('data-reka-calendar-cell-trigger'))
      return

    nextTick(() => {
      if (root.contains(getActiveElement(root)))
        return
      root.querySelector<HTMLElement>('[data-reka-calendar-cell-trigger][tabindex="0"]')?.focus()
    })
  })
}

export function normalizeHourCycle(hourCycle: HourCycle) {
  if (hourCycle === 24)
    return 'h23'
  if (hourCycle === 12)
    return 'h11'
  return undefined
}

export function normalizeHour12(hourCycle: HourCycle) {
  if (hourCycle === 24)
    return false
  if (hourCycle === 12)
    return true
  return undefined
}

export function getInputType(granularity: Granularity): DateInputType {
  return granularity === 'day' ? 'date' : 'datetime-local'
}

export function normalizeInputValue(date: DateValue | undefined, granularity: Granularity): string {
  if (!date)
    return ''

  const type = getInputType(granularity)

  // Native date inputs take ISO fields, whatever calendar the value is in.
  date = toCalendar(date, 'iso8601')
  const year = String(date.year).padStart(4, '0')
  const month = String(date.month).padStart(2, '0')
  const day = String(date.day).padStart(2, '0')

  if (type === 'date')
    return `${year}-${month}-${day}`

  const hour = String('hour' in date ? date.hour : 0).padStart(2, '0')
  const minute = String('minute' in date ? date.minute : 0).padStart(2, '0')

  if (granularity === 'second') {
    const second = String('second' in date ? date.second : 0).padStart(2, '0')
    return `${year}-${month}-${day}T${hour}:${minute}:${second}`
  }

  return `${year}-${month}-${day}T${hour}:${minute}`
}
