import type { VueWrapper } from '@vue/test-utils'
import { fireEvent } from '@testing-library/vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { FieldControl, FieldLabel, FieldRoot } from '@/Field'
import { FormRoot } from '@/Form'
import { PopperRoot } from '@/Popper'
import { describeFieldControlContract, providedContext } from '@/test/fieldControlContract'
import { SelectContent, SelectItem, SelectPortal, SelectRoot, SelectTrigger, SelectViewport } from '.'

beforeAll(() => {
  // The trigger's Popper machinery expects these during mount.
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.HTMLElement.prototype.releasePointerCapture = vi.fn()
  window.HTMLElement.prototype.hasPointerCapture = vi.fn()
  window.HTMLElement.prototype.scrollIntoView = vi.fn()
})

const fruits = ['Apple', 'Banana', 'Cherry']

function renderSelect(props: Record<string, unknown>, triggerProps: Record<string, unknown> = {}) {
  return h(SelectRoot, props, () => [
    h(SelectTrigger, { 'data-testid': 'trigger', ...triggerProps }, () => 'Fruit'),
    h(SelectPortal, () => h(SelectContent, () => h(SelectViewport, () =>
      fruits.map(fruit => h(SelectItem, { value: fruit }, () => fruit))))),
  ])
}

const trigger = (wrapper: VueWrapper) => wrapper.find('[data-testid="trigger"]').element as HTMLElement

async function selectItem(wrapper: VueWrapper, text: string) {
  await fireEvent.pointerDown(trigger(wrapper), { button: 0, ctrlKey: false })
  await flushPromises()
  const option = Array.from(document.querySelectorAll('[role="option"]')).find(item => item.textContent === text) as HTMLElement
  option.focus()
  // Twice: the content ignores a first pointerup that follows the opening press.
  await fireEvent.pointerUp(option)
  await fireEvent.pointerUp(option)
  await flushPromises()
}

describeFieldControlContract({
  name: 'Select',
  setProgrammatically: (wrapper, value) => providedContext(wrapper, SelectRoot, 'onValueChange').onValueChange(value),
  render: props => renderSelect(props),
  control: trigger,
  interact: wrapper => selectItem(wrapper, 'Banana'),
  interactedValue: 'Banana',
  emptyValue: undefined,
  filledValue: 'Apple',
})

