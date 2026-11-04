import type { VueWrapper } from '@vue/test-utils'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { FieldLabel, FieldRoot } from '@/Field'
import { FormRoot } from '@/Form'
import { describeFieldControlContract, providedContext } from '@/test/fieldControlContract'
import { ComboboxAnchor, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxPortal, ComboboxRoot, ComboboxTrigger, ComboboxViewport } from '.'

const fruits = ['Apple', 'Banana', 'Cherry']

function renderCombobox(props: Record<string, unknown>) {
  return h(ComboboxRoot, props, () => [
    h(ComboboxAnchor, () => [
      h(ComboboxInput, { 'data-testid': 'input' }),
      h(ComboboxTrigger, { 'data-testid': 'trigger' }, () => 'Open'),
    ]),
    h(ComboboxPortal, () => h(ComboboxContent, { 'data-testid': 'content' }, () => h(ComboboxViewport, () =>
      fruits.map(fruit => h(ComboboxItem, { value: fruit }, () => fruit))))),
  ])
}

const input = (wrapper: VueWrapper) => wrapper.find('[data-testid="input"]').element as HTMLInputElement

async function selectItem(wrapper: VueWrapper, text: string) {
  await wrapper.find('[data-testid="trigger"]').trigger('click')
  await flushPromises()
  const item = Array.from(document.querySelectorAll('[role="option"]')).find(option => option.textContent === text) as HTMLElement
  item.click()
  await flushPromises()
}

describeFieldControlContract({
  name: 'Combobox',
  setProgrammatically: (wrapper, value) => providedContext(wrapper, ComboboxRoot, 'setModelValue').setModelValue(value),
  render: renderCombobox,
  control: input,
  interact: wrapper => selectItem(wrapper, 'Banana'),
  interactedValue: 'Banana',
  emptyValue: undefined,
  filledValue: 'Apple',
})

describeFieldControlContract({
  name: 'multiple Combobox',
  setProgrammatically: (wrapper, value) => providedContext(wrapper, ComboboxRoot, 'setModelValue').setModelValue(value),
  render: props => renderCombobox({ ...props, multiple: true }),
  control: input,
  interact: wrapper => selectItem(wrapper, 'Banana'),
  interactedValue: ['Banana'],
  emptyValue: [],
  filledValue: ['Apple'],
})

describe('given a Field-wrapped Combobox', () => {
  function mountInField(options: { form?: boolean, onFormSubmit?: (values: Record<string, unknown>) => void, inputAttrs?: Record<string, unknown> } = {}) {
    const model = ref<string | undefined>(undefined)
    const Harness = defineComponent({
      setup: () => () => {
        const field = h(FieldRoot, { 'name': 'fruit', 'data-testid': 'field' }, () => [
          h(FieldLabel, () => 'Fruit'),
          h(ComboboxRoot, { 'modelValue': model.value, 'onUpdate:modelValue': (value: unknown) => { model.value = value as string | undefined } }, () => [
            h(ComboboxAnchor, () => [
              h(ComboboxInput, { 'data-testid': 'input', ...options.inputAttrs }),
              h(ComboboxTrigger, { 'data-testid': 'trigger' }, () => 'Open'),
            ]),
            h(ComboboxPortal, () => h(ComboboxContent, () => h(ComboboxViewport, () =>
              fruits.map(fruit => h(ComboboxItem, { value: fruit }, () => fruit))))),
          ]),
        ])
        return options.form ? h(FormRoot, { onFormSubmit: options.onFormSubmit }, () => [field, h('button', { type: 'submit' }, 'Submit')]) : field
      },
    })
    const wrapper = mount(Harness, { attachTo: document.body })
    return { wrapper, model, field: () => wrapper.find('[data-testid="field"]') }
  }

  it('isn\'t dirtied by typing without selecting, and submits the selection rather than the text', async () => {
    const onFormSubmit = vi.fn()
    const { wrapper, field } = mountInField({ form: true, onFormSubmit })
    await nextTick()
    await wrapper.find('[data-testid="input"]').setValue('Ban')
    await flushPromises()
    expect(field().attributes('data-dirty')).toBeUndefined()

    const item = Array.from(document.querySelectorAll('[role="option"]')).find(option => option.textContent === 'Banana') as HTMLElement
    item.click()
    await flushPromises()
    expect(field().attributes('data-dirty')).toBe('')

    await wrapper.find('[data-testid="input"]').setValue('Che')
    await flushPromises()
    await wrapper.find('button[type="submit"]').trigger('submit')
    expect(onFormSubmit.mock.calls[0][0]).toEqual({ fruit: 'Banana' })
    wrapper.unmount()
  })

  it('isn\'t touched by opening the list, only once focus leaves the combobox', async () => {
    const { wrapper, field } = mountInField()
    await nextTick()
    const inputEl = input(wrapper)
    inputEl.focus()
    await nextTick()
    expect(field().attributes('data-focused')).toBe('')

    await wrapper.find('[data-testid="input"]').trigger('keydown', { key: 'ArrowDown' })
    await flushPromises()
    expect(inputEl.getAttribute('aria-expanded')).toBe('true')
    // Focus moving to another part of the combobox (the trigger, an item) stays inside.
    const trigger = wrapper.find('[data-testid="trigger"]').element as HTMLElement
    trigger.focus()
    await nextTick()
    const item = document.querySelector('[role="option"]') as HTMLElement
    item.focus()
    await nextTick()
    expect(field().attributes('data-touched')).toBeUndefined()
    expect(field().attributes('data-focused')).toBe('')

    item.blur()
    await nextTick()
    expect(field().attributes('data-touched')).toBe('')
    expect(field().attributes('data-focused')).toBeUndefined()
    wrapper.unmount()
  })

  it('merges a consumer id and aria ids with the field\'s', async () => {
    const { wrapper } = mountInField({ inputAttrs: { 'id': 'own', 'aria-describedby': 'hint' } })
    await nextTick()
    const inputEl = input(wrapper)
    expect(inputEl.id).toBe('own')
    expect(wrapper.find('label').attributes('for')).toBe('own')
    expect(inputEl.getAttribute('aria-describedby')).toBe('hint')
    expect(inputEl.getAttribute('aria-labelledby')).toBe(wrapper.find('label').attributes('id'))
    wrapper.unmount()
  })
})

