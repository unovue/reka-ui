import type { DateValue } from '@internationalized/date'
import type { CalendarUnit } from '@/date'
import { CalendarDate } from '@internationalized/date'
import { describe, expect, it } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'
import { useCalendar } from './__fixtures__/useCalendarV2'
import { useMonthPicker } from './__fixtures__/useMonthPickerV2'
import { useYearPicker } from './__fixtures__/useYearPickerV2'
import { useCalendarGrid } from './useCalendarGrid'

/**
 * Parity harness: the new composable must reproduce the three v2 composables
 * it replaces, scenario by scenario. Each scenario builds both, drives them
 * identically and compares their observable output. The v2 composables are
 * frozen fixtures: the families they came from no longer exist.
 */

type Scenario = {
  placeholder: DateValue
  locale?: string
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
  fixedWeeks?: boolean
  numberOfMonths?: number
  pagedNavigation?: boolean
  yearsPerPage?: number
  minValue?: DateValue
  maxValue?: DateValue
  disabled?: boolean
  isDateDisabled?: (d: DateValue) => boolean
  isDateUnavailable?: (d: DateValue) => boolean
  nextPage?: (d: DateValue) => DateValue
  prevPage?: (d: DateValue) => DateValue
}

const cellStrings = (grid: { cells: DateValue[] }[]) => grid.map(page => page.cells.map(c => c.toString()))

function withScope<T>(fn: () => T): T {
  const scope = effectScope()
  return scope.run(fn)!
}

function buildNew(unit: CalendarUnit, s: Scenario) {
  const placeholder = ref(s.placeholder) as any
  const setPlaceholder = (d: DateValue) => { placeholder.value = d }
  const api = useCalendarGrid({
    unit,
    placeholder,
    setPlaceholder,
    locale: s.locale ?? 'en-US',
    weekStartsOn: s.weekStartsOn ?? 0,
    fixedWeeks: s.fixedWeeks,
    numberOfMonths: s.numberOfMonths,
    pagedNavigation: s.pagedNavigation,
    yearsPerPage: s.yearsPerPage,
    minValue: s.minValue,
    maxValue: s.maxValue,
    disabled: s.disabled,
    isDateDisabled: s.isDateDisabled,
    isDateUnavailable: s.isDateUnavailable,
    calendarLabel: undefined,
    nextPage: s.nextPage,
    prevPage: s.prevPage,
  })
  return { api, placeholder }
}

function buildOldDay(s: Scenario) {
  const placeholder = ref(s.placeholder) as any
  const api = useCalendar({
    locale: ref(s.locale ?? 'en-US'),
    placeholder,
    weekStartsOn: ref(s.weekStartsOn ?? 0),
    fixedWeeks: ref(s.fixedWeeks ?? false),
    numberOfMonths: ref(s.numberOfMonths ?? 1),
    minValue: ref(s.minValue),
    maxValue: ref(s.maxValue),
    disabled: ref(s.disabled ?? false),
    weekdayFormat: ref('narrow'),
    pagedNavigation: ref(s.pagedNavigation ?? false),
    isDateDisabled: s.isDateDisabled,
    isDateUnavailable: s.isDateUnavailable,
    calendarLabel: ref(undefined),
    nextPage: ref(s.nextPage),
    prevPage: ref(s.prevPage),
  })
  return { api, placeholder }
}

function buildOldMonth(s: Scenario) {
  const placeholder = ref(s.placeholder) as any
  const api = useMonthPicker({
    locale: ref(s.locale ?? 'en-US'),
    placeholder,
    minValue: ref(s.minValue),
    maxValue: ref(s.maxValue),
    disabled: ref(s.disabled ?? false),
    isMonthDisabled: s.isDateDisabled,
    isMonthUnavailable: s.isDateUnavailable,
    calendarLabel: ref(undefined),
    nextPage: ref(s.nextPage),
    prevPage: ref(s.prevPage),
  })
  return { api, placeholder }
}

function buildOldYear(s: Scenario) {
  const placeholder = ref(s.placeholder) as any
  const api = useYearPicker({
    locale: ref(s.locale ?? 'en-US'),
    placeholder,
    minValue: ref(s.minValue),
    maxValue: ref(s.maxValue),
    disabled: ref(s.disabled ?? false),
    yearsPerPage: ref(s.yearsPerPage ?? 12),
    isYearDisabled: s.isDateDisabled,
    isYearUnavailable: s.isDateUnavailable,
    calendarLabel: ref(undefined),
    nextPage: ref(s.nextPage),
    prevPage: ref(s.prevPage),
  })
  return { api, placeholder }
}

