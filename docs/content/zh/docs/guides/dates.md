---
title: 日期和时间
description: 如何在 Reka UI 中使用日期和时间。
---

# 日期和时间

<Description>
如何在 Reka UI 中使用日期和时间。
</Description>

<Callout type="tip">

我们与日期相关的组件的内部工作原理在很大程度上受到了 Adobe 的 [React Aria](https://react-spectrum.adobe.com/react-aria/) 团队所做的研究和工作的启发，他们创建了强大的日期组件，这些组件在可访问性、用户体验和灵活性方面都表现出色。

</Callout>

该组件依赖于 [@internationalized/date](https://react-spectrum.adobe.com/internationalized/date/index.html) 包，这个包解决了在 JavaScript 中处理日期和时间时出现的许多问题。

我们强烈建议通读该包的文档，以便深入了解它的工作原理，并且你需要在你的项目中安装它才能使用与日期相关的组件。

<InstallationTabs value="@internationalized/date" />

## Date 对象

我们使用 `@internationalized/date` 提供的 `DateValue` 对象来表示各种组件中的日期。这些对象是不可变的，并提供有关它们所表示的日期类型的信息：

- `CalendarDate`: 没有时间组成部分的日期，例如 `2023-10-11`.
- `CalendarDateTime`: 有时间组成部分但没有时区的日期，例如
  `2023-10-11T12:30:00`.
- `ZonedDateTime`: 具有时间组成部分和时区的日期，例如
  `2023-10-11T21:00:00:00-04:00[America/New_York]`.

使用这些对象的好处是我们可以非常具体地定义我们想要的日期类型，并且构建器的行为将适应该类型。

此外，您不必担心时区、夏令时或任何其他与日期相关的细微差别。

## 通用函数

这个包还提供了许多实用函数，解决了在 JavaScript 中使用日期和时间带来的许多问题。

专为 [@internationalized/date](https://react-spectrum.adobe.com/internationalized/date/index.html) 设计。

### 如何使用？

```ts
import {
  createDateRange,
  createDecade,
  createMonth,
  createYear,
  createYearRange,
  getDaysInMonth,
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

import { CalendarDate, type DateValue } from '@internationalized/date'

const date = new CalendarDate(1995, 8, 18)
const minDate = new CalendarDate(1995, 8, 1)
const maxDate = new CalendarDate(1995, 8, 31)

parseStringToDateValue('1995-08-18', date) // returns a DateValue object
toDate(date) // returns a Date object
isCalendarDateTime(date) // returns false
isZonedDateTime(date) // returns false
hasTime(date) // returns false
getDaysInMonth(date) // returns 31
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
