import type { VueWrapper } from '@vue/test-utils'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { FieldControl, FieldLabel, FieldRoot } from '@/Field'
import { FormRoot } from '@/Form'
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

describe('given a Field-wrapped Listbox whose content element changes', () => {
  it('focuses into the current content element on an invalid submit', async () => {
    const as = ref('div')
    const wrapper = mount(defineComponent({
      setup: () => () => h(FormRoot, null, () => [
        h(FieldRoot, { name: 'fruit', required: true }, () => h(ListboxRoot, null, () =>
          h(ListboxContent, { as: as.value }, () => fruits.map(fruit => h(ListboxItem, { value: fruit }, () => fruit))))),
        h('button', { type: 'submit' }, 'Submit'),
      ]),
    }), { attachTo: document.body })
    await flushPromises()
    as.value = 'section'
    await flushPromises()
    await wrapper.find('button[type="submit"]').trigger('submit')
    await flushPromises()
    const content = wrapper.find('[role="listbox"]').element
    expect(content.tagName).toBe('SECTION')
    // Focusing the listbox moves focus on to its first item.
    expect(content.contains(document.activeElement)).toBe(true)
    wrapper.unmount()
  })
})

describe('given a required Field-wrapped Listbox whose content element is removed while ListboxContent stays mounted', () => {
  it.each([
    ['before', true],
    ['after', false],
  ])('moves an invalid submit\'s focus to another invalid field (%s it)', async (_, listboxFirst) => {
    const showList = ref(true)
    const listboxField = () => h(FieldRoot, { name: 'fruit', required: true }, () => h(ListboxRoot, null, () =>
      h(ListboxContent, { asChild: true }, () => showList.value
        ? h('div', { 'data-testid': 'list' }, fruits.map(fruit => h(ListboxItem, { value: fruit }, () => fruit)))
        : null)))
    const inputField = () => h(FieldRoot, { name: 'name', required: true }, () => h(FieldControl, { 'data-testid': 'name' }))
    const wrapper = mount(defineComponent({
      setup: () => () => h(FormRoot, null, () => [
        ...(listboxFirst ? [listboxField(), inputField()] : [inputField(), listboxField()]),
        h('button', { type: 'submit' }, 'Submit'),
      ]),
    }), { attachTo: document.body })
    await flushPromises()
    expect(wrapper.find('[data-testid="list"]').exists()).toBe(true)
    showList.value = false
    await flushPromises()
    expect(wrapper.find('[data-testid="list"]').exists()).toBe(false)

    await wrapper.find('button[type="submit"]').trigger('submit')
    await flushPromises()
    expect(document.activeElement).toBe(wrapper.find('[data-testid="name"]').element)
    wrapper.unmount()
  })
})