const sep5 = new CalendarDate(2026, 9, 5)

describe('useCalendarGrid — day view parity with useCalendar', () => {
  const scenarios: Record<string, Scenario> = {
    'single month': { placeholder: sep5 },
    'fixed weeks, Monday start': { placeholder: sep5, fixedWeeks: true, weekStartsOn: 1 },
    'two months paged': { placeholder: sep5, numberOfMonths: 2, pagedNavigation: true },
    'bounded': { placeholder: sep5, minValue: new CalendarDate(2026, 8, 20), maxValue: new CalendarDate(2026, 11, 10) },
    'bounded inside the month': { placeholder: sep5, minValue: new CalendarDate(2026, 9, 10), maxValue: new CalendarDate(2026, 9, 20) },
    'matcher': { placeholder: sep5, isDateDisabled: d => d.day % 2 === 0, isDateUnavailable: d => d.day === 13 },
    'disabled': { placeholder: sep5, disabled: true, minValue: new CalendarDate(2020, 1, 1), maxValue: new CalendarDate(2030, 1, 1) },
    'custom paging by year': { placeholder: sep5, nextPage: d => d.add({ years: 1 }), prevPage: d => d.subtract({ years: 1 }), maxValue: new CalendarDate(2028, 1, 1), minValue: new CalendarDate(2024, 1, 1) },
    'de-DE locale': { placeholder: sep5, locale: 'de-DE', weekStartsOn: 1 },
  }

  for (const [name, s] of Object.entries(scenarios)) {
    it(`matches on initial render: ${name}`, () => {
      withScope(() => {
        const { api: oldApi } = buildOldDay(s)
        const { api: newApi } = buildNew('day', s)

        expect(cellStrings(newApi.grid.value)).toEqual(cellStrings(oldApi.grid.value))
        expect(newApi.headingValue.value).toBe(oldApi.headingValue.value)
        expect(newApi.fullCalendarLabel.value).toBe(oldApi.fullCalendarLabel.value)
        expect(newApi.weekdays.value).toEqual(oldApi.weekdays.value)
        expect(newApi.isNextButtonDisabled()).toBe(oldApi.isNextButtonDisabled())
        expect(newApi.isPrevButtonDisabled()).toBe(oldApi.isPrevButtonDisabled())
        expect(newApi.isPlaceholderFocusable.value).toBe(oldApi.isPlaceholderFocusable.value)
        for (const cell of newApi.grid.value.flatMap(p => p.cells)) {
          expect(newApi.isDateDisabled(cell)).toBe(oldApi.isDateDisabled(cell))
          expect(newApi.isDateUnavailable(cell)).toBe(oldApi.isDateUnavailable(cell))
          expect(newApi.isOutsideVisibleView(cell)).toBe(oldApi.isOutsideVisibleView(cell))
        }
      })
    })

    it(`matches after paging forward twice and back once: ${name}`, async () => {
      await withScope(async () => {
        const { api: oldApi, placeholder: oldPh } = buildOldDay(s)
        const { api: newApi, placeholder: newPh } = buildNew('day', s)

        for (const step of ['next', 'next', 'prev'] as const) {
          if (step === 'next') {
            oldApi.nextPage()
            newApi.nextPage()
          }
          else {
            oldApi.prevPage()
            newApi.prevPage()
          }
          // v2 follows a placeholder that left the page on the next tick; the
          // new composable does so synchronously. Compare once both settled.
          await nextTick()
          expect(newPh.value.toString()).toBe(oldPh.value.toString())
          expect(cellStrings(newApi.grid.value)).toEqual(cellStrings(oldApi.grid.value))
          expect(newApi.headingValue.value).toBe(oldApi.headingValue.value)
          expect(newApi.isNextButtonDisabled()).toBe(oldApi.isNextButtonDisabled())
          expect(newApi.isPrevButtonDisabled()).toBe(oldApi.isPrevButtonDisabled())
        }
      })
    })
  }

  it('matches when a paging function is passed straight to nextPage()', () => {
    withScope(() => {
      const s: Scenario = { placeholder: sep5, maxValue: new CalendarDate(2030, 1, 1) }
      const { api: oldApi, placeholder: oldPh } = buildOldDay(s)
      const { api: newApi, placeholder: newPh } = buildNew('day', s)
      const jump = (d: DateValue) => d.add({ years: 1 })
      expect(newApi.isNextButtonDisabled(jump)).toBe(oldApi.isNextButtonDisabled(jump))
      oldApi.nextPage(jump)
      newApi.nextPage(jump)
      expect(newPh.value.toString()).toBe(oldPh.value.toString())
      expect(cellStrings(newApi.grid.value)).toEqual(cellStrings(oldApi.grid.value))
    })
  })

  it('follows an external placeholder change like useCalendar', async () => {
    await withScope(async () => {
      const { api: oldApi, placeholder: oldPh } = buildOldDay({ placeholder: sep5 })
      const { api: newApi, placeholder: newPh } = buildNew('day', { placeholder: sep5 })
      oldPh.value = new CalendarDate(2027, 2, 14)
      newPh.value = new CalendarDate(2027, 2, 14)
      await nextTick()
      expect(cellStrings(newApi.grid.value)).toEqual(cellStrings(oldApi.grid.value))
      expect(newApi.headingValue.value).toBe('February 2027')
    })
  })

  it('finds a focusable day inside the month even when minValue is after the 1st', () => {
    withScope(() => {
      const { api } = buildNew('day', { placeholder: sep5, minValue: new CalendarDate(2026, 9, 10) })
      expect(api.firstFocusableDate.value?.toString()).toBe('2026-09-10')
    })
  })
})

