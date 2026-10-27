import type { DateValue } from '@internationalized/date'
import type { PropType } from 'vue'
import type { UseDateFieldProps, UseDateFieldReturn } from './useDateField'
import type { SegmentPart } from '@/shared/date'
import { CalendarDate, CalendarDateTime } from '@internationalized/date'
import userEvent from '@testing-library/user-event'
import { render } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { createSSRApp, defineComponent, effectScope, h, nextTick, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { useDateField } from './useDateField'

/**
 * Standalone `useDateField()`: a consumer builds the root and the segments
 * from the composable's surfaces, without `DateFieldRoot` / `DateFieldInput`.
 * The rendered component behaviour is covered by `DateField.test.ts`.
 */

const jan20 = new CalendarDate(2024, 1, 20)

function withScope<T>(fn: () => T): T {
  return effectScope().run(fn)!
}

const Segment = defineComponent({
  props: {
    api: { type: Object as PropType<UseDateFieldReturn>, required: true },
    part: { type: String as PropType<SegmentPart>, required: true },
  },
  setup(props) {
    const surface = props.api.createInputSurface(() => props.part)
    return () => h('span', { 'data-testid': props.part, ...surface.attrs.value }, props.api.segments.value.find(s => s.part === props.part)?.value)
  },
})

function createStandaloneField(options: UseDateFieldProps, expose?: (api: UseDateFieldReturn) => void) {
  return defineComponent({
    setup() {
      const parentElement = ref<HTMLElement>()
      const api = useDateField({ ...options, parentElement })
      expose?.(api)
      return () => h('div', { 'ref': parentElement, 'aria-label': 'Date', 'data-testid': 'root', ...api.root.attrs.value }, api.segments.value.map((segment, index) =>
        segment.part === 'literal'
          ? h('span', { 'key': `literal-${index}`, 'aria-hidden': 'true', ...api.createInputSurface('literal').attrs.value }, segment.value)
          : h(Segment, { key: segment.part, api, part: segment.part }),
      ))
    },
  })
}

function setup(options: UseDateFieldProps) {
  let api!: UseDateFieldReturn
  const user = userEvent.setup()
  const rendered = render(createStandaloneField(options, a => (api = a)))
  return { ...rendered, user, api: () => api }
}

describe('useDateField', () => {
  it('renders standalone and passes axe', async () => {
    const { container, getByTestId } = setup({ defaultValue: jan20, locale: 'en-US' })
    expect(getByTestId('root').getAttribute('role')).toBe('group')
    expect(getByTestId('month').getAttribute('role')).toBe('spinbutton')
    expect(getByTestId('day').textContent).toBe('20')
    expect(getByTestId('day').getAttribute('data-reka-date-field-segment')).toBe('day')
    expect(await axe(container)).toHaveNoViolations()
  })

  it('reports segment-increment / segment-decrement / segment-clear / segment-input', async () => {
    const onUpdate = vi.fn()
    const { getByTestId, user, api } = setup({ defaultValue: jan20, locale: 'en-US', onUpdate })

    await user.click(getByTestId('day'))
    await user.keyboard('{ArrowUp}')
    expect(onUpdate).toHaveBeenLastCalledWith(new CalendarDate(2024, 1, 21), expect.objectContaining({ reason: 'segment-increment' }))
    await user.keyboard('{ArrowDown}')
    expect(onUpdate).toHaveBeenLastCalledWith(new CalendarDate(2024, 1, 20), expect.objectContaining({ reason: 'segment-decrement' }))
    expect(onUpdate.mock.lastCall![1].event).toBeInstanceOf(KeyboardEvent)

    // Backspace drops one digit (20 -> 2, still a date), then empties the segment.
    await user.keyboard('{Backspace}')
    expect(onUpdate).toHaveBeenLastCalledWith(new CalendarDate(2024, 1, 2), expect.objectContaining({ reason: 'segment-clear' }))
    await user.keyboard('{Backspace}')
    expect(onUpdate).toHaveBeenLastCalledWith(undefined, expect.objectContaining({ reason: 'segment-clear' }))
    expect(api().modelValue.value).toBeUndefined()

    await user.keyboard('15')
    expect(onUpdate).toHaveBeenLastCalledWith(new CalendarDate(2024, 1, 15), expect.objectContaining({ reason: 'segment-input' }))
    expect(api().lastChangeDetails.value.reason).toBe('segment-input')
  })

  it('reports step-snap when a snapped time segment loses focus', async () => {
    const onUpdate = vi.fn()
    const { getByTestId, user } = setup({
      defaultValue: new CalendarDateTime(2024, 1, 20, 10, 0),
      locale: 'en-US',
      granularity: 'second',
      step: { minute: 15 },
      stepSnapping: true,
      onUpdate,
    })
    await user.click(getByTestId('minute'))
    await user.keyboard('{2}{3}')
    // The first digit commits as typed; the second auto-advances, so the
    // minute loses focus and snaps (23 -> 30) before its own commit.
    expect(onUpdate).toHaveBeenNthCalledWith(1, new CalendarDateTime(2024, 1, 20, 10, 2), expect.objectContaining({ reason: 'segment-input' }))
    expect(onUpdate).toHaveBeenLastCalledWith(new CalendarDateTime(2024, 1, 20, 10, 30), expect.objectContaining({ reason: 'step-snap' }))
  })

  it('cancels a typed change and puts the segments back', async () => {
    const onUpdate = vi.fn()
    const { getByTestId, user, api } = setup({
      defaultValue: jan20,
      locale: 'en-US',
      onBeforeUpdate: (_value, details) => details.cancel(),
      onUpdate,
    })
    await user.click(getByTestId('day'))
    await user.keyboard('{ArrowUp}')
    await nextTick()
    expect(onUpdate).not.toHaveBeenCalled()
    expect(api().modelValue.value?.toString()).toBe('2024-01-20')
    expect(getByTestId('day').textContent).toBe('20')
  })

  it('emits but does not write when controlled; null is a controlled empty field', async () => {
    withScope(() => {
      const model = ref<DateValue | null>(jan20)
      const emit = vi.fn()
      const api = useDateField({ modelValue: () => model.value, emit, locale: 'en-US' })
      expect(api.isControlled.value).toBe(true)
      expect(api.setModelValue(new CalendarDate(2024, 2, 1))).toBe(true)
      expect(emit).toHaveBeenCalledWith('beforeUpdate:modelValue', new CalendarDate(2024, 2, 1), expect.objectContaining({ reason: 'imperative-action' }))
      expect(emit).toHaveBeenCalledWith('update:modelValue', new CalendarDate(2024, 2, 1), expect.objectContaining({ reason: 'imperative-action' }))
      expect(api.modelValue.value?.toString()).toBe('2024-01-20')

      model.value = null
      expect(api.isControlled.value).toBe(true)
      expect(api.modelValue.value).toBeUndefined()
    })
  })

  it('writes when uncontrolled and does not emit an unchanged value', () => {
    withScope(() => {
      const onUpdate = vi.fn()
      const api = useDateField({ defaultValue: jan20, onUpdate, locale: 'en-US' })
      expect(api.isControlled.value).toBe(false)
      expect(api.setModelValue(new CalendarDate(2024, 1, 20))).toBe(false)
      expect(onUpdate).not.toHaveBeenCalled()
      expect(api.setModelValue(new CalendarDate(2024, 3, 3))).toBe(true)
      expect(api.modelValue.value?.toString()).toBe('2024-03-03')
      // The placeholder follows the value.
      expect(api.placeholder.value.toString()).toBe('2024-01-20')
    })
  })

  it('follows the placeholder after a value change with imperative-action', async () => {
    const onUpdatePlaceholder = vi.fn()
    const api = withScope(() => useDateField({ defaultValue: jan20, onUpdatePlaceholder, locale: 'en-US' }))
    api.setModelValue(new CalendarDate(2025, 6, 1), 'segment-input')
    await nextTick()
    expect(api.placeholder.value.toString()).toBe('2025-06-01')
    expect(onUpdatePlaceholder).toHaveBeenLastCalledWith(new CalendarDate(2025, 6, 1), expect.objectContaining({ reason: 'imperative-action' }))
  })

  it('orders segments by locale and reacts to a locale change', async () => {
    const locale = ref('en-US')
    const api = withScope(() => useDateField({ defaultValue: jan20, locale }))
    expect(api.editableSegments.value.map(s => s.part)).toEqual(['month', 'day', 'year'])
    locale.value = 'de-DE'
    await nextTick()
    expect(api.editableSegments.value.map(s => s.part)).toEqual(['day', 'month', 'year'])
  })

  it('shows a day period only for a 12-hour cycle', () => {
    withScope(() => {
      const value = new CalendarDateTime(2024, 1, 20, 14, 30)
      const h12 = useDateField({ defaultValue: value, locale: 'en-US', hourCycle: 12 })
      expect(h12.editableSegments.value.map(s => s.part)).toContain('dayPeriod')
      expect(h12.segments.value.find(s => s.part === 'hour')?.value).toBe('2')

      const h24 = useDateField({ defaultValue: value, locale: 'en-US', hourCycle: 24 })
      expect(h24.editableSegments.value.map(s => s.part)).not.toContain('dayPeriod')
      expect(h24.segments.value.find(s => s.part === 'hour')?.value).toBe('14')
    })
  })

  it('validates against min, max and isDateUnavailable and reflects it on the surfaces', () => {
    withScope(() => {
      const api = useDateField({
        defaultValue: jan20,
        minValue: new CalendarDate(2024, 2, 1),
        locale: 'en-US',
      })
      expect(api.isInvalid.value).toBe(true)
      expect(api.root.attrs.value['data-invalid']).toBe('')
      const day = api.createInputSurface('day')
      expect(day.attrs.value['aria-invalid']).toBe(true)
      expect(day.attrs.value['data-invalid']).toBe('')

      const unavailable = useDateField({ defaultValue: jan20, isDateUnavailable: d => d.day === 20, locale: 'en-US' })
      expect(unavailable.isInvalid.value).toBe(true)
    })
  })

  it('marks empty segments as placeholders and literals as such', () => {
    withScope(() => {
      const api = useDateField({ locale: 'en-US', disabled: true })
      const day = api.createInputSurface('day')
      expect(day.attrs.value['data-placeholder']).toBe('')
      expect(day.attrs.value.contenteditable).toBe(false)
      expect(day.attrs.value['data-disabled']).toBe('')
      const literal = api.createInputSurface('literal')
      expect(literal.attrs.value['data-segment']).toBe('literal')
      expect(api.root.attrs.value['aria-disabled']).toBe(true)
    })
  })

  it('renders on the server', async () => {
    const html = await renderToString(createSSRApp(createStandaloneField({ defaultValue: jan20, locale: 'en-US' })))
    expect(html).toContain('role="group"')
    expect(html).toContain('data-reka-date-field-segment="day"')
    expect(html).toContain('>20<')
  })
})
