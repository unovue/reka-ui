import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { ListboxContent, ListboxItem, ListboxRoot } from '@/Listbox'
import { NumberFieldInput, NumberFieldRoot } from '@/NumberField'
import { ToggleGroupItem, ToggleGroupRoot } from '@/ToggleGroup'
import VisuallyHiddenInput from './VisuallyHiddenInput.vue'

function mountInput(initial: unknown, props: Record<string, unknown> = {}) {
  const value = ref<unknown>(initial)
  const events: string[] = []
  const wrapper = mount(defineComponent({
    setup: () => () => h('form', {
      onInput: () => events.push('input'),
      onChange: () => events.push('change'),
    }, [h(VisuallyHiddenInput, { name: 'field', value: value.value, ...props })]),
  }), { attachTo: document.body })

  const inputs = () => wrapper.findAll('input').map(input => [input.element.name, input.element.value])
  const set = async (next: unknown) => {
    value.value = next
    await nextTick()
  }
  return { wrapper, inputs, set, events }
}

describe('visuallyHiddenInput', () => {
  describe('an empty value', () => {
    it.each([
      ['undefined', undefined],
      ['null', null],
      ['an empty string', ''],
    ])('renders an empty input when mounted with %s', (_name, empty) => {
      const { wrapper, inputs } = mountInput(empty)
      expect(inputs()).toEqual([['field', '']])
      wrapper.unmount()
    })

    it.each([
      ['undefined', undefined],
      ['null', null],
      ['an empty string', ''],
    ])('empties the input when the value becomes %s', async (_name, empty) => {
      const { wrapper, inputs, set, events } = mountInput('apple')
      expect(inputs()).toEqual([['field', 'apple']])

      await set(empty)
      expect(inputs()).toEqual([['field', '']])
      // The change still bubbles to the form.
      expect(events).toEqual(['input', 'change'])

      await set('banana')
      expect(inputs()).toEqual([['field', 'banana']])
      wrapper.unmount()
    })

    it.each([
      ['undefined', undefined],
      ['null', null],
    ])('empties the input of an object property that becomes %s', async (_name, empty) => {
      const { wrapper, inputs, set } = mountInput({ id: 1, label: 'Apple' })
      expect(inputs()).toEqual([['field[id]', '1'], ['field[label]', 'Apple']])

      await set({ id: 1, label: empty })
      expect(inputs()).toEqual([['field[id]', '1'], ['field[label]', '']])
      wrapper.unmount()
    })

    it('empties the input of an array item that becomes undefined', async () => {
      const { wrapper, inputs, set } = mountInput(['apple', 'banana'])
      expect(inputs()).toEqual([['field[0]', 'apple'], ['field[1]', 'banana']])

      await set(['apple', undefined])
      expect(inputs()).toEqual([['field[0]', 'apple'], ['field[1]', '']])
      wrapper.unmount()
    })

    it('renders an empty input for a null array item', () => {
      const { wrapper, inputs } = mountInput(['apple', null])
      expect(inputs()).toEqual([['field[0]', 'apple'], ['field[1]', '']])
      wrapper.unmount()
    })

    it('keeps a required empty input invalid', async () => {
      const { wrapper, set } = mountInput('apple', { required: true })
      const input = wrapper.get('input').element
      expect(input.validity.valueMissing).toBe(false)

      await set(undefined)
      expect(input.validity.valueMissing).toBe(true)
      wrapper.unmount()
    })
  })

  describe('serialisation', () => {
    it.each([
      ['a string', 'apple', [['field', 'apple']]],
      ['a number', 0, [['field', '0']]],
      ['a boolean', false, [['field', 'false']]],
      ['an array of primitives', ['apple', 2], [['field[0]', 'apple'], ['field[1]', '2']]],
      ['an array of objects', [{ id: 1, label: 'Apple' }], [['field[0][id]', '1'], ['field[0][label]', 'Apple']]],
      ['an object', { agree: true, plan: 'pro' }, [['field[agree]', 'true'], ['field[plan]', 'pro']]],
      ['an empty array', [], []],
    ])('keeps the names and values of %s', (_name, value, expected) => {
      const { wrapper, inputs } = mountInput(value)
      expect(inputs()).toEqual(expected)
      wrapper.unmount()
    })

    it('renders a single empty input for a required empty array', () => {
      const { wrapper, inputs } = mountInput([], { required: true })
      expect(inputs()).toEqual([['field', '']])
      wrapper.unmount()
    })

    it('does not write the checked state of a checkable input to its value', async () => {
      const checked = ref(true)
      const wrapper = mount(defineComponent({
        setup: () => () => h('form', [h(VisuallyHiddenInput, { name: 'field', type: 'checkbox', value: 'on', checked: checked.value })]),
      }), { attachTo: document.body })
      const input = wrapper.get('input').element

      checked.value = false
      await nextTick()
      expect(input.checked).toBe(false)
      expect(input.value).toBe('on')
      wrapper.unmount()
    })
  })
})

describe('hidden input of a component whose value is emptied', () => {
  const hiddenInput = (form: Element) => form.querySelector<HTMLInputElement>('input[name="field"]')!

  it('listbox: deselecting the selected item', async () => {
    const wrapper = mount(defineComponent({
      setup: () => () => h('form', [
        h(ListboxRoot, { name: 'field', required: true }, () => h(ListboxContent, () => [
          h(ListboxItem, { value: 'apple' }, () => 'Apple'),
        ])),
      ]),
    }), { attachTo: document.body })

    await wrapper.get('[role="option"]').trigger('click')
    expect(hiddenInput(wrapper.element).value).toBe('apple')

    await wrapper.get('[role="option"]').trigger('click')
    expect(hiddenInput(wrapper.element).value).toBe('')
    expect(hiddenInput(wrapper.element).validity.valueMissing).toBe(true)
    wrapper.unmount()
  })

  it('toggleGroup: unpressing the pressed item', async () => {
    const wrapper = mount(defineComponent({
      setup: () => () => h('form', [
        h(ToggleGroupRoot, { name: 'field', required: true, type: 'single' }, () => [
          h(ToggleGroupItem, { value: 'bold' }, () => 'Bold'),
        ]),
      ]),
    }), { attachTo: document.body })

    await wrapper.get('button').trigger('click')
    expect(hiddenInput(wrapper.element).value).toBe('bold')

    await wrapper.get('button').trigger('click')
    expect(hiddenInput(wrapper.element).value).toBe('')
    expect(hiddenInput(wrapper.element).validity.valueMissing).toBe(true)
    wrapper.unmount()
  })

  it('numberField: clearing a controlled value', async () => {
    const model = ref<number | undefined>(5)
    const wrapper = mount(defineComponent({
      setup: () => () => h('form', [
        h(NumberFieldRoot, { name: 'field', required: true, modelValue: model.value }, () => h(NumberFieldInput)),
      ]),
    }), { attachTo: document.body })
    await nextTick()
    expect(hiddenInput(wrapper.element).value).toBe('5')

    model.value = undefined
    await nextTick()
    expect(hiddenInput(wrapper.element).value).toBe('')
    expect(hiddenInput(wrapper.element).validity.valueMissing).toBe(true)
    wrapper.unmount()
  })
})
