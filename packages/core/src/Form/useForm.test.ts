import type { UseFormReturn } from '../index'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
// Only the public entry.
import { FieldControl, FieldRoot, FormRoot, SwitchRoot, useForm } from '../index'

function mountForm(formProps: Record<string, unknown> = {}) {
  let form!: UseFormReturn
  const Probe = defineComponent(() => {
    form = useForm()
    return () => h('output', String(form.submitCount.value))
  })
  // `^value` sets the attribute (the default value a native reset restores), not the property.
  const wrapper = mount(defineComponent(() => () => h(FormRoot, formProps, () => [
    h(FieldRoot, { 'name': 'email', 'data-testid': 'email' }, () => h(FieldControl, { 'type': 'email', 'required': true, '^value': 'a@b.co' })),
    h(FieldRoot, { 'name': 'age', 'data-testid': 'age' }, () => h(FieldControl, { type: 'number', min: 18 })),
    h(FieldRoot, { name: 'newsletter' }, () => h(SwitchRoot, { defaultValue: true })),
    h(FieldRoot, null, () => h(FieldControl, { '^value': 'unnamed' })),
    h(Probe),
    h('button', { type: 'submit' }),
  ])), { attachTo: document.body })
  const email = wrapper.find('input[type="email"]')
  const age = wrapper.find('input[type="number"]')
  const field = (name: string) => wrapper.find(`[data-testid="${name}"]`)
  return { wrapper, form, email, age, field }
}

describe('useForm', () => {
  it('throws outside a FormRoot', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(() => mount(defineComponent(() => {
      useForm()
      return () => null
    }))).toThrow(/FormRoot/)
    warn.mockRestore()
  })

  it('reads the current value of every named field', async () => {
    const { wrapper, form, age } = mountForm()
    await nextTick()
    expect(form.getValues()).toEqual({ email: 'a@b.co', age: '', newsletter: true })
    await age.setValue('30')
    await wrapper.find('[role="switch"]').trigger('click')
    expect(form.getValues()).toEqual({ email: 'a@b.co', age: '30', newsletter: false })
    wrapper.unmount()
  })

  it('counts submissions, blocked ones included', async () => {
    const onFormSubmit = vi.fn()
    const { wrapper, form, age } = mountForm({ onFormSubmit })
    await nextTick()
    expect(form.submitCount.value).toBe(0)

    await age.setValue('12')
    await wrapper.find('form').trigger('submit')
    expect(onFormSubmit).not.toHaveBeenCalled()
    expect(form.submitCount.value).toBe(1)
    expect(wrapper.find('output').text()).toBe('1')

    await age.setValue('30')
    await wrapper.find('form').trigger('submit')
    expect(onFormSubmit).toHaveBeenCalledTimes(1)
    expect(form.submitCount.value).toBe(2)
    wrapper.unmount()
  })

  it('validates every field, or one by name', async () => {
    const { wrapper, form, email, age, field } = mountForm()
    await nextTick()
    await email.setValue('')
    await age.setValue('12')

    expect(form.validate('age')).toBe(false)
    await nextTick()
    expect(field('age').attributes('data-invalid')).toBe('')
    expect(field('email').attributes('data-invalid')).toBeUndefined()

    expect(form.validate()).toBe(false)
    await nextTick()
    expect(field('email').attributes('data-invalid')).toBe('')

    await email.setValue('a@b.co')
    await age.setValue('30')
    expect(form.validate()).toBe(true)
    wrapper.unmount()
  })

  it('reset() restores the default values and clears the fields\' state', async () => {
    const { wrapper, form, email, field } = mountForm()
    await nextTick()
    await email.setValue('')
    await email.trigger('blur')
    form.validate()
    await nextTick()
    expect(field('email').attributes()).toMatchObject({ 'data-invalid': '', 'data-dirty': '', 'data-touched': '' })

    form.reset()
    await nextTick()
    expect((email.element as HTMLInputElement).value).toBe('a@b.co')
    expect(field('email').attributes('data-invalid')).toBeUndefined()
    expect(field('email').attributes('data-dirty')).toBeUndefined()
    expect(field('email').attributes('data-touched')).toBeUndefined()
    expect(form.getValues().email).toBe('a@b.co')
    wrapper.unmount()
  })

  it('reset() clears the fields\' state when the form renders another element', async () => {
    const { wrapper, form, email, field } = mountForm({ as: 'div' })
    await nextTick()
    await email.setValue('changed')
    expect(field('email').attributes('data-dirty')).toBe('')
    form.reset()
    await nextTick()
    expect(field('email').attributes('data-dirty')).toBeUndefined()
    wrapper.unmount()
  })
})
