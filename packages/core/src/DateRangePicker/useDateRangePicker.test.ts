import type { DateValue } from '@internationalized/date'
import type { PropType } from 'vue'
import type { UseDateRangePickerProps, UseDateRangePickerReturn } from './useDateRangePicker'
import type { DateRangeType, UseDateRangeFieldReturn } from '@/DateRangeField'
import type { UseRangeCalendarReturn } from '@/RangeCalendar/useRangeCalendar'
import type { DateRange, SegmentPart } from '@/shared/date'
import { CalendarDate, CalendarDateTime } from '@internationalized/date'
import userEvent from '@testing-library/user-event'
import { render } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { createSSRApp, defineComponent, effectScope, h, nextTick, ref, shallowRef } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { useDateRangeField } from '@/DateRangeField'
import { useRangeCalendar } from '@/RangeCalendar/useRangeCalendar'
import DateRangePicker from './story/_DateRangePicker.vue'
import { useDateRangePicker } from './useDateRangePicker'

/**
 * `useDateRangePicker()` composed standalone with `useDateRangeField()` and
 * `useRangeCalendar()`, plus the picker components' model bridges. Rendered
 * behaviour is covered by `DateRangePicker.test.ts`.
 */

const range: DateRange = { start: new CalendarDate(2024, 1, 20), end: new CalendarDate(2024, 1, 25) }

function withScope<T>(fn: () => T): T {
  return effectScope().run(fn)!
}

const Segment = defineComponent({
  props: {
    field: { type: Object as PropType<UseDateRangeFieldReturn>, required: true },
    part: { type: String as PropType<SegmentPart>, required: true },
    type: { type: String as PropType<DateRangeType>, required: true },
  },
  setup(props) {
    const surface = props.field.createInputSurface(() => props.part, props.type)
    return () => h('span', { 'data-testid': `${props.type}-${props.part}`, ...surface.attrs.value }, props.field.segments.value[props.type].find(s => s.part === props.part)?.value)
  },
})

const Cell = defineComponent({
  props: {
    calendar: { type: Object as PropType<UseRangeCalendarReturn>, required: true },
    date: { type: Object as PropType<DateValue>, required: true },
    page: { type: Object as PropType<DateValue>, required: true },
  },
  setup(props) {
    const surface = props.calendar.getCellTriggerSurface(() => props.date, () => props.page)
    return () => h('td', { role: 'gridcell' }, [h('div', { 'data-testid': `date-${props.date.month}-${props.date.day}`, ...surface.attrs.value }, surface.cellValue.value)])
  },
})

interface Api { picker: UseDateRangePickerReturn, field: UseDateRangeFieldReturn, calendar: UseRangeCalendarReturn }

function createStandalonePicker(options: UseDateRangePickerProps, expose?: (api: Api) => void) {
  return defineComponent({
    setup() {
      const parentElement = ref<HTMLElement>()
      const picker = useDateRangePicker({ baseId: 'range-picker', ...options })
      const field = useDateRangeField({ ...picker.getFieldProps(), parentElement })
      const calendar = useRangeCalendar(picker.getCalendarProps())
      expose?.({ picker, field, calendar })
      const renderEnd = (type: DateRangeType) => field.segments.value[type].map((segment, index) =>
        segment.part === 'literal'
          ? h('span', { 'key': `${type}-literal-${index}`, 'aria-hidden': 'true' }, segment.value)
          : h(Segment, { key: `${type}-${segment.part}`, field, part: segment.part, type }),
      )
      return () => h('div', [
        h('div', { 'ref': parentElement, 'aria-label': 'Stay', 'data-testid': 'field', ...field.root.attrs.value }, [
          ...renderEnd('start'),
          h('span', { 'aria-hidden': 'true' }, ' - '),
          ...renderEnd('end'),
          h('button', { 'type': 'button', 'aria-label': 'Open calendar', 'data-testid': 'trigger', ...picker.popover.trigger.attrs.value }, 'Open'),
        ]),
        picker.open.value
          ? h('div', { 'data-testid': 'content', 'aria-label': 'Calendar', ...picker.popover.content.attrs.value }, [
              h('div', { ...calendar.root.attrs.value }, calendar.grid.value.map(month =>
                h('table', { key: month.value.toString(), role: 'grid', ...calendar.getGridSurface().attrs.value }, [
                  h('tbody', month.rows.map((week, index) =>
                    h('tr', { key: index }, week.map(date => h(Cell, { key: date.toString(), calendar, date, page: month.value }))),
                  )),
                ]),
              )),
            ])
          : null,
      ])
    },
  })
}

