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
by the [React Aria](https://react-spectrum.adobe.com/react-aria/) team at Adobe, who have created
robust date components that excel in terms of accessibility, user experience, and flexibility.

</Callout>

The date components (Calendar, RangeCalendar, DateField, DateRangeField, DatePicker, DateRangePicker, TimeField and TimeRangeField) take and emit [Temporal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal) values. Temporal is the JavaScript standard for dates and times. Its values are immutable and know their calendar system and, when they have one, their time zone.

## Setup

### Load Temporal

Reka UI reads the global `Temporal` and does not bundle an implementation. Browsers that ship Temporal need nothing. Elsewhere, install a polyfill and load it once, before the app mounts:

<InstallationTabs value="temporal-polyfill-lite" />

```ts
// main.ts
import { install } from 'temporal-polyfill-lite/shim'
import { createApp } from 'vue'
import App from './App.vue'

install(false) // keeps the native Temporal when the browser has one

createApp(App).mount('#app')
```

The `temporal-polyfill-lite/shim` bundle supports the `iso8601` and `gregory` calendars. To use other calendar systems (`hebrew`, `japanese`, `islamic-umalqura`, `persian`, `buddhist`, …) load `temporal-polyfill-lite/calendars-full/shim` instead. Users whose locale defaults to a non-Gregorian calendar, such as `th-TH` (Buddhist) or `fa-IR` (Persian), also need it to get new dates in their calendar: with the basic bundle the components fall back to `iso8601` for them, and warn in development. Any other spec-compliant polyfill also works, for example `temporal-polyfill` or `@js-temporal/polyfill`.

A date component that mounts without a global `Temporal` throws an error. In development the error names the fix; in production it is one line.

### Server-side rendering

Server rendering runs the date components too, so load the polyfill on the server as well as in the browser. Node.js has no native Temporal yet. In Nuxt, a universal plugin (one without a `.client` or `.server` suffix) runs in both:

```ts
// plugins/temporal.ts
import { install } from 'temporal-polyfill-lite/shim'

install(false)

export default defineNuxtPlugin(() => {})
```

The plugin installs the polyfill when the module loads, so it runs before any component renders. In another SSR setup, import the same code first in the server entry and in the client entry.

### TypeScript

Reka UI's types use the `Temporal` namespace that TypeScript 6 ships in its `esnext.temporal` lib. Include it in your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "lib": ["ESNext", "DOM", "DOM.Iterable"]
  }
}
```

`@vue/tsconfig` (used by `create-vue` and Vite's Vue templates) sets `lib` to `["ES2022", "DOM", "DOM.Iterable"]`, which has no Temporal. Override `lib` in your own `tsconfig.app.json` as above, or add only Temporal with `["ES2022", "ESNext.Temporal", "DOM", "DOM.Iterable"]`.

On TypeScript 5, add the polyfill's global types instead with `import 'temporal-polyfill-lite/types/global'` in a `.d.ts` file. Avoid this on TypeScript 6, where these types clash with the built-in ones.

::: warning Missing Temporal types
Without Temporal in `lib` or a polyfill's types, `skipLibCheck: true` (the default of most templates) hides the problem: `DateValue` and the date props become `any`, and nothing checks your dates. With `skipLibCheck: false`, Reka UI's declarations fail with `Cannot find namespace 'Temporal'`, even if you use no date component.
:::

## Date Objects

A date component's value is a `DateValue`, one of three Temporal types:

```ts
type DateValue = Temporal.PlainDate | Temporal.PlainDateTime | Temporal.ZonedDateTime
```

- `Temporal.PlainDate` is a date with no time, such as `2024-07-10`. Use it for birthdays, deadlines and other whole days.
- `Temporal.PlainDateTime` is a date and a wall-clock time with no time zone, such as `2024-07-10T12:30:00`. Use it for local appointments.
- `Temporal.ZonedDateTime` is an exact moment in a time zone, such as `2024-07-10T12:30:00-07:00[America/Los_Angeles]`. Use it for meetings and broadcasts that happen at the same instant everywhere.

TimeField and TimeRangeField take a `TimeValue`: a `Temporal.PlainTime` such as `12:30:00`, or a `PlainDateTime` or `ZonedDateTime` whose date they keep.

The components keep the type you pass in. Give a Calendar a `ZonedDateTime` and every value it emits is a `ZonedDateTime` in the same time zone, with the same time of day. Fields use the type to decide which segments to render: a `PlainDate` shows day, month and year, and a `ZonedDateTime` adds the time and the time zone name.

### Creating values

```ts
// From fields (months are 1-based: July is 7)
const date = new Temporal.PlainDate(2024, 7, 10)
const dateTime = new Temporal.PlainDateTime(2024, 7, 10, 12, 30)
const time = new Temporal.PlainTime(12, 30)

