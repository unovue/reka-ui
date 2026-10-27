import type { DateValue } from '@internationalized/date'
import type { PropType } from 'vue'
import type { UseDatePickerProps, UseDatePickerReturn } from './useDatePicker'
import type { UseCalendarReturn } from '@/Calendar/useCalendar'
import type { UseDateFieldReturn } from '@/DateField'
import type { SegmentPart } from '@/shared/date'
import { CalendarDate, CalendarDateTime } from '@internationalized/date'
import userEvent from '@testing-library/user-event'
import { render } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { createSSRApp, defineComponent, effectScope, h, nextTick, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { useCalendar } from '@/Calendar/useCalendar'
import { useDateField } from '@/DateField'
import DatePicker from './story/_DatePicker.vue'
import { useDatePicker } from './useDatePicker'

/**
 * `useDatePicker()` composed standalone with `useDateField()` and
 * `useCalendar()` through `getFieldProps()` / `getCalendarProps()`, plus the
 * picker components' model bridges. Rendered behaviour is covered by
 * `DatePicker.test.ts` / `DatePickerViews.test.ts`.
 */

const jan20 = new CalendarDate(2024, 1, 20)

function withScope<T>(fn: () => T): T {
  return effectScope().run(fn)!
}

const Segment = defineComponent({
  props: {
    field: { type: Object as PropType<UseDateFieldReturn>, required: true },
    part: { type: String as PropType<SegmentPart>, required: true },
  },
  setup(props) {
    const surface = props.field.createInputSurface(() => props.part)
    return () => h('span', { 'data-testid': props.part, ...surface.attrs.value }, props.field.segments.value.find(s => s.part === props.part)?.value)
  },
})

const Cell = defineComponent({
  props: {
    calendar: { type: Object as PropType<UseCalendarReturn>, required: true },
    date: { type: Object as PropType<DateValue>, required: true },
    page: { type: Object as PropType<DateValue>, required: true },
  },
  setup(props) {
    const surface = props.calendar.getCellTriggerSurface(() => props.date, () => props.page)
    return () => h('td', { role: 'gridcell' }, [h('div', { 'data-testid': `date-${props.date.month}-${props.date.day}`, ...surface.attrs.value }, surface.cellValue.value)])
  },
})

function createStandalonePicker(options: UseDatePickerProps, expose?: (api: { picker: UseDatePickerReturn, field: UseDateFieldReturn, calendar: UseCalendarReturn }) => void) {
  return defineComponent({
    setup() {
      const parentElement = ref<HTMLElement>()
      const picker = useDatePicker({ baseId: 'picker', ...options })
      const field = useDateField({ ...picker.getFieldProps(), parentElement })
      const calendar = useCalendar(picker.getCalendarProps())
      expose?.({ picker, field, calendar })
      return () => h('div', [
        h('div', { 'ref': parentElement, 'aria-label': 'Date', 'data-testid': 'field', ...field.root.attrs.value }, [
          ...field.segments.value.map((segment, index) =>
            segment.part === 'literal'
              ? h('span', { 'key': `literal-${index}`, 'aria-hidden': 'true' }, segment.value)
              : h(Segment, { key: segment.part, field, part: segment.part }),
          ),
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

function setupStandalone(options: UseDatePickerProps) {
  let api!: { picker: UseDatePickerReturn, field: UseDateFieldReturn, calendar: UseCalendarReturn }
  const user = userEvent.setup()
  const rendered = render(createStandalonePicker(options, a => (api = a)))
  return { ...rendered, user, api: () => api }
}

describe('useDatePicker', () => {
  it('composes a field, a popover and a calendar standalone, and passes axe', async () => {
    const onUpdate = vi.fn()
    const onUpdateOpen = vi.fn()
    const { container, getByTestId, queryByTestId, user, api } = setupStandalone({ defaultValue: jan20, locale: 'en-US', onUpdate, onUpdateOpen })
    expect(getByTestId('day').textContent).toBe('20')
    expect(queryByTestId('content')).toBeNull()
    expect(await axe(container)).toHaveNoViolations()

    await user.click(getByTestId('trigger'))
    expect(onUpdateOpen).toHaveBeenLastCalledWith(true, expect.objectContaining({ reason: 'trigger-press' }))
    expect(getByTestId('content').getAttribute('role')).toBe('dialog')

    await user.click(getByTestId('date-1-10'))
    expect(onUpdate).toHaveBeenCalledTimes(1)
    expect(onUpdate).toHaveBeenLastCalledWith(new CalendarDate(2024, 1, 10), expect.objectContaining({ reason: 'cell-press' }))
    await nextTick()
    expect(getByTestId('day').textContent).toBe('10')
    expect(api().picker.lastChangeDetails.value.reason).toBe('cell-press')
  })

  it('routes a typed change through the picker once, with the field reason', async () => {
    const onUpdate = vi.fn()
    const { getByTestId, user, api } = setupStandalone({ defaultValue: jan20, locale: 'en-US', onUpdate })
    await user.click(getByTestId('day'))
    await user.keyboard('{ArrowUp}')
    expect(onUpdate).toHaveBeenCalledTimes(1)
    expect(onUpdate).toHaveBeenLastCalledWith(new CalendarDate(2024, 1, 21), expect.objectContaining({ reason: 'segment-increment' }))
    expect(api().picker.modelValue.value?.toString()).toBe('2024-01-21')
    await nextTick()
    expect(api().calendar.modelValue.value?.toString()).toBe('2024-01-21')
  })

  it('cancelling the picker change cancels the typed change and keeps the typed segments', async () => {
    const onUpdate = vi.fn()
    const { getByTestId, user, api } = setupStandalone({
      defaultValue: jan20,
      locale: 'en-US',
      onBeforeUpdate: (_value, details) => details.cancel(),
      onUpdate,
    })
    await user.click(getByTestId('day'))
    await user.keyboard('{ArrowUp}')
    await nextTick()
    expect(onUpdate).not.toHaveBeenCalled()
    expect(api().picker.modelValue.value?.toString()).toBe('2024-01-20')
    expect(getByTestId('day').textContent).toBe('21')
  })

  it('cancelling a calendar pick keeps the value', () => {
    withScope(() => {
      const onUpdate = vi.fn()
      const picker = useDatePicker({ defaultValue: jan20, locale: 'en-US', onBeforeUpdate: (_v, d) => d.cancel(), onUpdate })
      const calendar = useCalendar(picker.getCalendarProps())
      calendar.select(new CalendarDate(2024, 1, 5), 'cell-press')
      expect(onUpdate).not.toHaveBeenCalled()
      expect(picker.modelValue.value?.toString()).toBe('2024-01-20')
    })
  })

  it('is controllable; null is a controlled empty picker', () => {
    withScope(() => {
      const model = ref<DateValue | null>(jan20)
      const emit = vi.fn()
      const picker = useDatePicker({ modelValue: () => model.value, emit, locale: 'en-US' })
      expect(picker.isControlled.value).toBe(true)
      expect(picker.setModelValue(new CalendarDate(2024, 2, 2))).toBe(true)
      expect(emit).toHaveBeenCalledWith('beforeUpdate:modelValue', new CalendarDate(2024, 2, 2), expect.objectContaining({ reason: 'imperative-action' }))
      expect(emit).toHaveBeenCalledWith('update:modelValue', new CalendarDate(2024, 2, 2), expect.objectContaining({ reason: 'imperative-action' }))
      expect(picker.modelValue.value?.toString()).toBe('2024-01-20')
      model.value = null
      expect(picker.modelValue.value).toBeUndefined()

      const uncontrolled = useDatePicker({ defaultValue: jan20, locale: 'en-US' })
      expect(uncontrolled.isControlled.value).toBe(false)
      expect(uncontrolled.setModelValue(new CalendarDate(2024, 1, 20))).toBe(false)
      expect(uncontrolled.setModelValue(new CalendarDate(2024, 2, 2))).toBe(true)
      expect(uncontrolled.modelValue.value?.toString()).toBe('2024-02-02')
    })
  })

  it('closes on select with date-select and moves the placeholder with imperative-action', async () => {
    const onUpdateOpen = vi.fn()
    const onUpdatePlaceholder = vi.fn()
    const picker = withScope(() => useDatePicker({ defaultValue: jan20, defaultOpen: true, closeOnSelect: true, locale: 'en-US', onUpdateOpen, onUpdatePlaceholder }))
    picker.setModelValue(new CalendarDate(2024, 3, 1), 'cell-press')
    await nextTick()
    expect(picker.open.value).toBe(false)
    expect(onUpdateOpen).toHaveBeenLastCalledWith(false, expect.objectContaining({ reason: 'date-select' }))
    expect(onUpdatePlaceholder).toHaveBeenLastCalledWith(new CalendarDate(2024, 3, 1), expect.objectContaining({ reason: 'imperative-action' }))
  })

  it('hands locale and hour cycle to the field', async () => {
    const locale = ref('de-DE')
    const field = withScope(() => {
      const picker = useDatePicker({ defaultValue: new CalendarDateTime(2024, 1, 20, 14, 30), locale, hourCycle: 24 })
      return useDateField(picker.getFieldProps())
    })
    expect(field.editableSegments.value.map(s => s.part)).toEqual(['day', 'month', 'year', 'hour', 'minute'])
    expect(field.segments.value.find(s => s.part === 'hour')?.value).toBe('14')
    locale.value = 'en-US'
    await nextTick()
    expect(field.editableSegments.value.map(s => s.part).slice(0, 3)).toEqual(['month', 'day', 'year'])
  })

  describe('datePickerRoot', () => {
    it('emits beforeUpdate / update with the reason, once per change', async () => {
      const onBefore = vi.fn()
      const onUpdate = vi.fn()
      const user = userEvent.setup()
      const { getByTestId } = render(DatePicker, {
        props: { datePickerProps: { 'defaultValue': jan20, 'granularity': 'day', 'onBeforeUpdate:modelValue': onBefore, 'onUpdate:modelValue': onUpdate } as any },
      })
      await user.click(getByTestId('day'))
      await user.keyboard('{ArrowUp}')
      expect(onBefore).toHaveBeenCalledTimes(1)
      expect(onUpdate).toHaveBeenCalledTimes(1)
      expect(onUpdate).toHaveBeenLastCalledWith(new CalendarDate(2024, 1, 21), expect.objectContaining({ reason: 'segment-increment' }))

      await user.click(getByTestId('trigger'))
      await user.click(getByTestId('date-1-5'))
      expect(onUpdate).toHaveBeenLastCalledWith(new CalendarDate(2024, 1, 5), expect.objectContaining({ reason: 'cell-press' }))
    })

    it('a cancelled change keeps the value and the typed segments', async () => {
      const onUpdate = vi.fn()
      const user = userEvent.setup()
      const { getByTestId } = render(DatePicker, {
        props: { datePickerProps: { 'defaultValue': jan20, 'granularity': 'day', 'onBeforeUpdate:modelValue': (_v: unknown, d: { cancel: () => void }) => d.cancel(), 'onUpdate:modelValue': onUpdate } as any },
      })
      await user.click(getByTestId('day'))
      await user.keyboard('{ArrowUp}')
      await nextTick()
      expect(onUpdate).not.toHaveBeenCalled()
      expect(getByTestId('day').textContent?.trim()).toBe('21')
    })

    it('renders on the server', async () => {
      const html = await renderToString(createSSRApp(DatePicker, { datePickerProps: { defaultValue: jan20, granularity: 'day', locale: 'en-US' } }))
      expect(html).toContain('role="group"')
      expect(html).toContain('data-reka-date-field-segment="day"')
      expect(html).toMatch(/>\s*20\s*</)
    })

    it('renders the standalone composition on the server', async () => {
      const html = await renderToString(createSSRApp(createStandalonePicker({ defaultValue: jan20, defaultOpen: true, locale: 'en-US' })))
      expect(html).toContain('role="dialog"')
      expect(html).toContain('data-testid="date-1-20"')
    })
  })
})

describe('useDatePicker review fixes', () => {
  const minDate = new CalendarDate(2000, 1, 1)
  const noPastDates = (value: DateValue | undefined, details: { cancel: () => void }) => {
    if (value && value.compare(minDate) < 0)
      details.cancel()
  }

  it('a picker-root guard lets an empty field be typed to a valid date', async () => {
    const value = ref<DateValue | undefined>()
    const user = userEvent.setup()
    const { getByTestId } = render(DatePicker, {
      props: { datePickerProps: { 'granularity': 'day', 'locale': 'en-US', 'onBeforeUpdate:modelValue': noPastDates, 'onUpdate:modelValue': (v: DateValue | undefined) => (value.value = v) } as any },
    })
    await user.click(getByTestId('month'))
    await user.keyboard('01152024')
    await nextTick()
    expect(value.value?.toString()).toBe('2024-01-15')
  })

  it('a picker-root guard lets 2025 be typed over 2024', async () => {
    const onUpdate = vi.fn()
    const user = userEvent.setup()
    const { getByTestId } = render(DatePicker, {
      props: { datePickerProps: { 'defaultValue': new CalendarDate(2024, 1, 15), 'granularity': 'day', 'locale': 'en-US', 'onBeforeUpdate:modelValue': noPastDates, 'onUpdate:modelValue': onUpdate } as any },
    })
    await user.click(getByTestId('year'))
    await user.keyboard('2025')
    await nextTick()
    expect(onUpdate).toHaveBeenCalledTimes(1)
    expect(onUpdate.mock.lastCall![0].toString()).toBe('2025-01-15')
    expect(getByTestId('year').textContent?.trim()).toBe('2025')
  })

  it('a controlled-empty (null) picker keeps its calendar controlled', async () => {
    const user = userEvent.setup()
    const { getByTestId } = render(DatePicker, {
      props: {
        datePickerProps: { modelValue: null, defaultOpen: true, placeholder: new CalendarDate(2024, 1, 1), granularity: 'day' } as any,
        emits: { 'onUpdate:modelValue': () => {} },
      },
    })
    await nextTick()
    const cell = getByTestId('date-1-10')
    await user.click(cell)
    await nextTick()
    expect(cell.hasAttribute('data-selected')).toBe(false)
  })

  it('cancels a placeholder change through onBeforeUpdatePlaceholder', () => {
    withScope(() => {
      const onUpdatePlaceholder = vi.fn()
      const picker = useDatePicker({
        defaultPlaceholder: jan20,
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
