import type { VueWrapper } from '@vue/test-utils'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { FieldLabel, FieldRoot } from '@/Field'
import { FormRoot } from '@/Form'
import { convertToSpace, parseColor, setChannelValue } from '@/shared/color'
import { describeFieldControlContract } from '@/test/fieldControlContract'
import { ColorSliderRoot, ColorSliderThumb, ColorSliderTrack } from '.'

globalThis.ResizeObserver ??= class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const black = convertToSpace(parseColor('#000000'), 'rgb')

function renderColorSlider(props: Record<string, unknown>) {
  return h(ColorSliderRoot, { channel: 'red', colorSpace: 'rgb', ...props }, () => [
    h(ColorSliderTrack),
    h(ColorSliderThumb),
  ])
}

const thumb = (wrapper: VueWrapper) => wrapper.find('[role="slider"]')

describeFieldControlContract({
  name: 'ColorSlider',
  render: renderColorSlider,
  control: wrapper => thumb(wrapper).element as HTMLElement,
  interact: async (wrapper) => {
    ;(thumb(wrapper).element as HTMLElement).focus()
    await thumb(wrapper).trigger('keydown', { key: 'ArrowRight' })
    await flushPromises()
  },
  // The model: a `Color`.
  interactedValue: setChannelValue(black, 'red', 1),
  emptyValue: black,
  filledValue: convertToSpace(parseColor('#ff0000'), 'rgb'),
  // A color slider always has a value.
  noRequired: true,
})

describe('given a Field-wrapped ColorSlider', () => {
  it('registers the color rather than the inner slider\'s channel value, and keeps the channel name', async () => {
    const onFormSubmit = vi.fn()
    const Harness = defineComponent({
      setup: () => () => h(FormRoot, { onFormSubmit }, () => [
        h(FieldRoot, { 'name': 'color', 'data-testid': 'field', 'validate': () => 'Pick another' }, () => [
          h(FieldLabel, () => 'Accent'),
          renderColorSlider({ defaultValue: '#000000' }),
        ]),
        h('button', { type: 'submit' }, 'Submit'),
      ]),
    })
    const wrapper = mount(Harness, { attachTo: document.body })
    await nextTick()
    const thumbEl = thumb(wrapper).element as HTMLElement
    expect(thumbEl.getAttribute('aria-label')).toBe('Red')
    expect(thumbEl.getAttribute('aria-labelledby')).toBe(`${wrapper.find('label').attributes('id')} ${thumbEl.id}`)
    // The inner slider renders no number input of its own under the field's name.
    expect(wrapper.findAll('input[name="color"]').map(input => input.attributes('type'))).toEqual(['text'])

    await wrapper.find('button[type="submit"]').trigger('submit')
    await nextTick()
    expect(onFormSubmit).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(thumbEl)
    expect(wrapper.find('[data-testid="field"]').attributes('data-invalid')).toBe('')
    wrapper.unmount()
  })
})
