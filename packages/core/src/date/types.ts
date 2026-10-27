/*
  * Implementation ported from https://github.com/melt-ui/melt-ui/blob/develop/src/lib/internal/helpers/date/types.ts
*/

/**
 * A date the date components accept and emit: a Temporal `PlainDate`, a
 * `PlainDateTime`, or a `ZonedDateTime`. The app provides `Temporal` (natively
 * or with a polyfill); Reka uses the global one and TypeScript 6's lib types.
 */
export type DateValue = Temporal.PlainDate | Temporal.PlainDateTime | Temporal.ZonedDateTime

/**
 * The unit a calendar cell represents. Also the unit a calendar `view`
 * shows and the unit a `granularity` selects.
 */
export type CalendarUnit = 'day' | 'month' | 'year'

/**
 * A predicate over a `DateValue`. In v3 the calendar also passes the unit of
 * the cell being tested as an additive second argument. `Calendar` and
 * `RangeCalendar` call their matchers only for cells at the `granularity`, so
 * the unit is the granularity (`'month'` in a month picker); the coarser
 * navigation views never call them.
 */
export type Matcher = (date: DateValue, unit?: CalendarUnit) => boolean

/**
 * One page of calendar cells: a month of days, a year of months, or a run
 * of years. `Calendar` always exposes an array of these, whatever the view.
 */
export type CalendarGridData<T = DateValue> = Grid<T>

export type Grid<T> = {
  /**
   * A `DateValue` used to represent the month. Since days
   * from the previous and next months may be included in the
   * calendar grid, we need a source of truth for the value
   * the grid is representing.
   */
  value: DateValue

  /**
   * An array of arrays representing the weeks in the calendar.
   * Each sub-array represents a week, and contains the dates for each
   * day in that week. This structure is useful for rendering the calendar
   * grid using a table, where each row represents a week and each cell
   * represents a day.
   */
  rows: T[][]

  /**
   * An array of all the dates in the current month, including dates from
   * the previous and next months that are used to fill out the calendar grid.
   * This array is useful for rendering the calendar grid in a customizable way,
   * as it provides all the dates that should be displayed in the grid in a flat
   * array.
   */
  cells: T[]
}
