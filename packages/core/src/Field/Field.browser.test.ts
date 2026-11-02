import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, nextTick } from 'vue'
import { DateFieldInput, DateFieldRoot } from '@/DateField'
import { FormRoot } from '@/Form'
import { FieldRoot } from '.'

function renderDateField(defaultValue: unknown) {
  const errors: string[] = []
  const wrapper = mount(defineComponent(() => () =>
    h(FormRoot, { 'data-testid': 'form' }, () =>
      h(FieldRoot, { 'data-testid': 'field', 'name': 'date' }, () =>
        h(DateFieldRoot as any, { defaultValue, granularity: defaultValue ? undefined : 'day' }, {
          default: ({ segments }: any) => segments.map((s: any) => s.part === 'literal'
            ? h('span', s.value)
            : h(DateFieldInput, { 'part': s.part, 'key': s.part, 'data-segment': s.part }, () => s.value)),
        })))), {
    attachTo: document.body,
    global: { config: { errorHandler: error => errors.push((error as Error).message) } },
  })
  const field = () => document.querySelector('[data-testid="field"]')!
  return {
    wrapper,
    errors,
    field,
    segment: (part: string) => document.querySelector<HTMLElement>(`[data-segment="${part}"]`)!,
    dirty: () => field().hasAttribute('data-dirty'),
    filled: () => field().hasAttribute('data-filled'),
    form: () => document.querySelector<HTMLFormElement>('[data-testid="form"]')!,
  }
}

describe('a DateField inside a Field, edited in a real browser', () => {
  let mounted: ReturnType<typeof renderDateField> | undefined
  afterEach(() => {
    mounted?.wrapper.unmount()
    mounted = undefined
  })

  it('becomes dirty on an edit and clean again when edited back to the initial value', async () => {
    const t = mounted = renderDateField(Temporal.PlainDate.from('2024-01-15'))
    await expect.poll(() => t.filled()).toBe(true)
    expect(t.dirty()).toBe(false)

    t.segment('month').focus()
    await userEvent.keyboard('{ArrowUp}')
    await expect.poll(() => t.dirty()).toBe(true)
    expect(t.filled()).toBe(true)
    expect(t.errors).toEqual([])

    await userEvent.keyboard('{ArrowDown}')
    await expect.poll(() => t.dirty()).toBe(false)
    expect(t.filled()).toBe(true)
    expect(t.errors).toEqual([])
  })

  it('works for a ZonedDateTime too', async () => {
    const t = mounted = renderDateField(Temporal.ZonedDateTime.from('2024-01-15T10:30[Asia/Tokyo]'))
    t.segment('hour').focus()
    await userEvent.keyboard('{ArrowUp}')
    await expect.poll(() => t.dirty()).toBe(true)
    await userEvent.keyboard('{ArrowDown}')
    await expect.poll(() => t.dirty()).toBe(false)
    expect(t.errors).toEqual([])
  })

  it('tracks filled and dirty when an empty field is typed into and cleared', async () => {
    const t = mounted = renderDateField(undefined)
    expect(t.filled()).toBe(false)

    t.segment('month').focus()
    await userEvent.keyboard('02152024')
    await expect.poll(() => t.dirty()).toBe(true)
    expect(t.filled()).toBe(true)
    expect(t.errors).toEqual([])

    t.segment('month').focus()
    await userEvent.keyboard('{Backspace}{Backspace}')
    await expect.poll(() => t.filled()).toBe(false)
    // Empty again, as it started.
    expect(t.dirty()).toBe(false)
    expect(t.errors).toEqual([])
  })

  it('a form reset clears dirty, and a later edit still reports', async () => {
    const t = mounted = renderDateField(Temporal.PlainDate.from('2024-01-15'))
    t.segment('month').focus()
    await userEvent.keyboard('{ArrowUp}')
    await expect.poll(() => t.dirty()).toBe(true)

    t.form().reset()
    await nextTick()
    await expect.poll(() => t.dirty()).toBe(false)

    // The baseline survives the reset: a later edit, and an edit back to it, still compare.
    await userEvent.keyboard('{ArrowUp}')
    await expect.poll(() => t.dirty()).toBe(true)
    await userEvent.keyboard('{ArrowDown}{ArrowDown}')
    await expect.poll(() => t.dirty()).toBe(false)
    expect(t.errors).toEqual([])
  })
})
