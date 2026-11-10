import type { UseFieldReturn } from '../index'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
// Only the public entry.
import { FieldControl, FieldRoot, FormRoot, useField } from '../index'

function mountField(fieldProps: Record<string, unknown> = {}, formProps?: Record<string, unknown>) {
  let field!: UseFieldReturn
  const Probe = defineComponent(() => {
    field = useField()
    return () => h('output', field.errors.value.join(', '))
  })
  const wrapper = mount(defineComponent(() => () => {
    const node = h(FieldRoot, { 'name': 'email', 'data-testid': 'field', ...fieldProps }, () => [h(FieldControl), h(Probe)])
    return formProps ? h(FormRoot, formProps, () => node) : node
  }), { attachTo: document.body })
  return { wrapper, field, input: wrapper.find('input') }
}

describe('useField', () => {
  it('throws outside a FieldRoot', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(() => mount(defineComponent(() => {
      useField()
      return () => null
    }))).toThrow(/FieldRoot/)
    warn.mockRestore()
  })

  it('reads the field\'s props', async () => {
    const { wrapper, field } = mountField({ disabled: true, required: true })
    expect(field.name.value).toBe('email')
    expect(field.disabled.value).toBe(true)
    expect(field.required.value).toBe(true)
    await wrapper.setProps({})
    wrapper.unmount()
  })

  it('follows the field\'s state as the user interacts', async () => {
    const { wrapper, field, input } = mountField()
    await nextTick()
    expect([field.focused.value, field.touched.value, field.dirty.value, field.filled.value, field.invalid.value]).toEqual([false, false, false, false, false])
    expect(field.validity.value.valid).toBe(null)

    await input.trigger('focus')
    expect(field.focused.value).toBe(true)
    await input.setValue('a@b.co')
    expect(field.dirty.value).toBe(true)
    expect(field.filled.value).toBe(true)
    await input.trigger('blur')
    expect(field.focused.value).toBe(false)
    expect(field.touched.value).toBe(true)
    wrapper.unmount()
  })

  it('validates from script and exposes the errors', async () => {
    const { wrapper, field, input } = mountField({ validate: (value: unknown) => value === 'taken' ? ['Taken', 'Pick another'] : null })
    await nextTick()
    await input.setValue('taken')
    expect(field.invalid.value).toBe(false)

    expect(field.validate()).toBe(false)
    await flushPromises()
    expect(field.invalid.value).toBe(true)
    expect(field.errors.value).toEqual(['Taken', 'Pick another'])
    expect(field.validity.value).toMatchObject({ valid: false, customError: true })
    expect(wrapper.find('output').text()).toBe('Taken, Pick another')

    await input.setValue('free')
    expect(field.validate()).toBe(true)
    expect(field.errors.value).toEqual([])
    wrapper.unmount()
  })

  it('includes the form\'s server errors', async () => {
    const { wrapper, field } = mountField({}, { errors: { email: 'Already registered' } })
    await nextTick()
    expect(field.invalid.value).toBe(true)
    expect(field.errors.value).toEqual(['Already registered'])
    wrapper.unmount()
  })

  it('reset() clears the state and keeps the value', async () => {
    const { wrapper, field, input } = mountField({ required: true })
    await nextTick()
    await input.setValue('x')
    await input.setValue('')
    await input.trigger('blur')
    field.validate()
    await nextTick()
    expect([field.touched.value, field.invalid.value]).toEqual([true, true])
    await input.setValue('kept')
    expect(field.dirty.value).toBe(true)

    field.reset()
    await nextTick()
    expect([field.touched.value, field.dirty.value, field.invalid.value]).toEqual([false, false, false])
    expect(field.errors.value).toEqual([])
    expect(input.element.value).toBe('kept')
    await new Promise(resolve => setTimeout(resolve))
    expect(field.filled.value).toBe(true)
    wrapper.unmount()
  })

  it('focus() moves focus to the control', async () => {
    const { wrapper, field, input } = mountField()
    await nextTick()
    field.focus()
    expect(document.activeElement).toBe(input.element)
    wrapper.unmount()
  })
})
