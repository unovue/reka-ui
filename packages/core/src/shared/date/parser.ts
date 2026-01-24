import type { Ref } from 'vue'
import type { Formatter } from '@/shared'
import type { DateSegmentPart, Granularity, HourCycle, SegmentContentObj, SegmentPart, SegmentValueObj, TimeSegmentPart } from '@/shared/date'
import type { TemporalDate } from '@/temporal/types'
import { Temporal } from 'temporal-polyfill'
import { DATE_SEGMENT_PARTS, EDITABLE_SEGMENT_PARTS, getOptsByGranularity, getPlaceholder, isDateSegmentPart, isSegmentPart, normalizeHourCycle, TIME_SEGMENT_PARTS } from '@/shared/date'
import { isZonedDateTime } from '@/temporal/comparators'

const calendarDateTimeGranularities = ['hour', 'minute', 'second']

type SyncDateSegmentValuesProps = {
  value: TemporalDate
  formatter: Formatter
}

type SyncTimeSegmentValuesProps = {
  value: TemporalDate
  formatter: Formatter
}

export function syncTimeSegmentValues(props: SyncTimeSegmentValuesProps) {
  return Object.fromEntries(TIME_SEGMENT_PARTS.map((part) => {
    if (part === 'dayPeriod')
      return [part, props.formatter.dayPeriod(toDate(props.value))]
    return [part, getTimeFieldValue(props.value, part)]
  })) as SegmentValueObj
}

export function syncSegmentValues(props: SyncDateSegmentValuesProps) {
  const { formatter } = props

  const dateValues = DATE_SEGMENT_PARTS.map((part) => {
    return [part, props.value[part]]
  })
  if ('hour' in props.value) {
    const timeValues = syncTimeSegmentValues({ value: props.value, formatter })

    return { ...Object.fromEntries(dateValues), ...timeValues } as SegmentValueObj
  }

  return Object.fromEntries(dateValues) as SegmentValueObj
}

export function initializeTimeSegmentValues(granularity: 'hour' | 'minute' | 'second'): SegmentValueObj {
  return Object.fromEntries(
    TIME_SEGMENT_PARTS.map((part) => {
      if (part === 'dayPeriod')
        return [part, 'AM']
      return [part, null]
    }).filter(([key]) => {
      if (key === 'literal' || key === null)
        return false
      if (granularity === 'minute' && key === 'second')
        return false
      if (granularity === 'hour' && (key === 'second' || key === 'minute'))
        return false
      else return true
    }),
  )
}

export function initializeSegmentValues(granularity: Granularity): SegmentValueObj {
  const initialParts = EDITABLE_SEGMENT_PARTS.map((part) => {
    if (part === 'dayPeriod')
      return [part, 'AM']

    return [part, null]
  }).filter(([key]) => {
    if (key === 'literal' || key === null)
      return false
    if (granularity === 'minute' && key === 'second')
      return false
    if (granularity === 'hour' && (key === 'second' || key === 'minute'))
      return false
    if (granularity === 'day')
      return !calendarDateTimeGranularities.includes(key) && key !== 'dayPeriod'
    else return true
  })

  return Object.fromEntries(initialParts)
}

type SharedContentProps = {
  granularity: Granularity
  dateRef: TemporalDate
  formatter: Formatter
  hideTimeZone: boolean
  hourCycle: HourCycle
  isTimeValue?: boolean
}

type CreateContentObjProps = SharedContentProps & {
  segmentValues: SegmentValueObj
  locale: Ref<string>
}

type CreateContentArrProps = SharedContentProps & {
  contentObj: SegmentContentObj
}