describe('given a TagsInput composed into a Field-wrapped Combobox', () => {
  it('lets the Combobox own the field, wiring the shared input once', async () => {
    const { TagsInputInput, TagsInputRoot } = await import('@/TagsInput')
    const model = ref<string[]>([])
    const onFormSubmit = vi.fn()
    const Harness = defineComponent({
      setup: () => () => h(FormRoot, { onFormSubmit }, () => [
        h(FieldRoot, { name: 'fruits' }, () => [
          h(FieldLabel, () => 'Fruits'),
          h(ComboboxRoot, { 'modelValue': model.value, 'onUpdate:modelValue': (value: unknown) => { model.value = value as string[] }, 'multiple': true }, () => [
            h(ComboboxAnchor, () => [
              h(TagsInputRoot, { 'modelValue': model.value, 'onUpdate:modelValue': (value: unknown) => { model.value = value as string[] } }, () =>
                h(ComboboxInput, { asChild: true }, () => h(TagsInputInput, { 'data-testid': 'input' }))),
              h(ComboboxTrigger, { 'data-testid': 'trigger' }, () => 'Open'),
            ]),
            h(ComboboxPortal, () => h(ComboboxContent, () => h(ComboboxViewport, () =>
              fruits.map(fruit => h(ComboboxItem, { value: fruit }, () => fruit))))),
          ]),
        ]),
        h('button', { type: 'submit' }, 'Submit'),
      ]),
    })
    const wrapper = mount(Harness, { attachTo: document.body })
    await nextTick()

    const label = wrapper.find('label').element
    expect(input(wrapper).getAttribute('aria-labelledby')).toBe(label.id)
    expect(label.getAttribute('for')).toBe(input(wrapper).id)

    await selectItem(wrapper, 'Banana')
    await wrapper.find('button[type="submit"]').trigger('submit')
    expect(onFormSubmit.mock.calls[0][0]).toEqual({ fruits: ['Banana'] })
    wrapper.unmount()
  })
})

describe('given a required Field-wrapped Combobox whose input was removed', () => {
  it('focuses its trigger on an invalid submit', async () => {
    const showInput = ref(true)
    const wrapper = mount(defineComponent({
      setup: () => () => h(FormRoot, null, () => [
        h(FieldRoot, { name: 'fruit', required: true }, () => h(ComboboxRoot, null, () =>
          h(ComboboxAnchor, () => [
            showInput.value ? h(ComboboxInput, { 'data-testid': 'input' }) : null,
            h(ComboboxTrigger, { 'data-testid': 'trigger' }, () => 'Open'),
          ]))),
        h('button', { type: 'submit' }, 'Submit'),
      ]),
    }), { attachTo: document.body })
    await nextTick()
    showInput.value = false
    await flushPromises()
    await wrapper.find('button[type="submit"]').trigger('submit')
    await flushPromises()
    expect(document.activeElement).toBe(wrapper.find('[data-testid="trigger"]').element)
    wrapper.unmount()
  })
})

