import type { PropType } from 'vue'
import type { DateRangeType } from './DateRangeFieldRoot.vue'
import type { UseDateRangeFieldProps, UseDateRangeFieldReturn } from './useDateRangeField'
import type { DateRange, SegmentPart } from '@/shared/date'
import { CalendarDate, CalendarDateTime } from '@internationalized/date'
import userEvent from '@testing-library/user-event'
import { render } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { createSSRApp, defineComponent, effectScope, h, nextTick, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { useDateRangeField } from './useDateRangeField'

/**
 * Standalone `useDateRangeField()`. The rendered component behaviour is
 * covered by `DateRangeField.test.ts`.
 */

const range: DateRange = { start: new CalendarDate(2024, 1, 20), end: new CalendarDate(2024, 1, 25) }

function withScope<T>(fn: () => T): T {
  return effectScope().run(fn)!
}

const Segment = defineComponent({
  props: {
    api: { type: Object as PropType<UseDateRangeFieldReturn>, required: true },
    part: { type: String as PropType<SegmentPart>, required: true },
    type: { type: String as PropType<DateRangeType>, required: true },
  },
  setup(props) {
    const surface = props.api.createInputSurface(() => props.part, props.type)
    return () => h('span', { 'data-testid': `${props.type}-${props.part}`, ...surface.attrs.value }, props.api.segments.value[props.type].find(s => s.part === props.part)?.value)
  },
})

function createStandaloneField(options: UseDateRangeFieldProps, expose?: (api: UseDateRangeFieldReturn) => void) {
  return defineComponent({
    setup() {
      const parentElement = ref<HTMLElement>()
      const api = useDateRangeField({ ...options, parentElement })
      expose?.(api)
      const renderEnd = (type: DateRangeType) => api.segments.value[type].map((segment, index) =>
        segment.part === 'literal'
          ? h('span', { 'key': `${type}-literal-${index}`, 'aria-hidden': 'true' }, segment.value)
          : h(Segment, { key: `${type}-${segment.part}`, api, part: segment.part, type }),
      )
      return () => h('div', { 'ref': parentElement, 'aria-label': 'Stay', 'data-testid': 'root', ...api.root.attrs.value }, [
        ...renderEnd('start'),
        h('span', { 'aria-hidden': 'true' }, ' - '),
        ...renderEnd('end'),
      ])
    },
  })
}

function setup(options: UseDateRangeFieldProps) {
  let api!: UseDateRangeFieldReturn
  const user = userEvent.setup()
  const rendered = render(createStandaloneField(options, a => (api = a)))
  return { ...rendered, user, api: () => api }
}

describe('useDateRangeField', () => {
  it('renders standalone and passes axe', async () => {
    const { container, getByTestId } = setup({ defaultValue: range, locale: 'en-US' })
    expect(getByTestId('root').getAttribute('role')).toBe('group')
    expect(getByTestId('end-day').textContent).toBe('25')
    expect(getByTestId('end-day').getAttribute('data-reka-date-range-field-segment-type')).toBe('end')
    expect(await axe(container)).toHaveNoViolations()
  })

  it('commits the whole range with the segment reason', async () => {
    const onUpdate = vi.fn()
    const { getByTestId, user, api } = setup({ defaultValue: range, locale: 'en-US', onUpdate })
    await user.click(getByTestId('end-day'))
    await user.keyboard('{ArrowUp}')
    let [value, details] = onUpdate.mock.lastCall!
    expect(value.start.toString()).toBe('2024-01-20')
    expect(value.end.toString()).toBe('2024-01-26')
    expect(details.reason).toBe('segment-increment')

    await user.click(getByTestId('start-day'))
    await user.keyboard('{ArrowDown}')
    ;[value, details] = onUpdate.mock.lastCall!
    expect(value.start.toString()).toBe('2024-01-19')
    expect(details.reason).toBe('segment-decrement')

    await user.keyboard('{Backspace}{Backspace}')
    ;[value, details] = onUpdate.mock.lastCall!
    expect(value.start).toBeUndefined()
    expect(value.end.toString()).toBe('2024-01-26')
    expect(details.reason).toBe('segment-clear')

    await user.keyboard('15')
    expect(onUpdate.mock.lastCall![0].start.toString()).toBe('2024-01-15')
    expect(onUpdate.mock.lastCall![1].reason).toBe('segment-input')
    expect(api().startValue.value?.toString()).toBe('2024-01-15')
  })

  it('snaps to the step on the range fields too (stepSnapping)', async () => {
    const onUpdate = vi.fn()
    const { getByTestId, user } = setup({
      defaultValue: { start: new CalendarDateTime(2024, 1, 20, 10, 0), end: new CalendarDateTime(2024, 1, 20, 12, 0) },
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
    expect(getByTestId('end-minute').textContent).toBe('30')
  })

  it('cancels a typed change and puts both ends back', async () => {
    const onUpdate = vi.fn()
    const { getByTestId, user, api } = setup({
      defaultValue: range,
      locale: 'en-US',
      onBeforeUpdate: (_value, details) => details.cancel(),
      onUpdate,
    })
    await user.click(getByTestId('start-day'))
    await user.keyboard('{ArrowUp}')
    await nextTick()
    expect(onUpdate).not.toHaveBeenCalled()
    expect(api().startValue.value?.toString()).toBe('2024-01-20')
    expect(getByTestId('start-day').textContent).toBe('20')
  })

  it('is controllable; null is a controlled empty range', () => {
    withScope(() => {
      const model = ref<DateRange | null>(range)
      const emit = vi.fn()
      const api = useDateRangeField({ modelValue: () => model.value, emit, locale: 'en-US' })
      expect(api.isControlled.value).toBe(true)
      expect(api.setRangeValue('end', new CalendarDate(2024, 2, 1))).toBe(true)
      expect(emit).toHaveBeenCalledWith('update:modelValue', expect.objectContaining({ end: new CalendarDate(2024, 2, 1) }), expect.objectContaining({ reason: 'imperative-action' }))
      expect(api.endValue.value?.toString()).toBe('2024-01-25')

      model.value = null
      expect(api.isControlled.value).toBe(true)
      expect(api.modelValue.value).toEqual({ start: undefined, end: undefined })

      const uncontrolled = useDateRangeField({ defaultValue: range, locale: 'en-US' })
      expect(uncontrolled.isControlled.value).toBe(false)
      // An equal range is not a change.
      expect(uncontrolled.setModelValue({ start: new CalendarDate(2024, 1, 20), end: new CalendarDate(2024, 1, 25) })).toBe(false)
      expect(uncontrolled.setRangeValue('start', new CalendarDate(2024, 1, 21))).toBe(true)
      expect(uncontrolled.startValue.value?.toString()).toBe('2024-01-21')
    })
  })

  it('validates the range: order, bounds and unavailable days in between', () => {
    withScope(() => {
      expect(useDateRangeField({ defaultValue: range, locale: 'en-US' }).isInvalid.value).toBe(false)
      expect(useDateRangeField({ defaultValue: { start: range.end, end: range.start }, locale: 'en-US' }).isInvalid.value).toBe(true)
      expect(useDateRangeField({ defaultValue: range, maxValue: new CalendarDate(2024, 1, 22), locale: 'en-US' }).isInvalid.value).toBe(true)
      const api = useDateRangeField({ defaultValue: range, isDateUnavailable: d => d.day === 22, locale: 'en-US' })
      expect(api.isInvalid.value).toBe(true)
      expect(api.root.attrs.value['data-invalid']).toBe('')
    })
  })

  it('orders segments by locale and follows the hour cycle', async () => {
    const locale = ref('en-US')
    const api = withScope(() => useDateRangeField({ defaultValue: range, locale }))
    expect(api.editableSegments.value.start.map(s => s.part)).toEqual(['month', 'day', 'year'])
    locale.value = 'de-DE'
    await nextTick()
    expect(api.editableSegments.value.end.map(s => s.part)).toEqual(['day', 'month', 'year'])

    const timed = { start: new CalendarDateTime(2024, 1, 20, 14), end: new CalendarDateTime(2024, 1, 20, 16) }
    const h24 = withScope(() => useDateRangeField({ defaultValue: timed, locale: 'en-US', hourCycle: 24 }))
    expect(h24.segments.value.start.find(s => s.part === 'hour')?.value).toBe('14')
    expect(h24.editableSegments.value.start.map(s => s.part)).not.toContain('dayPeriod')
  })

  it('renders on the server', async () => {
    const html = await renderToString(createSSRApp(createStandaloneField({ defaultValue: range, locale: 'en-US' })))
    expect(html).toContain('role="group"')
    expect(html).toContain('data-reka-date-range-field-segment-type="end"')
    expect(html).toContain('>25<')
  })
})
