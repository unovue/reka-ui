import type { VueWrapper } from '@vue/test-utils'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { FieldLabel, FieldRoot } from '@/Field'
import { FormRoot } from '@/Form'
import { convertToSpace, parseColor, setChannelValue } from '@/shared/color'
import { describeFieldControlContract } from '@/test/fieldControlContract'
import { ColorAreaArea, ColorAreaRoot, ColorAreaThumb } from '.'

const red = convertToSpace(parseColor('#ff0000'), 'hsl')

function renderColorArea(props: Record<string, unknown>) {
  return h(ColorAreaRoot, props, () => h(ColorAreaArea, () => h(ColorAreaThumb)))
}

const inputs = (wrapper: VueWrapper) => wrapper.findAll('input[type="range"]')

describeFieldControlContract({
  name: 'ColorArea',
  render: renderColorArea,
  control: wrapper => inputs(wrapper)[0].element as HTMLElement,
  interact: async (wrapper) => {
    await inputs(wrapper)[0].setValue(10)
    await flushPromises()
  },
  // The model: a `Color`.
  interactedValue: setChannelValue(red, 'hue', 10),
  emptyValue: red,
  filledValue: convertToSpace(parseColor('#00ff00'), 'hsl'),
  // A color area always has a value.
  noRequired: true,
})

describe('given a Field-wrapped ColorArea', () => {
  function mountInField(onFormSubmit = vi.fn()) {
    const Harness = defineComponent({
      setup: () => () => h(FormRoot, { onFormSubmit }, () => [
        h(FieldRoot, { 'name': 'color', 'data-testid': 'field', 'validate': () => 'Pick another' }, () => [
          h(FieldLabel, () => 'Accent'),
          renderColorArea({ defaultValue: red }),
        ]),
        h('button', { type: 'submit' }, 'Submit'),
      ]),
    })
    const wrapper = mount(Harness, { attachTo: document.body })
    return { wrapper, field: () => wrapper.find('[data-testid="field"]') }
  }

  it('labels both axes with the field label and their channel name, and focuses the x axis when invalid', async () => {
    const onFormSubmit = vi.fn()
    const { wrapper } = mountInField(onFormSubmit)
    await nextTick()
    const labelId = wrapper.find('label').attributes('id')
    const [x, y] = inputs(wrapper).map(input => input.element as HTMLInputElement)
    expect(y.id).toBeTruthy()
    expect(y.id).not.toBe(x.id)
    expect(x.getAttribute('aria-labelledby')).toBe(`${labelId} ${x.id}`)
    expect(y.getAttribute('aria-labelledby')).toBe(`${labelId} ${y.id}`)
    expect(x.getAttribute('aria-label')).toBe('Hue')

    await wrapper.find('button[type="submit"]').trigger('submit')
    await nextTick()
    expect(onFormSubmit).not.toHaveBeenCalled()
    expect(x.getAttribute('aria-invalid')).toBe('true')
    expect(y.getAttribute('aria-invalid')).toBe('true')
    expect(document.activeElement).toBe(x)
    wrapper.unmount()
  })

  it('stays focused moving between axes, and is touched once focus leaves the area', async () => {
    const { wrapper, field } = mountInField()
    await nextTick()
    const [x, y] = inputs(wrapper).map(input => input.element as HTMLInputElement)
    x.focus()
    await nextTick()
    y.focus()
    await nextTick()
    expect(field().attributes('data-focused')).toBe('')
    expect(field().attributes('data-touched')).toBeUndefined()

    y.blur()
    await nextTick()
    expect(field().attributes('data-touched')).toBe('')
    wrapper.unmount()
  })
})
