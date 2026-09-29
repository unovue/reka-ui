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

The component depends on the [@internationalized/date](https://react-spectrum.adobe.com/internationalized/date/index.html) package, which solves a lot of the problems that come with working with dates and times in JavaScript.

We highly recommend reading through the documentation for the package to get a solid feel for how it
works, and you'll need to install it in your project to use the date-related components.

<InstallationTabs value="@internationalized/date" />

## Date Objects

We use the `DateValue` objects provided by `@internationalized/date` to
represent dates in the various components. These objects are immutable, and provide information about
the type of date they represent:

- `CalendarDate`: A date with no time component, such as `2023-10-11`.
- `CalendarDateTime`: A date with a time component, but without a timezone, such as
  `2023-10-11T12:30:00`.
- `ZonedDateTime`: A date with a time component and a timezone, such as
  `2023-10-11T21:00:00:00-04:00[America/New_York]`.

The benefit of using these objects is that we can be very specific about the type of date we want,
and the behavior of the builder will adapt to that type.

Additionally, you don't have to worry about wrangling timezones, daylight savings time, or any other
date-related nuance.

## Utility Functions

This package also provides a number of utility functions which solves a lot of the problems that come with working with dates and times in JavaScript.

Specially designed to work well with [@internationalized/date](https://react-spectrum.adobe.com/internationalized/date/index.html).

# DateValue Types
## CalendarDate
Represents a date without any time component. This is ideal for dates like birthdays, anniversaries, or deadlines where only the date matters.

```ts
// Creating a CalendarDate
import { CalendarDate, getLocalTimeZone, parseDate, today } from '@internationalized/date'

// From year, month, day parameters
const date = new CalendarDate(2024, 7, 10)

// From ISO 8601 string
const parsedDate = parseDate('2024-07-10')

// Current date in specific timezone
const losAngelesToday = today('America/Los_Angeles')

// Current date in user's timezone
const localToday = today(getLocalTimeZone())
```
See the [CalendarDate API Documentation](https://react-spectrum.adobe.com/internationalized/date/CalendarDate.html) for additional methods.

## CalendarDateTime
Represents a date with a time component, but without timezone information. This is useful for events that have a specific time but are not tied to a particular timezone, such as local appointments.

```ts
// Creating a CalendarDateTime
import { CalendarDateTime, parseDateTime } from '@internationalized/date'

// From date and time components
const dateTime = new CalendarDateTime(2024, 7, 10, 12, 30, 0)

// From ISO 8601 string
const parsedDateTime = parseDateTime('2024-07-10T12:30:00')
```
See the [CalendarDateTime API Documentation](https://react-spectrum.adobe.com/internationalized/date/CalendarDateTime.html) for additional methods.

## ZonedDateTime
Represents a specific date and time in a specific timezone. This is crucial for events that occur at an exact moment regardless of the user's location, such as conferences, live broadcasts, or international meetings.

```ts
// Creating a ZonedDateTime
import {
  parseAbsolute,
  parseAbsoluteToLocal,
  parseZonedDateTime,
  ZonedDateTime,
} from '@internationalized/date'

const date = new ZonedDateTime(
  2024, // year
  7, // month
  10, // day
  'America/Los_Angeles', // timezone
  -25200000, // UTC offset in milliseconds (PDT)
  12, // hour
  30, // minute
  0 // second
)

// From ISO 8601 strings using different parsing functions
const date1 = parseZonedDateTime('2024-07-12T00:45[America/New_York]')
const date2 = parseAbsolute('2024-07-12T07:45:00Z', 'America/New_York')
const date3 = parseAbsoluteToLocal('2024-07-12T07:45:00Z')
```
See the [ZonedDateTime](https://react-spectrum.adobe.com/internationalized/date/ZonedDateTime.html) API documentation for more information.

## Updating DateValue Objects
Since DateValue objects are immutable, you must create new instances when updating them. Here are the correct ways to modify them:

```ts
// INCORRECT - will not work
let placeholder = new CalendarDate(2024, 7, 10)
placeholder.month = 8 // Error! DateValue objects are immutable

// CORRECT - using methods that return new instances
let placeholder = new CalendarDate(2024, 7, 10)

// Method 1: Using set() to change specific properties
placeholder = placeholder.set({ month: 8 })

// Method 2: Using add() to increment values
placeholder = placeholder.add({ months: 1 })

// Method 3: Using subtract() to decrement values
placeholder = placeholder.subtract({ days: 5 })

// Method 4: Using cycle() to cycle through valid values
placeholder = placeholder.cycle('month', 'forward', [1, 3, 5, 7, 9, 11])
```

## Parsing
### Parsing Date Strings
When working with date strings from APIs or databases, use the appropriate parsing function based on the type of DateValue you need:

```ts
import {
  parseAbsolute, // For ZonedDateTime from UTC string + timezone
  parseAbsoluteToLocal, // For ZonedDateTime in local timezone
  parseDate, // For CalendarDate
  parseDateTime, // For CalendarDateTime
  parseZonedDateTime, // For ZonedDateTime with timezone name
} from '@internationalized/date'

// Examples
const date = parseDate('2024-07-10') // CalendarDate
const dateTime = parseDateTime('2024-07-10T12:30:00') // CalendarDateTime
const zonedDate = parseZonedDateTime('2024-07-12T00:45[America/New_York]') // ZonedDateTime
const absoluteDate = parseAbsolute('2024-07-12T07:45:00Z', 'America/New_York') // ZonedDateTime
const localDate = parseAbsoluteToLocal('2024-07-12T07:45:00Z') // ZonedDateTime in user's timezone
```

## Common Gotchas and Tips
* **Month Indexing**: Unlike JavaScript's Date object (which is 0-indexed), @internationalized/date uses 1-indexed months (January = 1).
* **Immutability**: Always reassign when modifying date objects: `date = date.add({ days: 1 })`.
* **Timezone Handling**: Use `ZonedDateTime` for schedule-critical events like meetings or appointments.
* **Type Consistency**: Match your DateValue types to your needs - if you need time selection, use `CalendarDateTime` instead of `CalendarDate`.
* **Parsing Functions**: Choose the right parsing function to avoid unexpected results. For example, use `parseDate` for date-only strings and `parseDateTime` for date-time strings without timezone.

### How to use?

```ts
import type { DateValue } from '@internationalized/date'
import { CalendarDate } from '@internationalized/date'

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

const date = new CalendarDate(1995, 8, 18)
const minDate = new CalendarDate(1995, 8, 1)
const maxDate = new CalendarDate(1995, 8, 31)

parseStringToDateValue('1995-08-18', date) // returns a DateValue object
toDate(date) // returns a Date object
isCalendarDateTime(date) // returns false
isZonedDateTime(date) // returns false
hasTime(date) // returns false
getDaysInMonth(date) // returns 31
getWeekNumber(new CalendarDate(1995, 8, 18), 'en-US', 'sun') // returns 33
isAfter(date, minDate) // returns true
isBeforeOrSame(date, maxDate) // returns true
isAfterOrSame(date, minDate) // returns true
isBefore(date, maxDate) // returns true
isBetweenInclusive(date, minDate, maxDate) // returns true
isBetween(date, minDate, maxDate) // returns true
createMonth({ dateObj: new CalendarDate(1995, 8, 18), weekStartsOn: 0, locale: 'en', fixedWeeks: true }) // returns a grid of days as DateValue for the month, also containing the dateObj, plus an array of days for the month
createYear({ dateObj: new CalendarDate(1995, 8, 18), numberOfMonths: 2, pagedNavigation: true }) // returns an array of months as DateValue, centered around the dateObj taking into account the numberOfMonths and pagedNavigation when returning the months
createDecade({ dateObj: new CalendarDate(1995, 8, 18), startIndex: -10, endIndex: 10 }) // returns a decade centered around the dateObj
createDateRange({ start: new CalendarDate(1995, 8, 18), end: new CalendarDate(2005, 8, 18) }) // returns an array of dates as DateValue between the start and end date
createYearRange({ start: new CalendarDate(1995, 8, 18), end: new CalendarDate(2005, 8, 18) }) // returns an array of years as DateValue between the start and end date
```
