import type { PropType } from 'vue'
import type { UseTimeRangeFieldProps, UseTimeRangeFieldReturn } from './useTimeRangeField'
import type { DateRangeType } from '@/DateRangeField'
import type { SegmentPart, TimeRange } from '@/shared/date'
import userEvent from '@testing-library/user-event'
import { render } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { createSSRApp, defineComponent, effectScope, h, nextTick, ref, shallowRef } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { useTimeRangeField } from './useTimeRangeField'

/**
 * Standalone `useTimeRangeField()`. The rendered component behaviour is
 * covered by `TimeRangeField.test.ts`.
 */

const range: TimeRange = { start: new Temporal.PlainTime(10, 0), end: new Temporal.PlainTime(12, 30) }

function withScope<T>(fn: () => T): T {
  return effectScope().run(fn)!
}

const Segment = defineComponent({
  props: {
    api: { type: Object as PropType<UseTimeRangeFieldReturn>, required: true },
    part: { type: String as PropType<SegmentPart>, required: true },
    type: { type: String as PropType<DateRangeType>, required: true },
  },
  setup(props) {
    const surface = props.api.createInputSurface(() => props.part, props.type)
    return () => h('span', { 'data-testid': `${props.type}-${props.part}`, ...surface.attrs.value }, props.api.segments.value[props.type].find(s => s.part === props.part)?.value)
  },
})

function createStandaloneField(options: UseTimeRangeFieldProps, expose?: (api: UseTimeRangeFieldReturn) => void) {
  return defineComponent({
    setup() {
      const parentElement = ref<HTMLElement>()
      const api = useTimeRangeField({ ...options, parentElement })
      expose?.(api)
      const renderEnd = (type: DateRangeType) => api.segments.value[type].map((segment, index) =>
        segment.part === 'literal'
          ? h('span', { 'key': `${type}-literal-${index}`, 'aria-hidden': 'true' }, segment.value)
          : h(Segment, { key: `${type}-${segment.part}`, api, part: segment.part, type }),
      )
      return () => h('div', { 'ref': parentElement, 'aria-label': 'Opening hours', 'data-testid': 'root', ...api.root.attrs.value }, [
        ...renderEnd('start'),
        h('span', { 'aria-hidden': 'true' }, ' - '),
        ...renderEnd('end'),
      ])
    },
  })
}

function setup(options: UseTimeRangeFieldProps) {
  let api!: UseTimeRangeFieldReturn
  const user = userEvent.setup()
  const rendered = render(createStandaloneField(options, a => (api = a)))
  return { ...rendered, user, api: () => api }
}