// From ISO 8601 strings
const parsedDate = Temporal.PlainDate.from('2024-07-10')
const parsedDateTime = Temporal.PlainDateTime.from('2024-07-10T12:30:00')
const meeting = Temporal.ZonedDateTime.from('2024-07-10T12:30[America/Los_Angeles]')

// From an instant (e.g. a UTC timestamp from an API), in a time zone
const fromApi = Temporal.Instant.from('2024-07-12T07:45:00Z').toZonedDateTimeISO('America/New_York')

// Today and now
const localToday = Temporal.Now.plainDateISO()
const losAngelesToday = Temporal.Now.plainDateISO('America/Los_Angeles')
const now = Temporal.Now.zonedDateTimeISO()

// From a JavaScript Date
const fromDate = Temporal.Instant.fromEpochMilliseconds(Date.now()).toZonedDateTimeISO(Temporal.Now.timeZoneId())
```

Vue templates only see an allow-list of globals, and `Temporal` is not on it. Create values in `<script setup>` and bind them by name:

```vue
<script setup lang="ts">
import { CalendarRoot } from 'reka-ui'

const minValue = new Temporal.PlainDate(2024, 1, 1)
</script>

<template>
  <CalendarRoot :min-value="minValue" />
</template>
```

### Updating values

Temporal values are immutable. The methods that change them return a new value, so reassign the result:

```ts
let placeholder = new Temporal.PlainDate(2024, 7, 10)

placeholder = placeholder.with({ month: 8 }) // set fields
placeholder = placeholder.add({ months: 1 }) // move forward
placeholder = placeholder.subtract({ days: 5 }) // move back
```

When you keep a value in a `ref`, update the `ref` with the new value rather than calling a method and discarding its result.

### Comparing values

Temporal values cannot be compared with `<`, `>` or `===`. Use the type's `compare` and `equals` methods:

```ts
const a = new Temporal.PlainDate(2024, 7, 10)
const b = new Temporal.PlainDate(2024, 7, 11)

Temporal.PlainDate.compare(a, b) // -1
a.equals(b) // false
```

To compare values of different types, use the helpers in `reka-ui/date`. They treat a `PlainDate` as midnight, and compare two `ZonedDateTime`s by instant:

```ts
import { compareDateValues, isBefore, isSameDay } from 'reka-ui/date'

const day = new Temporal.PlainDate(2024, 7, 10)
const lunch = new Temporal.PlainDateTime(2024, 7, 10, 12, 30)

compareDateValues(day, lunch) // -1
isBefore(day, lunch) // true
isSameDay(day, lunch) // true
```

## Calendar systems

Every Temporal value has a calendar system, read from `calendarId`. Values you create from fields or ISO strings use `iso8601`, the proleptic Gregorian calendar. Values in another calendar render in that calendar: month names, the number of months in the year and the era all come from it.

```ts
const date = Temporal.PlainDate.from({ calendar: 'japanese', era: 'reiwa', eraYear: 6, month: 5, day: 1 })
const hebrew = new Temporal.PlainDate(2024, 3, 11).withCalendar('hebrew') // 1 Adar II 5784
```

- **Default calendar.** Without a value or placeholder, the components start from today in the locale's default calendar: `iso8601` for Gregorian locales, `buddhist` for `th-TH` and so on. To override it, set a placeholder in the calendar you want, or add a `-u-ca-` extension to the locale (`en-US-u-ca-hebrew`).
- **Years.** In calendars with eras (`gregory`, `japanese`, `roc`, …) the year segment of a field shows and edits the year of the era (`eraYear`): Reiwa 6 shows `6`. In calendars without eras (`iso8601`, `hebrew`, …) it uses `year`.
- **Comparisons ignore the calendar.** `minValue`, `maxValue` and `isDateUnavailable` compare dates, so a Hebrew `modelValue` and an ISO `maxValue` work together. The components emit values in the calendar of the value or placeholder.
- **ISO strings.** Form inputs and `data-value` attributes hold the ISO date without a calendar annotation (`2024-05-01`, not `2024-05-01[u-ca=japanese]`), whatever the calendar.

## Locale and week

The week starts on the locale's first day (`Intl.Locale.prototype.getWeekInfo()`): Sunday in `en-US`, Monday in `de-DE`, Saturday in `ar-EG`. On runtimes without `getWeekInfo`, Reka UI falls back to a CLDR table by region. Set `weekStartsOn` to override it. The weekend also depends on the locale: use `isWeekend(value, locale)` from `reka-ui/date` rather than testing `dayOfWeek`. The locale also sets the weekday and month names, the order of field segments and the hour cycle (unless you set `hourCycle`).

## Time zones

`PlainDate` and `PlainDateTime` values have no time zone. The components show their fields as they are, whatever the user's time zone, and work out "today" in the user's local time zone.

A `ZonedDateTime` keeps its time zone. A field shows its wall-clock time in that zone along with the zone's name. A calendar keeps the zone and the time of day when the user picks another day. Across a daylight saving change, the UTC offset follows the zone: picking 10 March in `America/Los_Angeles` from a 1 March value at 09:15 gives `2024-03-10T09:15:00-07:00[America/Los_Angeles]`. A time that falls in a spring-forward gap moves forward by the length of the gap, as Temporal's `'compatible'` disambiguation does.

To show a value in another zone, convert it before passing it in: `value.withTimeZone('Europe/Paris')`.

## Placeholder, min, max and unavailable dates

- **`placeholder`** sets the month a calendar shows and the starting value of empty field segments. Use the same type as the value: a `PlainDate` placeholder starts a field with day, month and year segments only.
- **`minValue` and `maxValue`** take any `DateValue` and are compared with the value as described in [Comparing values](#comparing-values).
- **`isDateUnavailable`** and **`isDateDisabled`** receive each cell's date, in the calendar and of the type of the placeholder:

```ts
import type { DateValue } from 'reka-ui'
import { isWeekend } from 'reka-ui/date'