describe('given a Field-wrapped Combobox whose focused option is removed from the open popup', () => {
  it('leaves the field: unfocused, touched and validated on blur', async () => {
    const shown = ref([...fruits])
    const validate = vi.fn(() => null)
    const wrapper = mount(defineComponent({
      setup: () => () => h(FieldRoot, { 'name': 'fruit', 'data-testid': 'field', validate, 'validationMode': 'onBlur' }, () =>
        h(ComboboxRoot, null, () => [
          h(ComboboxAnchor, () => [h(ComboboxInput, { 'data-testid': 'input' }), h(ComboboxTrigger, { 'data-testid': 'trigger' }, () => 'Open')]),
          h(ComboboxPortal, () => h(ComboboxContent, () => h(ComboboxViewport, () =>
            shown.value.map(fruit => h(ComboboxItem, { 'key': fruit, 'value': fruit, 'data-testid': fruit }, () => fruit))))),
        ])),
    }), { attachTo: document.body })
    await nextTick()
    const field = () => wrapper.find('[data-testid="field"]')
    input(wrapper).focus()
    await wrapper.find('[data-testid="trigger"]').trigger('click')
    await flushPromises()
    const option = document.querySelector<HTMLElement>('[data-testid="Banana"]')!
    option.tabIndex = -1
    option.focus()
    await flushPromises()
    expect(document.activeElement).toBe(option)
    expect(field().attributes('data-focused')).toBe('')

    shown.value = fruits.filter(fruit => fruit !== 'Banana')
    await flushPromises()
    expect(option.isConnected).toBe(false)
    expect(field().attributes('data-focused')).toBeUndefined()
    expect(field().attributes('data-touched')).toBe('')
    expect(validate).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })
})

describe('given a Field-wrapped Combobox whose input was removed', () => {
  it.each([
    ['its own id', { id: 'own' }],
    ['the field\'s id', {}],
  ])('points the label at the trigger rather than the removed input (%s)', async (_, inputAttrs) => {
    const showInput = ref(true)
    const wrapper = mount(defineComponent({
      setup: () => () => h(FieldRoot, { name: 'fruit' }, () => [
        h(FieldLabel, () => 'Fruit'),
        h(ComboboxRoot, null, () =>
          h(ComboboxAnchor, () => [
            showInput.value ? h(ComboboxInput, { 'data-testid': 'input', ...inputAttrs }) : null,
            h(ComboboxTrigger, { 'data-testid': 'trigger' }, () => 'Open'),
          ])),
      ]),
    }), { attachTo: document.body })
    await flushPromises()
    const label = () => wrapper.find('label').element as HTMLLabelElement
    expect(document.getElementById(label().htmlFor)).toBe(input(wrapper))

    showInput.value = false
    await flushPromises()
    const trigger = wrapper.find('[data-testid="trigger"]').element
    expect(document.getElementById(label().htmlFor)).toBe(trigger)
    wrapper.unmount()
  })

  it('keeps a consumer id on the trigger', async () => {
    const wrapper = mount(defineComponent({
      setup: () => () => h(FieldRoot, { name: 'fruit' }, () => [
        h(FieldLabel, () => 'Fruit'),
        h(ComboboxRoot, null, () => h(ComboboxAnchor, () => h(ComboboxTrigger, { id: 'own-trigger' }, () => 'Open'))),
      ]),
    }), { attachTo: document.body })
    await flushPromises()
    expect(wrapper.find('label').attributes('for')).toBe('own-trigger')
    wrapper.unmount()
  })
})