function setupStandalone(options: UseDateRangePickerProps) {
  let api!: Api
  const user = userEvent.setup()
  const rendered = render(createStandalonePicker(options, a => (api = a)))
  return { ...rendered, user, api: () => api }
}

describe('useDateRangePicker', () => {
  it('composes a field, a popover and a range calendar standalone, and passes axe', async () => {
    const onUpdate = vi.fn()
    const onUpdateStartValue = vi.fn()
    const { container, getByTestId, user, api } = setupStandalone({ defaultValue: range, locale: 'en-US', onUpdate, onUpdateStartValue })
    expect(getByTestId('end-day').textContent).toBe('25')
    expect(await axe(container)).toHaveNoViolations()

    await user.click(getByTestId('trigger'))
    expect(api().picker.open.value).toBe(true)

    await user.click(getByTestId('date-1-8'))
    expect(onUpdateStartValue).toHaveBeenLastCalledWith(new CalendarDate(2024, 1, 8), expect.objectContaining({ reason: 'cell-press' }))
    await user.click(getByTestId('date-1-12'))
    const [value, details] = onUpdate.mock.lastCall!
    expect(value.start.toString()).toBe('2024-01-08')
    expect(value.end.toString()).toBe('2024-01-12')
    expect(details.reason).toBe('cell-press')
    await nextTick()
    expect(getByTestId('start-day').textContent).toBe('8')
    expect(getByTestId('end-day').textContent).toBe('12')
  })

  it('routes a typed change through the picker once, with the field reason', async () => {
    const onUpdate = vi.fn()
    const { getByTestId, user, api } = setupStandalone({ defaultValue: range, locale: 'en-US', onUpdate })
    await user.click(getByTestId('end-day'))
    await user.keyboard('{ArrowUp}')
    expect(onUpdate).toHaveBeenCalledTimes(1)
    const [value, details] = onUpdate.mock.lastCall!
    expect(value.end.toString()).toBe('2024-01-26')
    expect(details.reason).toBe('segment-increment')
    expect(api().picker.modelValue.value.end?.toString()).toBe('2024-01-26')
  })

  it('cancelling the picker change cancels the typed change and keeps the typed segments', async () => {
    const onUpdate = vi.fn()
    const { getByTestId, user, api } = setupStandalone({
      defaultValue: range,
      locale: 'en-US',
      onBeforeUpdate: (_value, details) => details.cancel(),
      onUpdate,
    })
    await user.click(getByTestId('start-day'))
    await user.keyboard('{ArrowUp}')
    await nextTick()
    expect(onUpdate).not.toHaveBeenCalled()
    expect(api().picker.modelValue.value.start?.toString()).toBe('2024-01-20')
    expect(getByTestId('start-day').textContent).toBe('21')
  })

  it('is controllable; null is a controlled empty range', () => {
    withScope(() => {
      const model = shallowRef<DateRange | null>(range)
      const emit = vi.fn()
      const picker = useDateRangePicker({ modelValue: () => model.value, emit, locale: 'en-US' })
      expect(picker.isControlled.value).toBe(true)
      const next = { start: new CalendarDate(2024, 2, 1), end: new CalendarDate(2024, 2, 3) }
      expect(picker.setModelValue(next)).toBe(true)
      expect(emit).toHaveBeenCalledWith('beforeUpdate:modelValue', next, expect.objectContaining({ reason: 'imperative-action' }))
      expect(emit).toHaveBeenCalledWith('update:modelValue', next, expect.objectContaining({ reason: 'imperative-action' }))
      expect(picker.modelValue.value.start?.toString()).toBe('2024-01-20')
      model.value = null
      expect(picker.modelValue.value).toEqual({ start: undefined, end: undefined })

      const uncontrolled = useDateRangePicker({ defaultValue: range, locale: 'en-US' })
      expect(uncontrolled.isControlled.value).toBe(false)
      expect(uncontrolled.setModelValue({ start: new CalendarDate(2024, 1, 20), end: new CalendarDate(2024, 1, 25) })).toBe(false)
      expect(uncontrolled.setModelValue(next)).toBe(true)
      expect(uncontrolled.modelValue.value.end?.toString()).toBe('2024-02-03')
    })
  })

  it('cancelling beforeUpdate:startValue suppresses only update:startValue', async () => {
    const emit = vi.fn((event: string, _value: unknown, details?: { cancel: () => void }) => {
      if (event === 'beforeUpdate:startValue')
        details?.cancel()
    })
    const { picker, calendar } = withScope(() => {
      const picker = useDateRangePicker({ defaultValue: range, emit, locale: 'en-US' })
      return { picker, calendar: useRangeCalendar(picker.getCalendarProps()) }
    })
    calendar.select(new CalendarDate(2024, 1, 8), 'cell-press')
    await nextTick()
    // A pointer hovers the end before pressing it (it highlights the range).
    calendar.setFocusedValue(new CalendarDate(2024, 1, 12))
    calendar.select(new CalendarDate(2024, 1, 12), 'cell-press')
    await nextTick()
    expect(emit).toHaveBeenCalledWith('beforeUpdate:startValue', new CalendarDate(2024, 1, 8), expect.objectContaining({ reason: 'cell-press' }))
    expect(emit.mock.calls.some(([event]) => event === 'update:startValue')).toBe(false)
    expect(picker.modelValue.value.start?.toString()).toBe('2024-01-08')
    expect(picker.modelValue.value.end?.toString()).toBe('2024-01-12')
  })

  it('closes on select with date-select once both ends are set', async () => {
    const onUpdateOpen = vi.fn()
    const picker = withScope(() => useDateRangePicker({ defaultOpen: true, closeOnSelect: true, locale: 'en-US', onUpdateOpen }))
    picker.setModelValue({ start: new CalendarDate(2024, 3, 1), end: undefined }, 'cell-press')
    await nextTick()
    expect(picker.open.value).toBe(true)
    picker.setModelValue({ start: new CalendarDate(2024, 3, 1), end: new CalendarDate(2024, 3, 4) }, 'cell-press')
    await nextTick()
    expect(picker.open.value).toBe(false)
    expect(onUpdateOpen).toHaveBeenLastCalledWith(false, expect.objectContaining({ reason: 'date-select' }))
  })

  it('hands locale, hour cycle and stepSnapping to the field', async () => {
    const locale = ref('de-DE')
    const field = withScope(() => {
      const picker = useDateRangePicker({
        defaultValue: { start: new CalendarDateTime(2024, 1, 20, 14, 30), end: new CalendarDateTime(2024, 1, 21, 9, 0) },
        locale,
        hourCycle: 24,
        stepSnapping: true,
      })
      return useDateRangeField(picker.getFieldProps())
    })
    expect(field.editableSegments.value.start.map(s => s.part)).toEqual(['day', 'month', 'year', 'hour', 'minute'])
    expect(field.segments.value.start.find(s => s.part === 'hour')?.value).toBe('14')
    expect(field.context.stepSnapping.value).toBe(true)
    locale.value = 'en-US'
    await nextTick()
    expect(field.editableSegments.value.end.map(s => s.part).slice(0, 3)).toEqual(['month', 'day', 'year'])
  })

  describe('dateRangePickerRoot', () => {
    it('emits update:startValue and update:modelValue with details from the calendar', async () => {
      const onStart = vi.fn()
      const onUpdate = vi.fn()
      const user = userEvent.setup()
      const { getByTestId } = render(DateRangePicker, {
        props: { dateFieldProps: { 'defaultValue': range, 'granularity': 'day', 'onUpdate:startValue': onStart, 'onUpdate:modelValue': onUpdate } as any },
      })
      await user.click(getByTestId('trigger'))
      await user.click(getByTestId('date-1-8'))
      expect(onStart).toHaveBeenLastCalledWith(new CalendarDate(2024, 1, 8), expect.objectContaining({ reason: 'cell-press' }))
      await user.click(getByTestId('date-1-12'))
      const [value, details] = onUpdate.mock.lastCall!
      expect(value.end.toString()).toBe('2024-01-12')
      expect(details.reason).toBe('cell-press')
    })

    it('a cancelled change keeps the value and the typed segments', async () => {
      const onUpdate = vi.fn()
      const user = userEvent.setup()
      const { getByTestId } = render(DateRangePicker, {
        props: { dateFieldProps: { 'defaultValue': range, 'granularity': 'day', 'onBeforeUpdate:modelValue': (_v: unknown, d: { cancel: () => void }) => d.cancel(), 'onUpdate:modelValue': onUpdate } as any },
      })
      await user.click(getByTestId('end-day'))
      await user.keyboard('{ArrowUp}')
      await nextTick()
      expect(onUpdate).not.toHaveBeenCalled()
      expect(getByTestId('end-day').textContent?.trim()).toBe('26')
    })

    it('renders on the server', async () => {
      const html = await renderToString(createSSRApp(DateRangePicker, { dateFieldProps: { defaultValue: range, granularity: 'day', locale: 'en-US' } }))
      expect(html).toContain('role="group"')
      expect(html).toContain('data-reka-date-range-field-segment-type="end"')
    })

    it('renders the standalone composition on the server', async () => {
      const html = await renderToString(createSSRApp(createStandalonePicker({ defaultValue: range, defaultOpen: true, locale: 'en-US' })))
      expect(html).toContain('role="dialog"')
      expect(html).toContain('data-testid="date-1-25"')
    })
  })
})