const locale = 'he-IL'
// The weekend of the locale: Friday and Saturday in `he-IL`, Saturday and Sunday in `en-US`
const isDateUnavailable = (date: DateValue) => isWeekend(date, locale)
```

## Formatting

The components format values with `Intl.DateTimeFormat`. Plain values are formatted from their own fields, so they show the same in every time zone. `ZonedDateTime` values are formatted in their own zone, and values in other calendars in that calendar. To format values the same way in your own markup, use [`useDateFormatter`](/docs/utilities/use-date-formatter), or call `toLocaleString` on the value:

```ts
new Temporal.PlainDate(2024, 7, 10).toLocaleString('en-US', { dateStyle: 'long' }) // July 10, 2024
```

## Utility functions

`reka-ui/date` exports the helpers the components use. They accept any `DateValue`.

```ts
import {
  compareDateValues,
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
  isPlainDate,
  isPlainDateTime,
  isSameDay,
  isWeekend,
  isZonedDateTime,
  parseStringToDateValue,
  toCalendar,
  toDate,
} from 'reka-ui/date'

const date = new Temporal.PlainDate(1995, 8, 18)
const minDate = new Temporal.PlainDate(1995, 8, 1)
const maxDate = new Temporal.PlainDate(1995, 8, 31)

parseStringToDateValue('1995-08-20', date) // a PlainDate, the type of the reference value
toDate(date) // a Date at the start of that day in the local time zone
toDate(date, 'Asia/Tokyo') // ... or in another time zone
toCalendar(date, 'hebrew') // the same day in another calendar system
isPlainDate(date) // true
isPlainDateTime(date) // false
isZonedDateTime(date) // false
hasTime(date) // false
getDaysInMonth(date) // 31
getWeekNumber(date, 'en-US', 'sun') // 33
compareDateValues(date, minDate) // 1
isSameDay(date, new Temporal.PlainDateTime(1995, 8, 18, 12)) // true
isWeekend(date, 'en-US') // false: a Friday
isWeekend(date, 'he-IL') // true: the weekend is Friday and Saturday in Israel
isAfter(date, minDate) // true
isBeforeOrSame(date, maxDate) // true
isAfterOrSame(date, minDate) // true
isBefore(date, maxDate) // true
isBetweenInclusive(date, minDate, maxDate) // true
isBetween(date, minDate, maxDate) // true
createMonth({ dateObj: date, weekStartsOn: 0, locale: 'en', fixedWeeks: true }) // a grid of the days in the month of dateObj, by week
createYear({ dateObj: date, numberOfMonths: 2, pagedNavigation: true }) // the months around dateObj, honouring numberOfMonths and pagedNavigation
createDecade({ dateObj: date, startIndex: -10, endIndex: 10 }) // the years around dateObj
createDateRange({ start: date, end: new Temporal.PlainDate(1995, 9, 1) }) // the days from start to end
createYearRange({ start: date, end: new Temporal.PlainDate(2005, 8, 18) }) // the years from start to end
```

## Coming from `@internationalized/date`

Reka UI v2 used `@internationalized/date`. See [Temporal instead of `@internationalized/date`](/docs/guides/migration-v3#temporal-instead-of-internationalized-date) in the migration guide for how its types and functions map to Temporal.
