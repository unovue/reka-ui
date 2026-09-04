---
title: Dates & Times
description: How to work with dates and times in Reka UI.
---

# Dates & Times

<Description>
How to work with dates and times in Reka UI.
</Description>

<Callout type="tip">

The inner-workings of our date-related components are heavily inspired by the research and work done
by the [React Aria](https://react-spectrum.adobe.com/react-aria/) team at Adobe.

</Callout>

Reka UI date components use Temporal objects. If your environment does not support Temporal natively yet, install the polyfill:

<InstallationTabs value="temporal-polyfill" />

## Date Objects

Reka UI uses immutable Temporal values to represent date/time state:

- `Temporal.PlainDate`: date-only value, e.g. `2024-07-10`.
- `Temporal.PlainDateTime`: date + time without timezone.
- `Temporal.ZonedDateTime`: date + time + timezone.
- `Temporal.PlainTime`: time-only value (used in `TimeField`/`TimeRangeField`).

These map to exported Reka UI types:

- `TemporalDate` → `PlainDate | PlainDateTime | ZonedDateTime`
- `TimeValue` → `PlainTime`

## Creating values

```ts
import { Temporal } from 'temporal-polyfill'

const date = Temporal.PlainDate.from({ year: 2024, month: 7, day: 10 })
const parsedDate = Temporal.PlainDate.from('2024-07-10')

const dateTime = Temporal.PlainDateTime.from('2024-07-10T12:30:00')

const zoned = Temporal.ZonedDateTime.from('2024-07-12T00:45-04:00[America/New_York]')

const localToday = Temporal.Now.plainDateISO(Temporal.Now.timeZoneId())
const losAngelesToday = Temporal.Now.plainDateISO('America/Los_Angeles')

const time = Temporal.PlainTime.from({ hour: 9, minute: 30 })
```

## Updating values (immutability)

Temporal values are immutable. Always reassign when updating.

```ts
import { Temporal } from 'temporal-polyfill'

let placeholder = Temporal.PlainDate.from({ year: 2024, month: 7, day: 10 })

placeholder = placeholder.with({ month: 8 })
placeholder = placeholder.add({ months: 1 })
placeholder = placeholder.subtract({ days: 5 })
```

## Parsing API/database strings

```ts
import { Temporal } from 'temporal-polyfill'

const date = Temporal.PlainDate.from('2024-07-10')
const dateTime = Temporal.PlainDateTime.from('2024-07-10T12:30:00')
const zoned = Temporal.ZonedDateTime.from('2024-07-12T00:45-04:00[America/New_York]')

// UTC/absolute timestamp -> zoned value
const absolute = Temporal.Instant
  .from('2024-07-12T07:45:00Z')
  .toZonedDateTimeISO('America/New_York')
```

## Common gotchas

- **Month indexing**: months are **1-indexed** (`January = 1`).
- **Immutability**: methods return new values (`date = date.add(...)`).
- **Timezone-sensitive events**: use `Temporal.ZonedDateTime`.
- **Type consistency**: keep the same Temporal shape for a given component flow.

## `reka-ui/date` helpers

```ts
import type { TemporalDate } from 'reka-ui'
import {
  createDateRange,
  createDecade,
  createMonth,
  createYear,
  createYearRange,
  getDaysInMonth,
  getWeekNumber,
  hasTime,
  isAfter,
  isAfterOrSame,
  isBefore,
  isBeforeOrSame,
  isBetween,
  isBetweenInclusive,
  isCalendarDateTime,
  isZonedDateTime,
  parseStringToDateValue,
  toDate,
} from 'reka-ui/date'
import { Temporal } from 'temporal-polyfill'

const date = Temporal.PlainDate.from({ year: 1995, month: 8, day: 18 })
const minDate = Temporal.PlainDate.from({ year: 1995, month: 8, day: 1 })
const maxDate = Temporal.PlainDate.from({ year: 1995, month: 8, day: 31 })

parseStringToDateValue('1995-08-18', date) // -> TemporalDate
toDate(date) // -> Date

isCalendarDateTime(date) // false
isZonedDateTime(date) // false
hasTime(date) // false

getDaysInMonth(date) // 31
getWeekNumber(date, 'en-US', 'sun')

isAfter(date, minDate)
isBeforeOrSame(date, maxDate)
isAfterOrSame(date, minDate)
isBefore(date, maxDate)
isBetweenInclusive(date, minDate, maxDate)
isBetween(date, minDate, maxDate)

createMonth({ dateObj: date, weekStartsOn: 0, locale: 'en', fixedWeeks: true })
createYear({ dateObj: date, numberOfMonths: 2, pagedNavigation: true })
createDecade({ dateObj: date, startIndex: -10, endIndex: 10 })
createDateRange({ start: date, end: Temporal.PlainDate.from({ year: 2005, month: 8, day: 18 }) })
createYearRange({ start: date, end: Temporal.PlainDate.from({ year: 2005, month: 8, day: 18 }) })

const _: TemporalDate = date
```
