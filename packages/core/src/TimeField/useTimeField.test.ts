import type { PropType } from 'vue'
import type { UseTimeFieldProps, UseTimeFieldReturn } from './useTimeField'
import type { SegmentPart, TimeValue } from '@/shared/date'
import userEvent from '@testing-library/user-event'
import { render } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { createSSRApp, defineComponent, effectScope, h, nextTick, ref, shallowRef } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { useTimeField } from './useTimeField'

/**
 * Standalone `useTimeField()`. The rendered component behaviour is covered by
 * `TimeField.test.ts`.
 */

const t1030 = new Temporal.PlainTime(10, 30)

function withScope<T>(fn: () => T): T {
  return effectScope().run(fn)!
}

const Segment = defineComponent({
  props: {
    api: { type: Object as PropType<UseTimeFieldReturn>, required: true },
    part: { type: String as PropType<SegmentPart>, required: true },
  },
  setup(props) {
    const surface = props.api.createInputSurface(() => props.part)
    return () => h('span', { 'data-testid': props.part, ...surface.attrs.value }, props.api.segments.value.find(s => s.part === props.part)?.value)
  },
})

function createStandaloneField(options: UseTimeFieldProps, expose?: (api: UseTimeFieldReturn) => void) {
  return defineComponent({
    setup() {
      const parentElement = ref<HTMLElement>()
      const api = useTimeField({ ...options, parentElement })
      expose?.(api)
      return () => h('div', { 'ref': parentElement, 'aria-label': 'Time', 'data-testid': 'root', ...api.root.attrs.value }, api.segments.value.map((segment, index) =>
        segment.part === 'literal'
          ? h('span', { 'key': `literal-${index}`, 'aria-hidden': 'true', ...api.createInputSurface('literal').attrs.value }, segment.value)
          : h(Segment, { key: segment.part, api, part: segment.part }),
      ))
    },
  })
}

function setup(options: UseTimeFieldProps) {
  let api!: UseTimeFieldReturn
  const user = userEvent.setup()
  const rendered = render(createStandaloneField(options, a => (api = a)))
  return { ...rendered, user, api: () => api }
}

