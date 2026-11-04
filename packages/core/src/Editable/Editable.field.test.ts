import type { VueWrapper } from '@vue/test-utils'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, nextTick, ref } from 'vue'
import { FieldError, FieldLabel, FieldRoot } from '@/Field'
import { FormRoot } from '@/Form'
import { describeFieldControlContract } from '@/test/fieldControlContract'
import { EditableArea, EditableInput, EditablePreview, EditableRoot } from '.'

function render(props: Record<string, unknown>) {
  return h(EditableRoot, { activationMode: 'dblclick', submitMode: 'both', ...props }, () =>
    h(EditableArea, () => [h(EditablePreview), h(EditableInput)]))
}

const input = (wrapper: VueWrapper) => wrapper.find('input:not([aria-hidden])')
const preview = (wrapper: VueWrapper) => wrapper.find('span[tabindex="0"]')
// The blur waits for a possible submit on focus outside.
const settle = () => new Promise(resolve => setTimeout(resolve))

async function type(wrapper: VueWrapper, text: string) {
  await preview(wrapper).trigger('dblclick')
  await flushPromises()
  await input(wrapper).setValue(text)
  await input(wrapper).trigger('keydown', { key: 'Enter' })
  await flushPromises()
}

describeFieldControlContract({
  name: 'Editable',
  render,
  control: wrapper => input(wrapper).element as HTMLElement,
  focusTarget: wrapper => preview(wrapper).element as HTMLElement,
  idOnControl: false,
  labelTarget: wrapper => wrapper.find('input[aria-hidden="true"]').element as HTMLElement,
  interact: wrapper => type(wrapper, 'Hello'),
  interactedValue: 'Hello',
  emptyValue: '',
  filledValue: 'Filled',
})

describe('given a Field-wrapped Editable', () => {
  function mountField(options: { fieldProps?: Record<string, unknown>, rootProps?: Record<string, unknown>, model?: string } = {}) {
    const onFormSubmit = vi.fn()
    const model = ref(options.model ?? '')
    const wrapper = mount(defineComponent({
      setup: () => () => h(FormRoot, { onFormSubmit }, () => [
        h(FieldRoot, { 'name': 'title', 'data-testid': 'field', ...options.fieldProps }, () => [
          h(FieldLabel, () => 'Title'),
          render({ 'modelValue': model.value, 'onUpdate:modelValue': (value: string) => { model.value = value }, ...options.rootProps }),
          h(FieldError, { match: 'valueMissing' }, () => 'Required'),
        ]),
        h('button', { type: 'submit' }, 'Submit'),
      ]),
    }), { attachTo: document.body })
    const field = () => wrapper.find('[data-testid="field"]')
    return { wrapper, model, field, onFormSubmit }
  }

  it('points the label at the hidden input, which focuses the preview', async () => {
    const { wrapper } = mountField()
    await nextTick()
    const target = wrapper.find(`#${wrapper.find('label').attributes('for')}`)
    expect(target.attributes('aria-hidden')).toBe('true')
    expect(target.attributes('name')).toBe('title')
    ;(target.element as HTMLInputElement).focus()
    expect(document.activeElement).toBe(preview(wrapper).element)
    wrapper.unmount()
  })

  it('collects the submitted value, not the draft', async () => {
    const { wrapper, onFormSubmit } = mountField()
    await nextTick()
    await type(wrapper, 'Saved')
    await preview(wrapper).trigger('dblclick')
    await flushPromises()
    await input(wrapper).setValue('Draft')
    await wrapper.find('button[type="submit"]').trigger('submit')
    expect(onFormSubmit.mock.calls[0][0]).toEqual({ title: 'Saved' })
    wrapper.unmount()
  })

  it('stays focused and untouched from the preview to the input, and is touched once focus leaves', async () => {
    const { wrapper, field } = mountField({ rootProps: { activationMode: 'focus' } })
    await nextTick()
    ;(preview(wrapper).element as HTMLElement).focus()
    await flushPromises()
    expect(document.activeElement).toBe(input(wrapper).element)
    expect(field().attributes('data-focused')).toBe('')
    expect(field().attributes('data-touched')).toBeUndefined()

    await input(wrapper).setValue('Typed')
    ;(wrapper.find('button[type="submit"]').element as HTMLElement).focus()
    await flushPromises()
    await settle()
    expect(field().attributes('data-focused')).toBeUndefined()
    expect(field().attributes('data-touched')).toBe('')
    wrapper.unmount()
  })

  it('validates the value a blur submitted, on blur', async () => {
    const { wrapper, field, model } = mountField({ model: 'Start', fieldProps: { required: true, validationMode: 'onBlur' }, rootProps: { activationMode: 'focus' } })
    await nextTick()
    ;(preview(wrapper).element as HTMLElement).focus()
    await flushPromises()
    await input(wrapper).setValue('')
    ;(wrapper.find('button[type="submit"]').element as HTMLElement).focus()
    await flushPromises()
    await settle()
    expect(model.value).toBe('')
    expect(field().attributes('data-invalid')).toBe('')
    expect(wrapper.text()).toContain('Required')
    wrapper.unmount()
  })

  it('passes axe', async () => {
    const { wrapper } = mountField({ fieldProps: { required: true } })
    await nextTick()
    expect(await axe(wrapper.element)).toHaveNoViolations()
    wrapper.unmount()
  })
})

describe('given a Field-wrapped Editable whose parent rejects a change', () => {
  it('doesn\'t count a later parent-driven change to that value as user input', async () => {
    const model = ref('')
    const wrapper = mount(defineComponent({
      setup: () => () => h(FieldRoot, { 'name': 'title', 'data-testid': 'field' }, () =>
        render({ 'modelValue': model.value, 'onUpdate:modelValue': () => {} })),
    }), { attachTo: document.body })
    await nextTick()
    await type(wrapper, 'Hello')
    await settle()
    model.value = 'Hello'
    await flushPromises()
    const field = wrapper.find('[data-testid="field"]')
    expect(field.attributes('data-filled')).toBe('')
    expect(field.attributes('data-dirty')).toBeUndefined()
    wrapper.unmount()
  })
})
