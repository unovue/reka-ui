import type { VueWrapper } from '@vue/test-utils'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { FieldLabel, FieldRoot } from '@/Field'
import { describeFieldControlContract } from '@/test/fieldControlContract'
import { TimeFieldInput, TimeFieldRoot } from '.'

function render(props: Record<string, unknown>) {
  return h(TimeFieldRoot, { hourCycle: 24, granularity: 'minute', ...props }, {
    default: ({ segments }: { segments: { part: string, value: string }[] }) => segments.map(segment =>
      h(TimeFieldInput, { 'key': segment.part, 'part': segment.part as any, 'data-segment': segment.part }, () => segment.value)),
  })
}

const segment = (wrapper: VueWrapper, part: string) => wrapper.find(`[data-segment="${part}"]`)

async function type(wrapper: VueWrapper, keys: string[]) {
  segment(wrapper, 'hour').element.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
  ;(segment(wrapper, 'hour').element as HTMLElement).focus()
  for (const key of keys) {
    const target = document.activeElement as HTMLElement
    target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
    await flushPromises()
  }
}

describeFieldControlContract({
  name: 'TimeField',
  render,
  control: wrapper => wrapper.find('[role="group"]').element as HTMLElement,
  focusTarget: wrapper => segment(wrapper, 'hour').element as HTMLElement,
  idOnControl: false,
  labelTarget: wrapper => wrapper.find('input[aria-hidden="true"]').element as HTMLElement,
  parts: wrapper => [segment(wrapper, 'hour').element, segment(wrapper, 'minute').element] as HTMLElement[],
  serialize: value => String(value),
  interact: wrapper => type(wrapper, ['1', '0', '3', '0']),
  interactedValue: Temporal.PlainTime.from('10:30'),
  emptyValue: undefined,
  filledValue: Temporal.PlainTime.from('09:15'),
})

describe('given a Field-wrapped TimeField', () => {
  function mountField(fieldProps: Record<string, unknown> = {}, rootProps: Record<string, unknown> = {}) {
    return mount(defineComponent({
      setup: () => () => h(FieldRoot, { name: 'time', ...fieldProps }, () => [h(FieldLabel, () => 'Time'), render(rootProps)]),
    }), { attachTo: document.body })
  }

  it('points the label at the hidden input, which moves focus into the first segment', async () => {
    const wrapper = mountField()
    await nextTick()
    const target = wrapper.find(`#${wrapper.find('label').attributes('for')}`).element as HTMLElement
    expect(target.tagName).toBe('INPUT')
    expect(target.getAttribute('name')).toBe('time')
    target.focus()
    expect(document.activeElement).toBe(segment(wrapper, 'hour').element)
    wrapper.unmount()
  })

  it('takes required and disabled from the field', async () => {
    const wrapper = mountField({ required: true, disabled: true })
    await nextTick()
    const hidden = wrapper.find('input[aria-hidden="true"]').element as HTMLInputElement
    expect(hidden.required).toBe(true)
    expect(hidden.disabled).toBe(true)
    expect(segment(wrapper, 'hour').attributes('contenteditable')).toBe('false')
    expect(segment(wrapper, 'hour').attributes('aria-disabled')).toBe('true')
    wrapper.unmount()
  })

  it('keeps the control\'s own id, name and invalid state', async () => {
    const wrapper = mountField({}, { 'id': 'own', 'name': 'own-name', 'aria-invalid': 'false' })
    await nextTick()
    expect(wrapper.find('label').attributes('for')).toBe('own')
    // As with every `useFieldControl` participant, the control's own name wins.
    expect(wrapper.find('#own').attributes('name')).toBe('own-name')
    expect(wrapper.find('[role="group"]').attributes('aria-invalid')).toBe('false')
    wrapper.unmount()
  })
})
