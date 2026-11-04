import type { VueWrapper } from '@vue/test-utils'
import type { Color } from '@/shared/color'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { FieldLabel, FieldRoot } from '@/Field'
import { FormRoot } from '@/Form'
import { colorToString } from '@/shared/color'
import { describeFieldControlContract } from '@/test/fieldControlContract'
import { ColorFieldInput, ColorFieldRoot } from '.'

function render(props: Record<string, unknown>, inputProps: Record<string, unknown> = {}) {
  return h(ColorFieldRoot, props, () => h(ColorFieldInput, inputProps))
}

const input = (wrapper: VueWrapper) => wrapper.find('input:not([aria-hidden])')

async function type(wrapper: VueWrapper, text: string) {
  const element = input(wrapper).element as HTMLInputElement
  element.focus()
  await input(wrapper).setValue(text)
  element.blur()
  await flushPromises()
}

const hex = (value: unknown) => typeof value === 'string' ? value : colorToString(value as Color, 'hex')

describeFieldControlContract({
  name: 'ColorField',
  render: props => render(props),
  control: wrapper => input(wrapper).element as HTMLElement,
  interact: wrapper => type(wrapper, '#ff0000'),
  interactedValue: '#ff0000',
  serialize: hex,
  emptyValue: '#000000',
  filledValue: '#00ff00',
  // A color field always holds a color.
  noRequired: true,
})

describe('given a Field-wrapped ColorField', () => {
  function mountField(options: { fieldProps?: Record<string, unknown>, inputProps?: Record<string, unknown> } = {}) {
    const onFormSubmit = vi.fn()
    const model = ref<string | Color>('#000000')
    const wrapper = mount(defineComponent({
      setup: () => () => h(FormRoot, { onFormSubmit }, () => [
        h(FieldRoot, { 'name': 'color', 'data-testid': 'field', ...options.fieldProps }, () => [
          h(FieldLabel, () => 'Color'),
          render({ 'modelValue': model.value, 'onUpdate:modelValue': (value: Color) => { model.value = value } }, options.inputProps),
        ]),
        h('button', { type: 'submit' }, 'Submit'),
      ]),
    }), { attachTo: document.body })
    const field = () => wrapper.find('[data-testid="field"]')
    return { wrapper, model, field, onFormSubmit }
  }

  it('collects the Color, as emitted, and names the hidden input after the field', async () => {
    const { wrapper, onFormSubmit } = mountField()
    await nextTick()
    await type(wrapper, '#123456')
    expect((wrapper.find('input[aria-hidden]').element as HTMLInputElement).name).toBe('color')
    await wrapper.find('button[type="submit"]').trigger('submit')
    const value = onFormSubmit.mock.calls[0][0].color as Color
    expect(typeof value).toBe('object')
    expect(hex(value)).toBe('#123456')
    wrapper.unmount()
  })

  it('is touched once the input blurs, and stepping is user input', async () => {
    const { wrapper, field } = mountField()
    await nextTick()
    const element = input(wrapper).element as HTMLInputElement
    element.focus()
    await nextTick()
    expect(field().attributes('data-focused')).toBe('')
    await input(wrapper).trigger('keydown', { key: 'ArrowUp' })
    await flushPromises()
    expect(field().attributes('data-dirty')).toBe('')
    element.blur()
    await flushPromises()
    expect(field().attributes('data-touched')).toBe('')
    expect(field().attributes('data-focused')).toBeUndefined()
    wrapper.unmount()
  })

  it('points the label at the input\'s own id', async () => {
    const { wrapper } = mountField({ inputProps: { id: 'swatch' } })
    await nextTick()
    expect(input(wrapper).attributes('id')).toBe('swatch')
    expect(wrapper.find('label').attributes('for')).toBe('swatch')
    wrapper.unmount()
  })

  it('keeps marking rejected text invalid while the field is valid', async () => {
    const { wrapper } = mountField()
    await nextTick()
    await type(wrapper, 'not a color')
    expect(input(wrapper).attributes('aria-invalid')).toBe('true')
    wrapper.unmount()
  })

  it('marks the input invalid with the field, unless the consumer says otherwise', async () => {
    const { wrapper } = mountField({ fieldProps: { invalid: true } })
    await nextTick()
    expect(input(wrapper).attributes('aria-invalid')).toBe('true')
    wrapper.unmount()

    const second = mountField({ fieldProps: { invalid: true }, inputProps: { 'aria-invalid': 'false' } })
    await nextTick()
    expect(input(second.wrapper).attributes('aria-invalid')).toBe('false')
    second.wrapper.unmount()
  })

  it('disables the input with the field', async () => {
    const { wrapper } = mountField({ fieldProps: { disabled: true } })
    await nextTick()
    expect(input(wrapper).attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })
})
