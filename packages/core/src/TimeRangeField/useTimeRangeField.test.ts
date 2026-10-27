import type { PropType } from 'vue'
import type { UseTimeRangeFieldProps, UseTimeRangeFieldReturn } from './useTimeRangeField'
import type { DateRangeType } from '@/DateRangeField'
import type { SegmentPart, TimeRange } from '@/shared/date'
import { Time } from '@internationalized/date'
import userEvent from '@testing-library/user-event'
import { render } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { createSSRApp, defineComponent, effectScope, h, nextTick, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { useTimeRangeField } from './useTimeRangeField'

/**
 * Standalone `useTimeRangeField()`. The rendered component behaviour is
 * covered by `TimeRangeField.test.ts`.
 */

const range: TimeRange = { start: new Time(10, 0), end: new Time(12, 30) }

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
    expect(value.start).toBeInstanceOf(Time)
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
      const model = ref<TimeRange | null>(range)
      const emit = vi.fn()
      const api = useTimeRangeField({ modelValue: () => model.value, emit, locale: 'en-US' })
      expect(api.isControlled.value).toBe(true)
      api.setModelValue({ start: new Time(8), end: new Time(9) })
      expect(emit).toHaveBeenCalledWith('update:modelValue', { start: new Time(8), end: new Time(9) }, expect.objectContaining({ reason: 'imperative-action' }))
      expect(api.modelValue.value.start?.toString()).toBe('10:00:00')
      model.value = null
      expect(api.modelValue.value).toEqual({ start: undefined, end: undefined })

      const uncontrolled = useTimeRangeField({ defaultValue: range, locale: 'en-US' })
      expect(uncontrolled.isControlled.value).toBe(false)
      expect(uncontrolled.setModelValue({ start: new Time(10, 0), end: new Time(12, 30) })).toBe(false)
      expect(uncontrolled.setModelValue({ start: new Time(8), end: new Time(9) })).toBe(true)
      expect(uncontrolled.modelValue.value.start?.toString()).toBe('08:00:00')
    })
  })

  it('validates order, bounds and isTimeUnavailable', () => {
    withScope(() => {
      expect(useTimeRangeField({ defaultValue: range, locale: 'en-US' }).isInvalid.value).toBe(false)
      expect(useTimeRangeField({ defaultValue: { start: range.end, end: range.start }, locale: 'en-US' }).isInvalid.value).toBe(true)
      expect(useTimeRangeField({ defaultValue: range, maxValue: new Time(12), locale: 'en-US' }).isInvalid.value).toBe(true)
      const api = useTimeRangeField({ defaultValue: range, isTimeUnavailable: (d: any) => d.hour === 12, locale: 'en-US' })
      expect(api.isInvalid.value).toBe(true)
      expect(api.root.attrs.value['data-invalid']).toBe('')
    })
  })

  it('follows the hour cycle and the locale', async () => {
    const locale = ref('en-US')
    const pm = { start: new Time(14), end: new Time(16) }
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