describe('given a Select and a Field', () => {
  function mountInForm(render: () => ReturnType<typeof h>, fieldProps: Record<string, unknown> = {}) {
    const onFormSubmit = vi.fn()
    const wrapper = mount(defineComponent(() => () => h(FormRoot, { onFormSubmit }, () => [
      h(FieldRoot, { 'name': 'fruit', 'data-testid': 'field', ...fieldProps }, () => [h(FieldLabel, () => 'Fruit'), render()]),
      h('button', { type: 'submit' }, 'Submit'),
    ])), { attachTo: document.body })
    return { wrapper, onFormSubmit }
  }

  it('a disabled trigger is not marked invalid', async () => {
    const enabled = mountInForm(() => renderSelect({}), { invalid: true })
    await nextTick()
    expect(trigger(enabled.wrapper).getAttribute('aria-invalid')).toBe('true')
    enabled.wrapper.unmount()

    for (const render of [() => renderSelect({ disabled: true }), () => renderSelect({}, { disabled: true })]) {
      const { wrapper } = mountInForm(render, { invalid: true })
      await nextTick()
      expect(trigger(wrapper).getAttribute('aria-invalid')).toBeNull()
      // The field's state attributes still describe the field.
      expect(trigger(wrapper).hasAttribute('data-invalid')).toBe(true)
      wrapper.unmount()
    }
  })

  it('takes the trigger\'s own id for the label', async () => {
    const { wrapper } = mountInForm(() => renderSelect({}, { id: 'own-id' }))
    await nextTick()
    expect(wrapper.find('label').attributes('for')).toBe('own-id')
    wrapper.unmount()
  })

  // The root is the field's control, so the field has its value whether or not a trigger is mounted.
  describe('without a mounted trigger', () => {
    const renderWithoutTrigger = (props: Record<string, unknown>) => () => h(SelectRoot, props)

    it('is filled by its value, which the form collects', async () => {
      const { wrapper, onFormSubmit } = mountInForm(renderWithoutTrigger({ defaultValue: 'Apple' }))
      await nextTick()
      expect(wrapper.find('[data-testid="field"]').attributes('data-filled')).toBe('')
      await wrapper.find('button[type="submit"]').trigger('submit')
      expect(onFormSubmit.mock.calls[0][0]).toEqual({ fruit: 'Apple' })
      wrapper.unmount()
    })

    it('blocks submission when required and empty', async () => {
      const { wrapper, onFormSubmit } = mountInForm(renderWithoutTrigger({}), { required: true })
      await nextTick()
      await wrapper.find('button[type="submit"]').trigger('submit')
      await nextTick()
      expect(onFormSubmit).not.toHaveBeenCalled()
      expect(wrapper.find('[data-testid="field"]').attributes('data-invalid')).toBe('')
      wrapper.unmount()
    })
  })

  it('focuses the rendered trigger after its element changes', async () => {
    const onFormSubmit = vi.fn()
    const Harness = defineComponent({
      props: { as: { type: String, default: 'button' } },
      setup: props => () => h(FormRoot, { onFormSubmit }, () => [
        h(FieldRoot, { name: 'fruit', required: true }, () => [h(FieldLabel, () => 'Fruit'), renderSelect({}, { as: props.as, tabindex: 0 })]),
        h('button', { type: 'submit' }, 'Submit'),
      ]),
    })
    const wrapper = mount(Harness, { attachTo: document.body })
    await nextTick()
    const before = trigger(wrapper)
    await wrapper.setProps({ as: 'div' })
    await nextTick()
    expect(trigger(wrapper)).not.toBe(before)

    await wrapper.find('button[type="submit"]').trigger('submit')
    await nextTick()
    expect(onFormSubmit).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(trigger(wrapper))
    expect(wrapper.find('label').attributes('for')).toBe(trigger(wrapper).id)
    wrapper.unmount()
  })

  it('keeps its value and state for the field while the trigger is replaced', async () => {
    const Harness = defineComponent({
      props: { show: { type: Boolean, default: true } },
      setup: props => () => h(FieldRoot, { 'name': 'fruit', 'data-testid': 'field' }, () => [
        h(FieldLabel, () => 'Fruit'),
        h(SelectRoot, { defaultValue: 'Apple' }, () => props.show ? h(SelectTrigger, { 'data-testid': 'trigger' }, () => 'Fruit') : null),
      ]),
    })
    const wrapper = mount(Harness, { attachTo: document.body })
    await nextTick()
    const field = () => wrapper.find('[data-testid="field"]')
    trigger(wrapper).focus()
    await nextTick()
    expect(field().attributes('data-focused')).toBe('')

    await wrapper.setProps({ show: false })
    await nextTick()
    expect(field().attributes('data-focused')).toBeUndefined()
    expect(field().attributes('data-filled')).toBe('')

    await wrapper.setProps({ show: true })
    await nextTick()
    expect(wrapper.find('label').attributes('for')).toBe(trigger(wrapper).id)
    expect(field().attributes('data-dirty')).toBeUndefined()
    wrapper.unmount()
  })
})

