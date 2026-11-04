import type { VueWrapper } from '@vue/test-utils'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { FieldError, FieldLabel, FieldRoot } from '@/Field'
import { FormRoot } from '@/Form'
import { describeFieldControlContract } from '@/test/fieldControlContract'
import { TimeRangeFieldInput, TimeRangeFieldRoot } from '.'

type Segment = { part: string, value: string }

function render(props: Record<string, unknown>) {
  return h(TimeRangeFieldRoot, { locale: 'en-US', hourCycle: 24, granularity: 'minute', ...props }, {
    default: ({ segments }: { segments: Record<'start' | 'end', Segment[]> }) => (['start', 'end'] as const).flatMap(type =>
      segments[type].map(segment => h(TimeRangeFieldInput, { 'key': `${type}-${segment.part}`, 'part': segment.part as any, type, 'data-segment': `${type}-${segment.part}` }, () => segment.value))),
  })
}

const segment = (wrapper: VueWrapper, name: string) => wrapper.find(`[data-segment="${name}"]`).element as HTMLElement

async function type(wrapper: VueWrapper, keys: string) {
  segment(wrapper, 'start-hour').focus()
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
  name: 'TimeRangeField',
  render,
  control: wrapper => wrapper.find('[role="group"]').element as HTMLElement,
  focusTarget: wrapper => segment(wrapper, 'start-hour'),
  idOnControl: false,
  labelTarget: wrapper => wrapper.find('input[aria-hidden="true"]').element as HTMLElement,
  parts: wrapper => [segment(wrapper, 'start-minute'), segment(wrapper, 'end-hour')],
  serialize,
  interact: wrapper => type(wrapper, '09001730'),
  interactedValue: { start: Temporal.PlainTime.from('09:00'), end: Temporal.PlainTime.from('17:30') },
  emptyValue: null,
  filledValue: { start: Temporal.PlainTime.from('08:00'), end: Temporal.PlainTime.from('12:00') },
})

describe('given a Field-wrapped TimeRangeField', () => {
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
    expect(document.activeElement).toBe(segment(wrapper, 'start-hour'))
    wrapper.unmount()
  })

  it('treats a range with only one end as missing when required', async () => {
    const { wrapper, onFormSubmit } = mountField({ required: true })
    await nextTick()
    await type(wrapper, '0900')
    expect(wrapper.find('[data-testid="field"]').attributes('data-dirty')).toBe('')
    expect(wrapper.find('[data-testid="field"]').attributes('data-filled')).toBeUndefined()
    await wrapper.find('button[type="submit"]').trigger('submit')
    await nextTick()
    expect(onFormSubmit).not.toHaveBeenCalled()
    expect(wrapper.find('[data-testid="field"]').attributes('data-invalid')).toBe('')
    expect(wrapper.text()).toContain('Required')
    expect(document.activeElement).toBe(segment(wrapper, 'start-hour'))

    await type(wrapper, '09001730')
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
    expect(segment(wrapper, 'end-minute').getAttribute('contenteditable')).toBe('false')
    expect(segment(wrapper, 'end-minute').getAttribute('aria-disabled')).toBe('true')
    wrapper.unmount()
  })
})