describe('useDateRangePicker review fixes', () => {
  it('a press is compared with the real start, not the last emitted one', async () => {
    const onUpdateStartValue = vi.fn()
    const picker = withScope(() => useDateRangePicker({ defaultValue: range, locale: 'en-US', onUpdateStartValue }))

    // Open: press Jan 8, then close (the calendar unmounts).
    const first = effectScope()
    const calendar = first.run(() => useRangeCalendar(picker.getCalendarProps()))!
    calendar.select(new CalendarDate(2024, 1, 8), 'cell-press')
    await nextTick()
    expect(onUpdateStartValue).toHaveBeenLastCalledWith(new CalendarDate(2024, 1, 8), expect.objectContaining({ reason: 'cell-press' }))
    first.stop()

    // The field moves the range while the popover is closed.
    picker.setModelValue({ start: new CalendarDate(2024, 1, 3), end: new CalendarDate(2024, 1, 12) }, 'segment-input')
    await nextTick()
    expect(picker.startValue.value?.toString()).toBe('2024-01-03')

    // Reopen and press Jan 8 again: a real change, so it is emitted.
    onUpdateStartValue.mockClear()
    const reopened = withScope(() => useRangeCalendar(picker.getCalendarProps()))
    reopened.select(new CalendarDate(2024, 1, 8), 'cell-press')
    await nextTick()
    expect(onUpdateStartValue).toHaveBeenCalledWith(new CalendarDate(2024, 1, 8), expect.objectContaining({ reason: 'cell-press' }))
    expect(picker.startValue.value?.toString()).toBe('2024-01-08')
  })

  it('cancels a placeholder change through onBeforeUpdatePlaceholder', () => {
    withScope(() => {
      const onUpdatePlaceholder = vi.fn()
      const picker = useDateRangePicker({
        defaultValue: range,
        locale: 'en-US',
        onBeforeUpdatePlaceholder: (_value, details) => details.cancel(),
        onUpdatePlaceholder,
      })
      expect(picker.setPlaceholder(new CalendarDate(2024, 5, 1))).toBe(false)
      expect(onUpdatePlaceholder).not.toHaveBeenCalled()
      expect(picker.placeholder.value.toString()).toBe('2024-01-20')
    })
  })
})
