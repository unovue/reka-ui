import type { DateValue } from '@internationalized/date'
import type { DateRange } from 'reka-ui'
import { getLocalTimeZone, today } from '@internationalized/date'

export interface Preset {
  label: string
  range: () => DateRange
}

function startOfMonth(date: DateValue) {
  return date.set({ day: 1 })
}

/**
 * Every preset is a function so the range is computed at click time — a page
 * left open overnight must not hand out yesterday's "Today".
 */
export const presets: Preset[] = [
  {
    label: 'Today',
    range: () => {
      const now = today(getLocalTimeZone())
      return { start: now, end: now }
    },
  },
  {
    label: 'Yesterday',
    range: () => {
      const yesterday = today(getLocalTimeZone()).subtract({ days: 1 })
      return { start: yesterday, end: yesterday }
    },
  },
  {
    label: 'Last 7 days',
    range: () => {
      const now = today(getLocalTimeZone())
      return { start: now.subtract({ days: 6 }), end: now }
    },
  },
  {
    label: 'Last 30 days',
    range: () => {
      const now = today(getLocalTimeZone())
      return { start: now.subtract({ days: 29 }), end: now }
    },
  },
  {
    label: 'Month to date',
    range: () => {
      const now = today(getLocalTimeZone())
      return { start: startOfMonth(now), end: now }
    },
  },
  {
    label: 'Last month',
    range: () => {
      const lastMonth = today(getLocalTimeZone()).subtract({ months: 1 })
      return {
        start: startOfMonth(lastMonth),
        end: startOfMonth(lastMonth).add({ months: 1 }).subtract({ days: 1 }),
      }
    },
  },
  {
    label: 'Year to date',
    range: () => {
      const now = today(getLocalTimeZone())
      return { start: now.set({ month: 1, day: 1 }), end: now }
    },
  },
]
