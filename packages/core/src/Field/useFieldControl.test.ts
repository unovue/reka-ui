import type { VueWrapper } from '@vue/test-utils'
import type { PropType } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { describeFieldControlContract } from '@/test/fieldControlContract'
// Only the public entry: what a consumer's own control can import.
import { CheckboxRoot, FieldError, FieldLabel, FieldRoot, useFieldControl } from '../index'

const controlProps = {
  modelValue: { type: String as PropType<string | undefined>, default: undefined },
  id: { type: String as PropType<string | undefined>, default: undefined },
  name: { type: String as PropType<string | undefined>, default: undefined },
  disabled: { type: Boolean, default: false },
  required: { type: Boolean, default: false },
}

/** A wrapper around a native `input`: the browser's constraint validation decides validity. */
const TextInput = defineComponent({
  name: 'TextInput',
  props: controlProps,
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const element = ref<HTMLInputElement>()
    const field = useFieldControl({
      value: () => props.modelValue ?? '',
      element,
      validityElement: element,
      id: () => props.id,
      name: () => props.name,
      disabled: () => props.disabled,
      required: () => props.required,
    })
    function onInput(event: Event) {
      const value = (event.target as HTMLInputElement).value
      emit('update:modelValue', value)
      field.input(value)
    }
    return () => h('input', {
      ...field.control.attrs.value,
      ref: element,
      name: field.name.value,
      disabled: field.disabled.value,
      required: field.required.value,
      value: props.modelValue,
      onInput,
    })
  },
})

/** A `contenteditable` editor: no native validity, a hidden input for native submission. */
const RichText = defineComponent({
  name: 'RichText',
  props: controlProps,
  emits: ['update:modelValue'],
  setup(props, { emit, slots }) {
    const element = ref<HTMLElement>()
    const field = useFieldControl<string>({
      value: () => props.modelValue ?? '',
      element,
      id: () => props.id,
      name: () => props.name,
      disabled: () => props.disabled,
      required: () => props.required,
      isFilled: value => value.trim() !== '',
    })
    function onInput(event: Event) {
      const value = (event.target as HTMLElement).textContent ?? ''
      emit('update:modelValue', value)
      field.input(value)
    }
    return () => [
      h('div', {
        ...field.control.attrs.value,
        'ref': element,
        'role': 'textbox',
        'tabindex': field.disabled.value ? undefined : 0,
        'contenteditable': !field.disabled.value,
        'aria-disabled': field.disabled.value || undefined,
        'aria-required': field.required.value || undefined,
        onInput,
      }, slots.default?.()),
      field.name.value ? h('input', { type: 'hidden', name: field.name.value, value: props.modelValue }) : null,
    ]
  },
})

const textbox = (wrapper: VueWrapper) => wrapper.find('[role="textbox"]')

describeFieldControlContract({
  name: 'custom native input built on useFieldControl',
  render: props => h(TextInput, props),
  control: wrapper => wrapper.find('input').element,
  interact: wrapper => wrapper.find('input').setValue('hello'),
  interactedValue: 'hello',
  emptyValue: '',
  filledValue: 'filled',
})

describeFieldControlContract({
  name: 'custom contenteditable built on useFieldControl',
  render: props => h(RichText, props),
  control: wrapper => textbox(wrapper).element as HTMLElement,
  interact: async (wrapper) => {
    textbox(wrapper).element.textContent = 'hello'
    await textbox(wrapper).trigger('input')
  },
  interactedValue: 'hello',
  emptyValue: '',
  filledValue: 'filled',
})

describe('useFieldControl outside a FieldRoot', () => {
  it('returns the control\'s own id, name, disabled and required', () => {
    const wrapper = mount(TextInput, { props: { id: 'own', name: 'email', disabled: true, required: true } })
    const input = wrapper.find('input')
    expect(input.attributes()).toMatchObject({ id: 'own', name: 'email', disabled: '', required: '' })
    expect(input.attributes('data-disabled')).toBe('')
    expect(input.attributes('aria-invalid')).toBeUndefined()
    wrapper.unmount()
  })

  it('ignores input()', async () => {
    const wrapper = mount(TextInput)
    await wrapper.find('input').setValue('hello')
    expect(wrapper.emitted('update:modelValue')).toEqual([['hello']])
    expect(wrapper.find('input').attributes('data-dirty')).toBeUndefined()
    wrapper.unmount()
  })
})

