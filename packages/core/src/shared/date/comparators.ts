/*
  * Implementation ported from https://github.com/melt-ui/melt-ui/blob/develop/src/lib/internal/helpers/date/utils.ts
*/

import type { TemporalDate, TemporalDateTime } from '@/temporal/types'
import { Temporal } from 'temporal-polyfill'

export type TimeValue = TemporalDateTime

export type Granularity = 'day' | 'hour' | 'minute' | 'second'
export type TimeGranularity = 'hour' | 'minute' | 'second'

type GetDefaultDateProps = {
  defaultValue?: TemporalDate | TemporalDate[] | undefined
  defaultPlaceholder?: TemporalDate | undefined
  granularity?: Granularity
  locale?: string
}

/**
 * A helper function used throughout the various date builders
 * to generate a default `DateValue` using the `defaultValue`,
 * `defaultPlaceholder`, and `granularity` props.
 *
 * It's important to match the `DateValue` type being used
 * elsewhere in the builder, so they behave according to the
 * behavior the user expects based on the props they've provided.
 *
 */
export function getDefaultDate(props: GetDefaultDateProps): TemporalDate {
  const { defaultValue, defaultPlaceholder, granularity = 'day' } = props

  if (Array.isArray(defaultValue) && defaultValue.length)
    return defaultValue.at(-1)!

  if (defaultValue && !Array.isArray(defaultValue))
    return defaultValue

  if (defaultPlaceholder)
    return defaultPlaceholder

  const date = new Date()
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const calendarDateTimeGranularities = ['hour', 'minute', 'second']

  if (calendarDateTimeGranularities.includes(granularity ?? 'day'))
    return Temporal.PlainDateTime.from({ year, month, day, hour: 0, minute: 0, second: 0 })

  return Temporal.PlainDate.from({ year, month, day })
}

type GetDefaultTimeProps = {
  defaultValue?: TimeValue | undefined
  defaultPlaceholder?: TimeValue | undefined
}

export function getDefaultTime(props: GetDefaultTimeProps): TimeValue {
  const { defaultValue, defaultPlaceholder } = props

  if (defaultValue) {
    return defaultValue
  }

  if (defaultPlaceholder) {
    return defaultPlaceholder
  }

  return Temporal.PlainTime.from({ hour: 0, minute: 0, second: 0 })
}
