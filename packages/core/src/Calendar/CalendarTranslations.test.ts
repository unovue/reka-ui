import type { CalendarUnit } from '@/date'
import { render } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { effectScope, h } from 'vue'
import { ConfigProvider } from '@/ConfigProvider'
import { DateFieldInput, DateFieldRoot } from '@/DateField'
import { RangeCalendarNext, RangeCalendarPrev, RangeCalendarRoot } from '@/RangeCalendar'
import { CalendarNext, CalendarPrev, CalendarRoot, useCalendar } from '.'

// The built-in labels of the date families come from the nearest ConfigProvider's translations (#3418).

const date = new Temporal.PlainDate(2024, 1, 15)

const translations = {
  calendarLabel: 'Termin',
  monthPickerLabel: 'Monatsauswahl',
  yearPickerLabel: 'Jahresauswahl',
  calendarPrev: 'Zurück',
  calendarNext: 'Weiter',
  dateFieldDay: 'Tag',
  dateFieldMonth: 'Monat',
  dateFieldYear: 'Jahr',
  dateFieldEmpty: 'Leer',
}

function renderUnder(content: () => any, withTranslations = true) {
  return render(() => withTranslations ? h(ConfigProvider, { translations }, content) : content())
}

describe('calendar translations', () => {
  it.each([
    ['day', 'Termin, January 2024'],
    ['month', 'Monatsauswahl, 2024'],
    ['year', 'Jahresauswahl, 2020 - 2031'],
  ] as [CalendarUnit, string][])('names the %s view and its buttons from the messages', (granularity, label) => {
    const { container } = renderUnder(() => h(CalendarRoot, { 'data-root': '', 'defaultPlaceholder': date, 'locale': 'en', granularity }, () => [
      h(CalendarPrev, { 'data-prev': '' }),
      h(CalendarNext, { 'data-next': '' }),
    ]))
    expect(container.querySelector('[data-root]')).toHaveAttribute('aria-label', label)
    expect(container.querySelector('[data-prev]')).toHaveAttribute('aria-label', 'Zurück')
    expect(container.querySelector('[data-next]')).toHaveAttribute('aria-label', 'Weiter')
  })

  it('keeps the English defaults without a provider', () => {
    const { container } = renderUnder(() => h(CalendarRoot, { 'data-root': '', 'defaultPlaceholder': date, 'locale': 'en', 'granularity': 'month' }, () => [
      h(CalendarPrev, { 'data-prev': '' }),
    ]), false)
    expect(container.querySelector('[data-root]')).toHaveAttribute('aria-label', 'Month Picker, 2024')
    expect(container.querySelector('[data-prev]')).toHaveAttribute('aria-label', 'Previous page')
  })

  it('lets calendarLabel and a consumer aria-label win', () => {
    const { container } = renderUnder(() => h(CalendarRoot, { 'data-root': '', 'defaultPlaceholder': date, 'locale': 'en', 'calendarLabel': 'Abflug' }, () => [
      h(CalendarNext, { 'data-next': '', 'aria-label': 'Später' }),
    ]))
    expect(container.querySelector('[data-root]')).toHaveAttribute('aria-label', 'Abflug, January 2024')
    expect(container.querySelector('[data-next]')).toHaveAttribute('aria-label', 'Später')
  })

  it('names the RangeCalendar and its buttons from the messages', () => {
    const { container } = renderUnder(() => h(RangeCalendarRoot, { 'data-root': '', 'defaultPlaceholder': date, 'locale': 'en' }, () => [
      h(RangeCalendarPrev, { 'data-prev': '' }),
      h(RangeCalendarNext, { 'data-next': '' }),
    ]))
    expect(container.querySelector('[data-root]')).toHaveAttribute('aria-label', 'Termin, January 2024')
    expect(container.querySelector('[data-prev]')).toHaveAttribute('aria-label', 'Zurück')
    expect(container.querySelector('[data-next]')).toHaveAttribute('aria-label', 'Weiter')
  })

  it('names the segments of a date field from the messages', () => {
    const { container } = renderUnder(() => h(DateFieldRoot, { locale: 'en' }, {
      default: ({ segments }: { segments: { part: string }[] }) => segments.map(item => h(DateFieldInput, { 'part': item.part as any, 'data-part': item.part })),
    }))
    expect(container.querySelector('[data-part="day"]')).toHaveAttribute('aria-label', 'Tag')
    expect(container.querySelector('[data-part="month"]')).toHaveAttribute('aria-label', 'Monat')
    expect(container.querySelector('[data-part="year"]')).toHaveAttribute('aria-label', 'Jahr')
    expect(container.querySelector('[data-part="day"]')).toHaveAttribute('aria-valuetext', 'Leer')
  })

  it('falls back to the English labels when useCalendar runs outside a component', () => {
    const scope = effectScope()
    const api = scope.run(() => useCalendar({ defaultPlaceholder: date, locale: 'en', weekStartsOn: 0 }))!
    expect(api.fullCalendarLabel.value).toBe('Event Date, January 2024')
    expect(api.prev.attrs.value['aria-label']).toBe('Previous page')
    scope.stop()
  })
})