describe('useCalendarGrid — month view parity with useMonthPicker', () => {
  const scenarios: Record<string, Scenario> = {
    'plain': { placeholder: sep5 },
    'bounded': { placeholder: sep5, minValue: new CalendarDate(2026, 3, 15), maxValue: new CalendarDate(2027, 6, 30) },
    'matcher': { placeholder: sep5, isDateDisabled: d => d.month === 7, isDateUnavailable: d => d.month === 12 },
    'disabled': { placeholder: sep5, disabled: true, minValue: new CalendarDate(2020, 1, 1), maxValue: new CalendarDate(2030, 1, 1) },
    'custom paging by two years': { placeholder: sep5, nextPage: d => d.add({ years: 2 }), prevPage: d => d.subtract({ years: 2 }), minValue: new CalendarDate(2023, 1, 1), maxValue: new CalendarDate(2029, 12, 31) },
  }

  for (const [name, s] of Object.entries(scenarios)) {
    it(`matches on initial render and after paging: ${name}`, () => {
      withScope(() => {
        const { api: oldApi, placeholder: oldPh } = buildOldMonth(s)
        const { api: newApi, placeholder: newPh } = buildNew('month', s)

        const compare = () => {
          expect(cellStrings(newApi.grid.value)).toEqual([oldApi.grid.value.cells.map(c => c.toString())])
          expect(newApi.grid.value[0].rows.map(r => r.length)).toEqual(oldApi.grid.value.rows.map(r => r.length))
          expect(newApi.headingValue.value).toBe(oldApi.headingValue.value)
          expect(newApi.fullCalendarLabel.value).toBe(oldApi.fullCalendarLabel.value)
          expect(newApi.isNextButtonDisabled()).toBe(oldApi.isNextButtonDisabled())
          expect(newApi.isPrevButtonDisabled()).toBe(oldApi.isPrevButtonDisabled())
          for (const cell of newApi.grid.value[0].cells) {
            expect(newApi.isDateDisabled(cell)).toBe(oldApi.isMonthDisabled(cell))
            expect(newApi.isDateUnavailable(cell)).toBe(oldApi.isMonthUnavailable(cell))
          }
          expect(newApi.weekdays.value).toEqual([])
        }

        compare()
        oldApi.nextPage()
        newApi.nextPage()
        expect(newPh.value.toString()).toBe(oldPh.value.toString())
        compare()
        oldApi.prevPage()
        newApi.prevPage()
        oldApi.prevPage()
        newApi.prevPage()
        expect(newPh.value.toString()).toBe(oldPh.value.toString())
        compare()
      })
    })
  }

  it('follows an external placeholder change into another year', async () => {
    await withScope(async () => {
      const { api: oldApi, placeholder: oldPh } = buildOldMonth({ placeholder: sep5 })
      const { api: newApi, placeholder: newPh } = buildNew('month', { placeholder: sep5 })
      oldPh.value = new CalendarDate(2031, 4, 1)
      newPh.value = new CalendarDate(2031, 4, 1)
      await nextTick()
      expect(cellStrings(newApi.grid.value)).toEqual([oldApi.grid.value.cells.map(c => c.toString())])
      expect(newApi.headingValue.value).toBe('2031')
    })
  })
})