describe('given a Select whose trigger unmounts', () => {
  const rootTrigger = (wrapper: VueWrapper) => providedContext<{ triggerElement: { value: HTMLElement | undefined } }>(wrapper, SelectRoot, 'onTriggerChange').triggerElement.value

  const anchor = (wrapper: VueWrapper) => providedContext<{ anchor: { value: unknown } }>(wrapper, PopperRoot, 'onAnchorChange').anchor.value

  for (const selectFirst of [true, false]) {
    it(`an invalid submit focuses a mounted control, not the removed trigger (select ${selectFirst ? 'before' : 'after'} it)`, async () => {
      const onFormSubmit = vi.fn()
      const Harness = defineComponent({
        props: { show: { type: Boolean, default: true } },
        setup: props => () => {
          const select = h(FieldRoot, { name: 'fruit', required: true }, () => [
            h(FieldLabel, () => 'Fruit'),
            h(SelectRoot, {}, () => props.show ? h(SelectTrigger, { 'data-testid': 'trigger', 'id': 'own-id' }, () => 'Fruit') : null),
          ])
          const text = h(FieldRoot, { name: 'name', required: true }, () => h(FieldControl, { 'data-testid': 'text' }))
          return h(FormRoot, { onFormSubmit }, () => [...(selectFirst ? [select, text] : [text, select]), h('button', { type: 'submit' }, 'Submit')])
        },
      })
      const wrapper = mount(Harness, { attachTo: document.body })
      await nextTick()
      expect(wrapper.find('label').attributes('for')).toBe('own-id')

      await wrapper.setProps({ show: false })
      await nextTick()
      expect(rootTrigger(wrapper)).toBeUndefined()
      expect(anchor(wrapper)).toBeUndefined()
      // As for a Select that never had a trigger: the field's own id.
      expect(wrapper.find('label').attributes('for')).not.toBe('own-id')

      await wrapper.find('button[type="submit"]').trigger('submit')
      await nextTick()
      expect(onFormSubmit).not.toHaveBeenCalled()
      expect(document.activeElement).toBe(wrapper.find('[data-testid="text"]').element)
      wrapper.unmount()
    })
  }

  it('keeps its native select in a form, as a Select that never had a trigger does', async () => {
    const Harness = defineComponent({
      props: { show: { type: Boolean, default: true } },
      setup: props => () => h('form', [
        h(SelectRoot, { name: 'fruit', defaultValue: 'Apple' }, () => props.show ? h(SelectTrigger, { 'data-testid': 'trigger' }, () => 'Fruit') : null),
      ]),
    })
    const wrapper = mount(Harness, { attachTo: document.body })
    await nextTick()
    expect(wrapper.find('select[name="fruit"]').exists()).toBe(true)
    await wrapper.setProps({ show: false })
    await nextTick()
    expect(wrapper.find('select[name="fruit"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('a trigger that replaces it in the same tick becomes the root\'s trigger', async () => {
    const onFormSubmit = vi.fn()
    const Harness = defineComponent({
      props: { second: Boolean },
      setup: props => () => h(FormRoot, { onFormSubmit }, () => [
        h(FieldRoot, { name: 'fruit', required: true }, () => [
          h(FieldLabel, () => 'Fruit'),
          h(SelectRoot, {}, () => props.second
            ? h(SelectTrigger, { 'key': 'b', 'data-testid': 'b' }, () => 'B')
            : h(SelectTrigger, { 'key': 'a', 'data-testid': 'a' }, () => 'A')),
        ]),
        h('button', { type: 'submit' }, 'Submit'),
      ]),
    })
    const wrapper = mount(Harness, { attachTo: document.body })
    await nextTick()
    expect(rootTrigger(wrapper)).toBe(wrapper.find('[data-testid="a"]').element)

    await wrapper.setProps({ second: true })
    await nextTick()
    const b = wrapper.find('[data-testid="b"]').element
    expect(rootTrigger(wrapper)).toBe(b)
    expect(anchor(wrapper)).toBe(b)
    await wrapper.find('button[type="submit"]').trigger('submit')
    await nextTick()
    expect(document.activeElement).toBe(b)
    expect(wrapper.find('label').attributes('for')).toBe(b.id)
    wrapper.unmount()
  })

  it('does not clear a trigger that took its place in an earlier tick', async () => {
    const Harness = defineComponent({
      props: { first: { type: Boolean, default: true }, second: Boolean },
      setup: props => () => h(FieldRoot, { name: 'fruit' }, () => h(SelectRoot, {}, () => [
        props.first ? h(SelectTrigger, { 'key': 'a', 'data-testid': 'a' }, () => 'A') : null,
        props.second ? h(SelectTrigger, { 'key': 'b', 'data-testid': 'b' }, () => 'B') : null,
      ])),
    })
    const wrapper = mount(Harness, { attachTo: document.body })
    await nextTick()
    await wrapper.setProps({ second: true })
    await nextTick()
    const b = wrapper.find('[data-testid="b"]').element
    expect(rootTrigger(wrapper)).toBe(b)

    await wrapper.setProps({ first: false })
    await nextTick()
    expect(rootTrigger(wrapper)).toBe(b)
    expect(anchor(wrapper)).toBe(b)
    wrapper.unmount()
  })
})

describe('given a standalone Select', () => {
  it('passes the consumer\'s id and aria ids through as they are', () => {
    const wrapper = mount(defineComponent(() => () => renderSelect({}, { 'id': 'own-id', 'aria-labelledby': '', 'aria-describedby': 'hint' })), { attachTo: document.body })
    expect(trigger(wrapper).id).toBe('own-id')
    expect(trigger(wrapper).getAttribute('aria-labelledby')).toBe('')
    expect(trigger(wrapper).getAttribute('aria-describedby')).toBe('hint')
    expect(trigger(wrapper).hasAttribute('aria-invalid')).toBe(false)
    wrapper.unmount()
  })
})