describe('useFieldControl inside a FieldRoot', () => {
  function mountField(options: { fieldProps?: Record<string, unknown>, controlProps?: Record<string, unknown>, children?: () => unknown } = {}) {
    const model = ref('')
    const wrapper = mount(defineComponent(() => () =>
      h(FieldRoot, { 'name': 'bio', 'data-testid': 'field', ...options.fieldProps }, () => [
        h(FieldLabel, () => 'Bio'),
        h(RichText, { ...options.controlProps, 'modelValue': model.value, 'onUpdate:modelValue': (value: string) => { model.value = value } }, options.children),
        h(FieldError),
      ])), { attachTo: document.body })
    const field = () => wrapper.find('[data-testid="field"]')
    return { wrapper, model, field }
  }

  it('keeps its own id, which the label then points at', async () => {
    const { wrapper } = mountField({ controlProps: { id: 'own' } })
    await nextTick()
    expect(textbox(wrapper).attributes('id')).toBe('own')
    expect(wrapper.find('label').attributes('for')).toBe('own')
    wrapper.unmount()
  })

  it('is disabled and required by its own props as well as the field\'s', async () => {
    const { wrapper } = mountField({ controlProps: { disabled: true, required: true } })
    await nextTick()
    expect(textbox(wrapper).attributes('aria-disabled')).toBe('true')
    expect(textbox(wrapper).attributes('aria-required')).toBe('true')
    expect(textbox(wrapper).attributes('data-disabled')).toBe('')
    wrapper.unmount()
  })

  it('renders the field\'s state and reports focus and blur', async () => {
    const { wrapper, field } = mountField()
    await nextTick()
    await textbox(wrapper).trigger('focus')
    expect(field().attributes('data-focused')).toBe('')
    expect(textbox(wrapper).attributes('data-focused')).toBe('')
    await textbox(wrapper).trigger('blur')
    expect(field().attributes('data-focused')).toBeUndefined()
    expect(textbox(wrapper).attributes('data-touched')).toBe('')
    wrapper.unmount()
  })

  it('passes its value to validate, and uses isFilled for filled and required', async () => {
    const validate = vi.fn((value: unknown) => value === 'bad' ? 'Not that' : null)
    const { wrapper, field } = mountField({ fieldProps: { validate, validationMode: 'onChange', required: true } })
    await nextTick()

    textbox(wrapper).element.textContent = '   '
    await textbox(wrapper).trigger('input')
    await flushPromises()
    // Whitespace is not filled, so the required field is missing its value.
    expect(field().attributes('data-filled')).toBeUndefined()
    expect(field().attributes('data-invalid')).toBe('')

    textbox(wrapper).element.textContent = 'bad'
    await textbox(wrapper).trigger('input')
    await flushPromises()
    expect(validate).toHaveBeenLastCalledWith('bad', expect.anything())
    expect(field().attributes('data-filled')).toBe('')
    expect(wrapper.text()).toContain('Not that')
    expect(textbox(wrapper).attributes('aria-invalid')).toBe('true')
    expect(textbox(wrapper).attributes('aria-describedby')).toBe(wrapper.find('[data-testid="field"] > :last-child').attributes('id'))
    wrapper.unmount()
  })

  it('claims the field: a Reka control rendered inside it leaves the field alone', async () => {
    const { wrapper } = mountField({ children: () => h(CheckboxRoot) })
    await nextTick()
    const id = wrapper.find('label').attributes('for')
    expect(textbox(wrapper).attributes('id')).toBe(id)
    expect(wrapper.find('[role="checkbox"]').attributes('id')).toBeUndefined()
    expect(wrapper.find('[role="checkbox"]').attributes('aria-labelledby')).toBeUndefined()
    wrapper.unmount()
  })

  it('reads value when input() is called without one', async () => {
    const model = ref('')
    const Control = defineComponent(() => {
      const element = ref<HTMLElement>()
      const field = useFieldControl({ value: model, element })
      return () => h('button', {
        ...field.control.attrs.value,
        ref: element,
        onClick: () => {
          model.value = 'picked'
          field.input()
        },
      })
    })
    const wrapper = mount(defineComponent(() => () => h(FieldRoot, { 'data-testid': 'field' }, () => h(Control))), { attachTo: document.body })
    await nextTick()
    await wrapper.find('button').trigger('click')
    expect(wrapper.find('[data-testid="field"]').attributes('data-dirty')).toBe('')
    expect(wrapper.find('button').attributes('data-filled')).toBe('')
    wrapper.unmount()
  })
})