describe('useCalendarGrid — year view parity with useYearPicker', () => {
  const scenarios: Record<string, Scenario> = {
    'plain': { placeholder: sep5 },
    'twenty per page': { placeholder: sep5, yearsPerPage: 20 },
    'bounded': { placeholder: sep5, minValue: new CalendarDate(2015, 6, 1), maxValue: new CalendarDate(2040, 1, 1) },
    'matcher': { placeholder: sep5, isDateDisabled: d => d.year % 5 === 0, isDateUnavailable: d => d.year === 2027 },
    'disabled': { placeholder: sep5, disabled: true, minValue: new CalendarDate(1990, 1, 1), maxValue: new CalendarDate(2100, 1, 1) },
    'custom paging by a century': { placeholder: sep5, nextPage: d => d.add({ years: 100 }), prevPage: d => d.subtract({ years: 100 }), minValue: new CalendarDate(1900, 1, 1), maxValue: new CalendarDate(2200, 1, 1) },
  }

  for (const [name, s] of Object.entries(scenarios)) {
    it(`matches on initial render and after paging: ${name}`, () => {
      withScope(() => {
        const { api: oldApi, placeholder: oldPh } = buildOldYear(s)
        const { api: newApi, placeholder: newPh } = buildNew('year', s)

        const compare = () => {
          expect(cellStrings(newApi.grid.value)).toEqual([oldApi.grid.value.cells.map(c => c.toString())])
          expect(newApi.grid.value[0].value.toString()).toBe(oldApi.grid.value.value.toString())
          expect(newApi.headingValue.value).toBe(oldApi.headingValue.value)
          expect(newApi.fullCalendarLabel.value).toBe(oldApi.fullCalendarLabel.value)
          expect(newApi.isNextButtonDisabled()).toBe(oldApi.isNextButtonDisabled())
          expect(newApi.isPrevButtonDisabled()).toBe(oldApi.isPrevButtonDisabled())
          for (const cell of newApi.grid.value[0].cells) {
            expect(newApi.isDateDisabled(cell)).toBe(oldApi.isYearDisabled(cell))
            expect(newApi.isDateUnavailable(cell)).toBe(oldApi.isYearUnavailable(cell))
          }
        }

        compare()
        oldApi.nextPage()
        newApi.nextPage()
        expect(newPh.value.toString()).toBe(oldPh.value.toString())
        compare()
        oldApi.prevPage()
        newApi.prevPage()
        oldApi.prevPage()
        newApi.prevPage()
        expect(newPh.value.toString()).toBe(oldPh.value.toString())
        compare()
      })
    })
  }

  it('re-aligns to the decade when the placeholder leaves the page', async () => {
    await withScope(async () => {
      const { api: oldApi, placeholder: oldPh } = buildOldYear({ placeholder: sep5 })
      const { api: newApi, placeholder: newPh } = buildNew('year', { placeholder: sep5 })
      oldPh.value = new CalendarDate(2055, 1, 1)
      newPh.value = new CalendarDate(2055, 1, 1)
      await nextTick()
      expect(cellStrings(newApi.grid.value)).toEqual([oldApi.grid.value.cells.map(c => c.toString())])
      expect(newApi.grid.value[0].cells[0].toString()).toBe('2050-01-01')
    })
  })
})

describe('useCalendarGrid — switching unit', () => {
  it('rebuilds the grid for the new unit around the same placeholder', async () => {
    await withScope(async () => {
      const unit = ref<CalendarUnit>('day')
      const placeholder = ref(sep5) as any
      const api = useCalendarGrid({
        unit,
        placeholder,
        setPlaceholder: d => { placeholder.value = d },
        locale: 'en-US',
        weekStartsOn: 0,
      })
      expect(api.headingValue.value).toBe('September 2026')
      expect(api.rowLength.value).toBe(7)

      unit.value = 'month'
      await nextTick()
      expect(api.headingValue.value).toBe('2026')
      expect(api.grid.value[0].cells).toHaveLength(12)
      expect(api.rowLength.value).toBe(4)

      unit.value = 'year'
      await nextTick()
      expect(api.headingValue.value).toBe('2020 - 2031')
      expect(api.isOutsideVisibleView(new CalendarDate(2031, 12, 31))).toBe(false)
    })
  })

  it('passes the unit to matchers', () => {
    withScope(() => {
      const seen: CalendarUnit[] = []
      const placeholder = ref(sep5) as any
      const api = useCalendarGrid({
        unit: 'month',
        placeholder,
        setPlaceholder: () => {},
        locale: 'en-US',
        weekStartsOn: 0,
        isDateDisabled: (_d, unit) => {
          if (unit)
            seen.push(unit)
          return false
        },
      })
      api.isDateDisabled(sep5)
      expect(seen).toEqual(['month'])
    })
  })
})