function createContentObj(props: CreateContentObjProps) {
  const { segmentValues, formatter, locale } = props
  function getPartContent(part: DateSegmentPart | TimeSegmentPart) {
    if ('hour' in segmentValues) {
      const value = segmentValues[part]
      if (value !== null) {
        if (part === 'day') {
          return formatter.part(props.dateRef.with({
            [part as keyof TemporalDate]: value,
            /**
             * Edge case for the day field:
             *
             * 1. If the month is filled,
             *   we need to ensure that the day snaps to the maximum value of that month.
             * 2. If the month is not filled,
             *   we default to the month with the maximum number of days (here just using January, 31 days),
             *   so that user can input any possible day.
             */
            month: segmentValues.month ?? 1,
          }), part, { hourCycle: normalizeHourCycle(props.hourCycle) })
        }
        return formatter.part(props.dateRef.with({ [part]: value }), part, {
          hourCycle: normalizeHourCycle(props.hourCycle),
        })
      }
      else {
        return getPlaceholder(part, '', locale.value)
      }
    }
    else {
      if (isDateSegmentPart(part)) {
        const value = segmentValues[part]
        if (value !== null) {
          if (part === 'day') {
            return formatter.part(props.dateRef.with({
              [part]: value,
              // Same logic as above for the day field
              month: segmentValues.month ?? 1,
            }), part)
          }

          return formatter.part(props.dateRef.with({ [part]: value }), part)
        }

        else {
          return getPlaceholder(part, '', locale.value)
        }
      }
      return ''
    }
  }

  const content = Object.keys(segmentValues).reduce((obj, part) => {
    if (!isSegmentPart(part))
      return obj
    if ('hour' in segmentValues && part === 'dayPeriod') {
      const value = segmentValues[part]

      if (value !== null)
        obj[part] = value

      else
        obj[part] = getPlaceholder(part, 'AM', locale.value)
    }
    else {
      obj[part] = getPartContent(part)
    }

    return obj
  }, {} as SegmentContentObj)

  return content
}

function toDate(dateValue: TemporalDate): Date {
  if (isZonedDateTime(dateValue)) {
    return new Date(dateValue.toInstant().epochMilliseconds)
  }

  if (dateValue instanceof Temporal.PlainDateTime) {
    const zoned = dateValue.toZonedDateTime('UTC')
    return new Date(zoned.toInstant().epochMilliseconds)
  }

  const zoned = dateValue.toZonedDateTime({
    timeZone: 'UTC',
    plainTime: Temporal.PlainTime.from({ hour: 0, minute: 0, second: 0 }),
  })
  return new Date(zoned.toInstant().epochMilliseconds)
}

function getTimeFieldValue(dateValue: TemporalDate, part: TimeSegmentPart): number | null {
  if (part === 'hour' && 'hour' in dateValue)
    return dateValue.hour
  if (part === 'minute' && 'minute' in dateValue)
    return dateValue.minute
  if (part === 'second' && 'second' in dateValue)
    return dateValue.second

  return null
}

function createContentArr(props: CreateContentArrProps) {
  const { granularity, formatter, contentObj, hideTimeZone, hourCycle, isTimeValue } = props
  const parts = formatter.toParts(props.dateRef, getOptsByGranularity(granularity, hourCycle, isTimeValue))

  const segmentContentArr = parts
    .map((part) => {
      const defaultParts = ['literal', 'timeZoneName', null]

      if (defaultParts.includes(part.type) || !isSegmentPart(part.type)) {
        return {
          part: part.type,
          value: part.value,
        }
      }

      return {
        part: part.type,
        value: contentObj[part.type],
      }
    })
    .filter((segment): segment is { part: SegmentPart, value: string } => {
      if (segment.part === null || segment.value === null)
        return false
      if (segment.part === 'timeZoneName' && (!isZonedDateTime(props.dateRef) || hideTimeZone))
        return false

      // In some locales (e.g., zh-TW), the time zone is represented with square brackets.
      // We also filter out these literals that are just brackets.
      // @see https://github.com/unovue/reka-ui/issues/1670
      if (
        (!isZonedDateTime(props.dateRef) || hideTimeZone)
        && segment.part === 'literal' && ['[', ']'].includes(segment.value.trim())
      ) {
        return false
      }

      return true
    })

  return segmentContentArr
}

type CreateContentProps = CreateContentObjProps

export function createContent(props: CreateContentProps) {
  const contentObj = createContentObj(props)

  const contentArr = createContentArr({
    contentObj,
    ...props,
  })

  return {
    obj: contentObj,
    arr: contentArr,
  }
}
