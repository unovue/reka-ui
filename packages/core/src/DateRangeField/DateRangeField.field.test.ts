import type { VueWrapper } from '@vue/test-utils'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { FieldError, FieldLabel, FieldRoot } from '@/Field'
import { FormRoot } from '@/Form'
import { describeFieldControlContract, providedContext } from '@/test/fieldControlContract'
import { DateRangeFieldInput, DateRangeFieldRoot } from '.'

type Segment = { part: string, value: string }

function render(props: Record<string, unknown>) {
  return h(DateRangeFieldRoot, { locale: 'en-US', ...props }, {
    default: ({ segments }: { segments: Record<'start' | 'end', Segment[]> }) => (['start', 'end'] as const).flatMap(type =>
      segments[type].map(segment => h(DateRangeFieldInput, { 'key': `${type}-${segment.part}`, 'part': segment.part as any, type, 'data-segment': `${type}-${segment.part}` }, () => segment.value))),
  })
}

const segment = (wrapper: VueWrapper, name: string) => wrapper.find(`[data-segment="${name}"]`).element as HTMLElement

async function type(wrapper: VueWrapper, keys: string) {
  segment(wrapper, 'start-month').focus()
  for (const key of keys) {
    ;(document.activeElement as HTMLElement).dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
    await flushPromises()
  }
}

function serialize(value: unknown) {
  const range = value as { start?: unknown, end?: unknown } | null
  return { start: String(range?.start), end: String(range?.end) }
}

describeFieldControlContract({
  name: 'DateRangeField',
  setProgrammatically: (wrapper, value) => providedContext(wrapper, DateRangeFieldRoot, 'setModelValue').setModelValue(value),
  render,
  control: wrapper => wrapper.find('[role="group"]').element as HTMLElement,
  focusTarget: wrapper => segment(wrapper, 'start-month'),
  idOnControl: false,
  labelTarget: wrapper => wrapper.find('input[aria-hidden="true"]').element as HTMLElement,
  parts: wrapper => [segment(wrapper, 'start-year'), segment(wrapper, 'end-month')],
  serialize,
  interact: wrapper => type(wrapper, '0115202401202024'),
  interactedValue: { start: Temporal.PlainDate.from('2024-01-15'), end: Temporal.PlainDate.from('2024-01-20') },
  emptyValue: null,
  filledValue: { start: Temporal.PlainDate.from('2024-02-01'), end: Temporal.PlainDate.from('2024-02-03') },
})

describe('given a Field-wrapped DateRangeField', () => {
  function mountField(fieldProps: Record<string, unknown> = {}, onFormSubmit = vi.fn()) {
    const wrapper = mount(defineComponent({
      setup: () => () => h(FormRoot, { onFormSubmit }, () => [
        h(FieldRoot, { 'name': 'range', 'data-testid': 'field', ...fieldProps }, () => [
          h(FieldLabel, () => 'Range'),
          render({}),
          h(FieldError, { match: 'valueMissing' }, () => 'Required'),
        ]),
        h('button', { type: 'submit' }, 'Submit'),
      ]),
    }), { attachTo: document.body })
    return { wrapper, onFormSubmit }
  }

  it('points the label at the hidden input, which moves focus into the first segment', async () => {
    const { wrapper } = mountField()
    await nextTick()
    const target = wrapper.find(`#${wrapper.find('label').attributes('for')}`).element as HTMLElement
    expect(target.tagName).toBe('INPUT')
    expect(target.getAttribute('name')).toBe('range')
    target.focus()
    expect(document.activeElement).toBe(segment(wrapper, 'start-month'))
    wrapper.unmount()
  })

  it('treats a range with only one end as missing when required', async () => {
    const { wrapper, onFormSubmit } = mountField({ required: true })
    await nextTick()
    await type(wrapper, '01152024')
    expect(wrapper.find('[data-testid="field"]').attributes('data-dirty')).toBe('')
    expect(wrapper.find('[data-testid="field"]').attributes('data-filled')).toBeUndefined()
    await wrapper.find('button[type="submit"]').trigger('submit')
    await nextTick()
    expect(onFormSubmit).not.toHaveBeenCalled()
    expect(wrapper.find('[data-testid="field"]').attributes('data-invalid')).toBe('')
    expect(wrapper.text()).toContain('Required')
    expect(document.activeElement).toBe(segment(wrapper, 'start-month'))

    await type(wrapper, '0115202401202024')
    expect(wrapper.find('[data-testid="field"]').attributes('data-filled')).toBe('')
    await wrapper.find('button[type="submit"]').trigger('submit')
    expect(onFormSubmit).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('takes required and disabled from the field', async () => {
    const { wrapper } = mountField({ required: true, disabled: true })
    await nextTick()
    const hidden = wrapper.find('input[aria-hidden="true"]').element as HTMLInputElement
    expect(hidden.required).toBe(true)
    expect(hidden.disabled).toBe(true)
    expect(segment(wrapper, 'end-day').getAttribute('contenteditable')).toBe('false')
    expect(segment(wrapper, 'end-day').getAttribute('aria-disabled')).toBe('true')
    wrapper.unmount()
  })
})