describe('useTimeRangeField', () => {
  it('renders standalone and passes axe', async () => {
    const { container, getByTestId } = setup({ defaultValue: range, locale: 'en-US' })
    expect(getByTestId('root').getAttribute('role')).toBe('group')
    expect(getByTestId('end-minute').textContent).toBe('30')
    expect(getByTestId('end-minute').getAttribute('data-reka-time-range-field-segment-type')).toBe('end')
    expect(await axe(container)).toHaveNoViolations()
  })

  it('commits a Time range with the segment reason', async () => {
    const onUpdate = vi.fn()
    const { getByTestId, user } = setup({ defaultValue: range, locale: 'en-US', onUpdate })
    await user.click(getByTestId('start-minute'))
    await user.keyboard('{ArrowUp}')
    let [value, details] = onUpdate.mock.lastCall!
    expect(value.start).toBeInstanceOf(Temporal.PlainTime)
    expect(value.start.toString()).toBe('10:01:00')
    expect(value.end.toString()).toBe('12:30:00')
    expect(details.reason).toBe('segment-increment')

    await user.keyboard('{ArrowDown}')
    expect(onUpdate.mock.lastCall![1].reason).toBe('segment-decrement')
    await user.keyboard('{Backspace}{Backspace}')
    ;[value, details] = onUpdate.mock.lastCall!
    expect(value.start).toBeUndefined()
    expect(details.reason).toBe('segment-clear')
    await user.keyboard('45')
    expect(onUpdate.mock.lastCall![0].start.toString()).toBe('10:45:00')
    expect(onUpdate.mock.lastCall![1].reason).toBe('segment-input')
  })

  it('snaps to the step on the range fields too (stepSnapping)', async () => {
    const onUpdate = vi.fn()
    const { getByTestId, user } = setup({
      defaultValue: range,
      granularity: 'second',
      step: { minute: 15 },
      stepSnapping: true,
      locale: 'en-US',
      onUpdate,
    })
    await user.click(getByTestId('end-minute'))
    await user.keyboard('{2}{3}')
    const [value, details] = onUpdate.mock.lastCall!
    expect(value.end.minute).toBe(30)
    expect(details.reason).toBe('step-snap')
  })

  it('a cancelled typed change keeps the model and the typed segments', async () => {
    const onUpdate = vi.fn()
    const { getByTestId, user, api } = setup({
      defaultValue: range,
      locale: 'en-US',
      onBeforeUpdate: (_value, details) => details.cancel(),
      onUpdate,
    })
    await user.click(getByTestId('end-minute'))
    await user.keyboard('{ArrowUp}')
    await nextTick()
    expect(onUpdate).not.toHaveBeenCalled()
    expect(api().modelValue.value.end?.toString()).toBe('12:30:00')
    expect(getByTestId('end-minute').textContent).toBe('31')
  })

  it('is controllable; null is a controlled empty range', () => {
    withScope(() => {
      const model = shallowRef<TimeRange | null>(range)
      const emit = vi.fn()
      const api = useTimeRangeField({ modelValue: () => model.value, emit, locale: 'en-US' })
      expect(api.isControlled.value).toBe(true)
      api.setModelValue({ start: new Temporal.PlainTime(8), end: new Temporal.PlainTime(9) })
      expect(emit).toHaveBeenCalledWith('update:modelValue', { start: new Temporal.PlainTime(8), end: new Temporal.PlainTime(9) }, expect.objectContaining({ reason: 'imperative-action' }))
      expect(api.modelValue.value.start?.toString()).toBe('10:00:00')
      model.value = null
      expect(api.modelValue.value).toEqual({ start: undefined, end: undefined })

      const uncontrolled = useTimeRangeField({ defaultValue: range, locale: 'en-US' })
      expect(uncontrolled.isControlled.value).toBe(false)
      expect(uncontrolled.setModelValue({ start: new Temporal.PlainTime(10, 0), end: new Temporal.PlainTime(12, 30) })).toBe(false)
      expect(uncontrolled.setModelValue({ start: new Temporal.PlainTime(8), end: new Temporal.PlainTime(9) })).toBe(true)
      expect(uncontrolled.modelValue.value.start?.toString()).toBe('08:00:00')
    })
  })

  it('validates order, bounds and isTimeUnavailable', () => {
    withScope(() => {
      expect(useTimeRangeField({ defaultValue: range, locale: 'en-US' }).isInvalid.value).toBe(false)
      expect(useTimeRangeField({ defaultValue: { start: range.end, end: range.start }, locale: 'en-US' }).isInvalid.value).toBe(true)
      expect(useTimeRangeField({ defaultValue: range, maxValue: new Temporal.PlainTime(12), locale: 'en-US' }).isInvalid.value).toBe(true)
      const api = useTimeRangeField({ defaultValue: range, isTimeUnavailable: (d: any) => d.hour === 12, locale: 'en-US' })
      expect(api.isInvalid.value).toBe(true)
      expect(api.root.attrs.value['data-invalid']).toBe('')
    })
  })

  describe('unavailable times between the ends', () => {
    const t = (hour: number, minute = 0, second = 0) => new Temporal.PlainTime(hour, minute, second)
    const at = (hour: number, minute = 0, second = 0) => (d: any) => d.hour === hour && d.minute === minute && d.second === second
    const invalid = (options: UseTimeRangeFieldProps) => withScope(() => useTimeRangeField({ locale: 'en-US', ...options }).isInvalid.value)

    it('is invalid when a time strictly inside the range is unavailable', () => {
      withScope(() => {
        const api = useTimeRangeField({ defaultValue: { start: t(9), end: t(17) }, isTimeUnavailable: (d: any) => d.hour === 12, locale: 'en-US' })
        expect(api.isInvalid.value).toBe(true)
        expect(api.root.attrs.value['data-invalid']).toBe('')
      })
    })

    it('is valid when the range only touches the unavailable time', () => {
      const lunch = (d: any) => d.hour === 12
      expect(invalid({ defaultValue: { start: t(9), end: t(11, 59) }, isTimeUnavailable: lunch })).toBe(false)
      expect(invalid({ defaultValue: { start: t(13), end: t(17) }, isTimeUnavailable: lunch })).toBe(false)
      expect(invalid({ defaultValue: { start: t(9), end: t(12, 29) }, isTimeUnavailable: at(12, 30) })).toBe(false)
      expect(invalid({ defaultValue: { start: t(12, 31), end: t(17) }, isTimeUnavailable: at(12, 30) })).toBe(false)
      expect(invalid({ defaultValue: { start: t(9), end: t(17) }, isTimeUnavailable: at(12, 30) })).toBe(true)
    })

    it('checks every hour at hour granularity', () => {
      const value = { start: t(9), end: t(17) }
      expect(invalid({ defaultValue: value, granularity: 'hour', isTimeUnavailable: at(12) })).toBe(true)
      expect(invalid({ defaultValue: value, granularity: 'hour', isTimeUnavailable: at(12, 30) })).toBe(false)
      const calls = vi.fn(() => false)
      expect(invalid({ defaultValue: { start: t(0), end: t(23) }, granularity: 'hour', isTimeUnavailable: calls })).toBe(false)
      // Both ends, then 01:00 to 22:00.
      expect(calls).toHaveBeenCalledTimes(2 + 22)
    })

    it('checks every minute at minute granularity', () => {
      const value = { start: t(10), end: t(10, 2) }
      expect(invalid({ defaultValue: value, isTimeUnavailable: at(10, 1) })).toBe(true)
      expect(invalid({ defaultValue: value, isTimeUnavailable: at(10, 0, 30) })).toBe(false)
      const calls = vi.fn(() => false)
      expect(invalid({ defaultValue: { start: t(0), end: t(23, 59) }, isTimeUnavailable: calls })).toBe(false)
      expect(calls).toHaveBeenCalledTimes(2 + 1438)
    })

    it('checks every second at second granularity, and never more than 1,440 times', () => {
      expect(invalid({ defaultValue: { start: t(10), end: t(10, 1) }, granularity: 'second', isTimeUnavailable: at(10, 0, 30) })).toBe(true)
      const calls = vi.fn(() => false)
      const fullDay = { start: t(0), end: t(23, 59, 59) }
      expect(invalid({ defaultValue: fullDay, granularity: 'second', isTimeUnavailable: calls })).toBe(false)
      // A full day of seconds is sampled once a minute.
      expect(calls).toHaveBeenCalledTimes(2 + 1439)
      expect(invalid({ defaultValue: fullDay, granularity: 'second', isTimeUnavailable: at(12, 30) })).toBe(true)
      expect(invalid({ defaultValue: fullDay, granularity: 'second', isTimeUnavailable: at(12, 30, 30) })).toBe(false)
    })

    it('checks every unit of the granularity, whatever the step', () => {
      const value = { start: t(9, 7), end: t(9, 11) }
      const seen: string[] = []
      const record = (d: any) => {
        seen.push(d.toPlainTime().toString({ smallestUnit: 'minute' }))
        return false
      }
      expect(invalid({ defaultValue: value, step: { minute: 15 }, isTimeUnavailable: record })).toBe(false)
      expect(seen).toEqual(['09:07', '09:11', '09:08', '09:09', '09:10'])
      // A time the step skips is still inside the range.
      const stepped = { start: t(9), end: t(9, 30) }
      expect(invalid({ defaultValue: stepped, step: { minute: 30 }, isTimeUnavailable: at(9, 20) })).toBe(true)
      expect(invalid({ defaultValue: stepped, step: { minute: 30 }, isTimeUnavailable: at(9, 40) })).toBe(false)
    })

    it('caps a range of date-times spanning several days', () => {
      const calls = vi.fn(() => false)
      const value = { start: new Temporal.PlainDateTime(2024, 1, 1, 9), end: new Temporal.PlainDateTime(2024, 1, 11, 9) }
      expect(invalid({ defaultValue: value, isTimeUnavailable: calls })).toBe(false)
      expect(calls.mock.calls.length).toBeLessThanOrEqual(2 + 1440)
      expect(invalid({ defaultValue: value, isTimeUnavailable: (d: any) => d.day === 5 })).toBe(true)
    })

    it('checks zoned ends', () => {
      const zone = 'America/New_York'
      const value = {
        start: new Temporal.PlainDateTime(2024, 1, 1, 9).toZonedDateTime(zone),
        end: new Temporal.PlainDateTime(2024, 1, 1, 17).toZonedDateTime(zone),
      }
      expect(invalid({ defaultValue: value, isTimeUnavailable: (d: any) => d.hour === 12 && d.timeZoneId === zone })).toBe(true)
      expect(invalid({ defaultValue: value, isTimeUnavailable: (d: any) => d.hour === 18 })).toBe(false)
    })

    it('does not look between the ends without a complete, ordered range', () => {
      const calls = vi.fn(() => false)
      expect(invalid({ defaultValue: { start: t(9), end: undefined }, isTimeUnavailable: calls })).toBe(false)
      expect(calls).toHaveBeenCalledTimes(1)
      calls.mockClear()
      // An end before the start is invalid on its own, as before.
      expect(invalid({ defaultValue: { start: t(17), end: t(9) }, isTimeUnavailable: calls })).toBe(true)
      expect(calls).toHaveBeenCalledTimes(2)
      calls.mockClear()
      expect(invalid({ defaultValue: { start: t(9), end: t(9) }, isTimeUnavailable: calls })).toBe(false)
      expect(calls).toHaveBeenCalledTimes(2)
    })

    it('is valid without a matcher', () => {
      expect(invalid({ defaultValue: { start: t(9), end: t(17) } })).toBe(false)
      expect(invalid({ defaultValue: { start: t(0), end: t(23, 59, 59) }, granularity: 'second' })).toBe(false)
    })

    it('allowNonContiguousRanges keeps the check to the two ends', () => {
      const value = { start: t(9), end: t(17) }
      const calls = vi.fn((d: any) => d.hour === 12)
      expect(invalid({ defaultValue: value, isTimeUnavailable: calls, allowNonContiguousRanges: true })).toBe(false)
      expect(calls).toHaveBeenCalledTimes(2)
      expect(invalid({ defaultValue: { start: t(9), end: t(12) }, isTimeUnavailable: calls, allowNonContiguousRanges: true })).toBe(true)

      const allow = ref(true)
      withScope(() => {
        const api = useTimeRangeField({ defaultValue: value, isTimeUnavailable: calls, allowNonContiguousRanges: allow, locale: 'en-US' })
        expect(api.isInvalid.value).toBe(false)
        allow.value = false
        expect(api.isInvalid.value).toBe(true)
      })
    })

    it('follows the value', () => {
      withScope(() => {
        const api = useTimeRangeField({ defaultValue: { start: t(9), end: t(11) }, isTimeUnavailable: (d: any) => d.hour === 12, locale: 'en-US' })
        expect(api.isInvalid.value).toBe(false)
        api.setModelValue({ start: t(9), end: t(17) })
        expect(api.isInvalid.value).toBe(true)
        api.setModelValue({ start: t(13), end: t(17) })
        expect(api.isInvalid.value).toBe(false)
      })
    })
  })

  it('follows the hour cycle and the locale', async () => {
    const locale = ref('en-US')
    const pm = { start: new Temporal.PlainTime(14), end: new Temporal.PlainTime(16) }
    const api = withScope(() => useTimeRangeField({ defaultValue: pm, locale }))
    expect(api.editableSegments.value.start.map(s => s.part)).toContain('dayPeriod')
    expect(api.segments.value.start.find(s => s.part === 'hour')?.value).toBe('2')
    locale.value = 'de-DE'
    await nextTick()
    expect(api.editableSegments.value.start.map(s => s.part)).not.toContain('dayPeriod')

    const h12 = withScope(() => useTimeRangeField({ defaultValue: pm, locale: 'de-DE', hourCycle: 12 }))
    expect(h12.editableSegments.value.end.map(s => s.part)).toContain('dayPeriod')
  })

  it('renders on the server', async () => {
    const html = await renderToString(createSSRApp(createStandaloneField({ defaultValue: range, locale: 'en-US' })))
    expect(html).toContain('role="group"')
    expect(html).toContain('data-reka-time-range-field-segment-type="start"')
    expect(html).toContain('>30<')
  })
})