describe('useTimeField', () => {
  it('renders standalone and passes axe', async () => {
    const { container, getByTestId } = setup({ defaultValue: t1030, locale: 'en-US' })
    expect(getByTestId('root').getAttribute('role')).toBe('group')
    expect(getByTestId('hour').getAttribute('data-reka-time-field-segment')).toBe('hour')
    expect(getByTestId('minute').textContent).toBe('30')
    expect(await axe(container)).toHaveNoViolations()
  })

  it('emits a Time for a Time value, with the reason', async () => {
    const onUpdate = vi.fn()
    const { getByTestId, user } = setup({ defaultValue: t1030, locale: 'en-US', onUpdate })
    await user.click(getByTestId('minute'))
    await user.keyboard('{ArrowUp}')
    const [value, details] = onUpdate.mock.lastCall!
    expect(value).toBeInstanceOf(Temporal.PlainTime)
    expect((value as Temporal.PlainTime).toString()).toBe('10:31:00')
    expect(details.reason).toBe('segment-increment')

    await user.keyboard('{ArrowDown}')
    expect(onUpdate.mock.lastCall![1].reason).toBe('segment-decrement')
    await user.keyboard('{Backspace}{Backspace}')
    expect(onUpdate).toHaveBeenLastCalledWith(undefined, expect.objectContaining({ reason: 'segment-clear' }))
    await user.keyboard('45')
    expect(onUpdate.mock.lastCall![0].toString()).toBe('10:45:00')
    expect(onUpdate.mock.lastCall![1].reason).toBe('segment-input')
  })

  it('keeps a date-time value as a date-time', () => {
    withScope(() => {
      const onUpdate = vi.fn()
      const api = useTimeField({ defaultValue: new Temporal.PlainDateTime(2024, 1, 20, 10, 30), onUpdate, locale: 'en-US' })
      api.setModelValue(new Temporal.PlainDateTime(2024, 1, 20, 11, 0))
      expect(onUpdate.mock.lastCall![0]).toBeInstanceOf(Temporal.PlainDateTime)
    })
  })

  it('emits a Time placeholder when the placeholder is a Time', async () => {
    const onUpdatePlaceholder = vi.fn()
    const api = withScope(() => useTimeField({ defaultValue: t1030, onUpdatePlaceholder, locale: 'en-US' }))
    api.setModelValue(new Temporal.PlainTime(14, 0), 'segment-input')
    await nextTick()
    const [value, details] = onUpdatePlaceholder.mock.lastCall!
    expect(value).toBeInstanceOf(Temporal.PlainTime)
    expect(value.toString()).toBe('14:00:00')
    expect(details.reason).toBe('imperative-action')
  })

  it('a cancelled typed change keeps the model and the typed segments', async () => {
    const onUpdate = vi.fn()
    const { getByTestId, user, api } = setup({
      defaultValue: t1030,
      locale: 'en-US',
      onBeforeUpdate: (_value, details) => details.cancel(),
      onUpdate,
    })
    await user.click(getByTestId('minute'))
    await user.keyboard('{ArrowUp}')
    await nextTick()
    expect(onUpdate).not.toHaveBeenCalled()
    expect(api().modelValue.value?.toString()).toBe('10:30:00')
    expect(getByTestId('minute').textContent).toBe('31')
  })

  it('is controllable; null is a controlled empty field', () => {
    withScope(() => {
      const model = shallowRef<TimeValue | null>(t1030)
      const emit = vi.fn()
      const api = useTimeField({ modelValue: () => model.value, emit, locale: 'en-US' })
      expect(api.isControlled.value).toBe(true)
      api.setModelValue(new Temporal.PlainTime(9, 0))
      expect(emit).toHaveBeenCalledWith('update:modelValue', new Temporal.PlainTime(9, 0), expect.objectContaining({ reason: 'imperative-action' }))
      expect(api.modelValue.value?.toString()).toBe('10:30:00')
      model.value = null
      expect(api.modelValue.value).toBeUndefined()

      const uncontrolled = useTimeField({ defaultValue: t1030, locale: 'en-US' })
      expect(uncontrolled.isControlled.value).toBe(false)
      expect(uncontrolled.setModelValue(new Temporal.PlainTime(10, 30))).toBe(false)
      expect(uncontrolled.setModelValue(new Temporal.PlainTime(9, 0))).toBe(true)
      expect(uncontrolled.modelValue.value?.toString()).toBe('09:00:00')
    })
  })

  it('marks the field invalid through isTimeUnavailable, min and max', () => {
    withScope(() => {
      const matcher = vi.fn((date: { hour: number }) => date.hour === 10)
      const api = useTimeField({ defaultValue: t1030, isTimeUnavailable: matcher as any, locale: 'en-US' })
      expect(api.isInvalid.value).toBe(true)
      expect(matcher.mock.calls[0][0]).toHaveProperty('day')
      expect(api.root.attrs.value['data-invalid']).toBe('')

      expect(useTimeField({ defaultValue: t1030, minValue: new Temporal.PlainTime(11), locale: 'en-US' }).isInvalid.value).toBe(true)
      expect(useTimeField({ defaultValue: t1030, maxValue: new Temporal.PlainTime(10), locale: 'en-US' }).isInvalid.value).toBe(true)
      expect(useTimeField({ defaultValue: t1030, minValue: new Temporal.PlainTime(9), maxValue: new Temporal.PlainTime(11), locale: 'en-US' }).isInvalid.value).toBe(false)
    })
  })

  it('follows the hour cycle and the locale', async () => {
    const locale = ref('en-US')
    const value = new Temporal.PlainTime(14, 5)
    const h12 = withScope(() => useTimeField({ defaultValue: value, locale, hourCycle: 12 }))
    expect(h12.segments.value.find(s => s.part === 'hour')?.value).toBe('2')
    expect(h12.editableSegments.value.map(s => s.part)).toContain('dayPeriod')

    const h24 = withScope(() => useTimeField({ defaultValue: value, locale: 'en-US', hourCycle: 24 }))
    expect(h24.segments.value.find(s => s.part === 'hour')?.value).toBe('14')
    expect(h24.editableSegments.value.map(s => s.part)).not.toContain('dayPeriod')

    const byLocale = withScope(() => useTimeField({ defaultValue: value, locale }))
    expect(byLocale.editableSegments.value.map(s => s.part)).toContain('dayPeriod')
    locale.value = 'de-DE'
    await nextTick()
    expect(byLocale.editableSegments.value.map(s => s.part)).not.toContain('dayPeriod')
  })

  it('renders on the server', async () => {
    const html = await renderToString(createSSRApp(createStandaloneField({ defaultValue: t1030, locale: 'en-US' })))
    expect(html).toContain('role="group"')
    expect(html).toContain('data-reka-time-field-segment="minute"')
    expect(html).toContain('>30<')
  })
})
