import type { VueWrapper } from '@vue/test-utils'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { FieldLabel, FieldRoot } from '@/Field'
import { describeFieldControlContract } from '@/test/fieldControlContract'
import { ListboxContent, ListboxFilter, ListboxItem, ListboxRoot } from '.'

const fruits = ['Apple', 'Banana', 'Cherry']

function renderListbox(props: Record<string, unknown>) {
  return h(ListboxRoot, props, () => [
    h(ListboxFilter, { 'data-testid': 'filter', 'aria-label': 'Filter' }),
    h(ListboxContent, () => fruits.map(fruit => h(ListboxItem, { value: fruit }, () => fruit))),
  ])
}

const listbox = (wrapper: VueWrapper) => wrapper.find('[role="listbox"]').element as HTMLElement
const option = (wrapper: VueWrapper, text: string) => wrapper.findAll('[role="option"]').find(item => item.text() === text)!

describeFieldControlContract({
  name: 'Listbox',
  render: renderListbox,
  control: listbox,
  interact: wrapper => option(wrapper, 'Banana').trigger('click'),
  interactedValue: 'Banana',
  emptyValue: undefined,
  filledValue: 'Apple',
})

describeFieldControlContract({
  name: 'multiple Listbox',
  render: props => renderListbox({ ...props, multiple: true }),
  control: listbox,
  interact: wrapper => option(wrapper, 'Banana').trigger('click'),
  interactedValue: ['Banana'],
  emptyValue: [],
  filledValue: ['Apple'],
})

describe('given a Field-wrapped Listbox', () => {
  it('is only touched once focus leaves the listbox, not when it moves between its parts', async () => {
    const model = ref<string>()
    const Harness = defineComponent({
      setup: () => () => h(FieldRoot, { 'name': 'fruit', 'data-testid': 'field' }, () => [
        h(FieldLabel, () => 'Fruit'),
        renderListbox({ 'modelValue': model.value, 'onUpdate:modelValue': (value: string) => { model.value = value } }),
      ]),
    })
    const wrapper = mount(Harness, { attachTo: document.body })
    await flushPromises()
    const field = () => wrapper.find('[data-testid="field"]')

    ;(wrapper.find('[data-testid="filter"]').element as HTMLElement).focus()
    await nextTick()
    expect(field().attributes('data-focused')).toBe('')
    ;(option(wrapper, 'Cherry').element as HTMLElement).focus()
    await nextTick()
    expect(field().attributes('data-touched')).toBeUndefined()
    expect(field().attributes('data-focused')).toBe('')

    ;(option(wrapper, 'Cherry').element as HTMLElement).blur()
    await nextTick()
    expect(field().attributes('data-touched')).toBe('')
    expect(field().attributes('data-focused')).toBeUndefined()
    wrapper.unmount()
  })
})