describe('given a Field-wrapped Combobox whose focused part is removed without a blur', () => {
  it('leaves the field when the focused input is removed while the popup is closed', async () => {
    const showInput = ref(true)
    const validate = vi.fn(() => null)
    const wrapper = mount(defineComponent({
      setup: () => () => h(FieldRoot, { 'name': 'fruit', 'data-testid': 'field', validate, 'validationMode': 'onBlur' }, () =>
        h(ComboboxRoot, null, () => h(ComboboxAnchor, () => [
          showInput.value ? h(ComboboxInput, { 'data-testid': 'input' }) : null,
          h(ComboboxTrigger, () => 'Open'),
        ]))),
    }), { attachTo: document.body })
    await flushPromises()
    const field = () => wrapper.find('[data-testid="field"]')
    const inputEl = input(wrapper)
    inputEl.focus()
    await flushPromises()
    expect(field().attributes('data-focused')).toBe('')

    // jsdom, like Firefox and WebKit, fires no `blur` for the removed input.
    showInput.value = false
    await flushPromises()
    expect(inputEl.isConnected).toBe(false)
    expect(field().attributes('data-focused')).toBeUndefined()
    expect(field().attributes('data-touched')).toBe('')
    expect(validate).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('leaves the field when the content holding a focused option is removed while open', async () => {
    const showContent = ref(true)
    const validate = vi.fn(() => null)
    const wrapper = mount(defineComponent({
      setup: () => () => h(FieldRoot, { 'name': 'fruit', 'data-testid': 'field', validate, 'validationMode': 'onBlur' }, () =>
        h(ComboboxRoot, { open: true }, () => [
          h(ComboboxAnchor, () => h(ComboboxInput, { 'data-testid': 'input' })),
          h(ComboboxPortal, () => showContent.value
            ? h(ComboboxContent, () => h(ComboboxViewport, () =>
                fruits.map(fruit => h(ComboboxItem, { 'key': fruit, 'value': fruit, 'data-testid': fruit }, () => fruit))))
            : null),
        ])),
    }), { attachTo: document.body })
    await flushPromises()
    const field = () => wrapper.find('[data-testid="field"]')
    input(wrapper).focus()
    await flushPromises()
    const option = document.querySelector<HTMLElement>('[data-testid="Banana"]')!
    option.tabIndex = -1
    option.focus()
    await flushPromises()
    expect(document.activeElement).toBe(option)
    expect(field().attributes('data-focused')).toBe('')

    showContent.value = false
    await flushPromises()
    expect(option.isConnected).toBe(false)
    expect(field().attributes('data-focused')).toBeUndefined()
    expect(field().attributes('data-touched')).toBe('')
    expect(validate).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })
})

describe('given a Field-wrapped Combobox with only a trigger', () => {
  it('is focused by the trigger, and touched and validated once it blurs', async () => {
    const validate = vi.fn(() => null)
    const wrapper = mount(defineComponent({
      setup: () => () => h(FieldRoot, { 'name': 'fruit', 'data-testid': 'field', validate, 'validationMode': 'onBlur' }, () =>
        h(ComboboxRoot, null, () => h(ComboboxAnchor, () => h(ComboboxTrigger, { 'data-testid': 'trigger' }, () => 'Open')))),
    }), { attachTo: document.body })
    await flushPromises()
    const field = () => wrapper.find('[data-testid="field"]')
    const trigger = wrapper.find('[data-testid="trigger"]').element as HTMLElement
    trigger.focus()
    await nextTick()
    expect(field().attributes('data-focused')).toBe('')
    expect(field().attributes('data-touched')).toBeUndefined()

    trigger.blur()
    await nextTick()
    expect(field().attributes('data-focused')).toBeUndefined()
    expect(field().attributes('data-touched')).toBe('')
    expect(validate).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })
})

describe('given a required Field-wrapped Combobox whose as-child part is replaced while it stays mounted', () => {
  function mountSwapping(part: 'input' | 'trigger') {
    const swapped = ref(false)
    const child = () => h(part === 'input' ? 'input' : 'button', { 'key': swapped.value ? 'b' : 'a', 'data-testid': swapped.value ? 'b' : 'a' }, part === 'trigger' ? 'Open' : undefined)
    const wrapper = mount(defineComponent({
      setup: () => () => h(FormRoot, null, () => [
        h(FieldRoot, { name: 'fruit', required: true }, () => [
          h(FieldLabel, () => 'Fruit'),
          h(ComboboxRoot, null, () => h(ComboboxAnchor, () => part === 'input'
            ? [h(ComboboxInput, { asChild: true }, child), h(ComboboxTrigger, { 'data-testid': 'trigger' }, () => 'Open')]
            : h(ComboboxTrigger, { asChild: true }, child))),
        ]),
        h('button', { type: 'submit' }, 'Submit'),
      ]),
    }), { attachTo: document.body })
    return { wrapper, swapped }
  }

  it.each(['input', 'trigger'] as const)('focuses and labels the replacement %s', async (part) => {
    const { wrapper, swapped } = mountSwapping(part)
    await flushPromises()
    swapped.value = true
    await flushPromises()
    expect(wrapper.find('[data-testid="a"]').exists()).toBe(false)
    const replacement = wrapper.find('[data-testid="b"]').element as HTMLElement
    expect(document.getElementById(wrapper.find('label').attributes('for')!)).toBe(replacement)
    await wrapper.find('button[type="submit"]').trigger('submit')
    await flushPromises()
    expect(document.activeElement).toBe(replacement)
    wrapper.unmount()
  })
})

describe('given a Field-wrapped Combobox whose trigger unmounts', () => {
  it('no longer holds the removed trigger as the element the field focuses', async () => {
    const showTrigger = ref(true)
    const wrapper = mount(defineComponent({
      setup: () => () => h(FieldRoot, { name: 'fruit' }, () =>
        h(ComboboxRoot, null, () => h(ComboboxAnchor, () => showTrigger.value ? h(ComboboxTrigger, () => 'Open') : null))),
    }), { attachTo: document.body })
    await flushPromises()
    const context = providedContext<{ triggerElement: { value: HTMLElement | undefined } }>(wrapper, ComboboxRoot, 'onTriggerElementChange')
    expect(context.triggerElement.value?.isConnected).toBe(true)
    showTrigger.value = false
    await flushPromises()
    expect(context.triggerElement.value).toBeUndefined()
    wrapper.unmount()
  })
})
