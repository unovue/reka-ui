import { mount } from '@vue/test-utils'
import { expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { h, nextTick, ref } from 'vue'
import { PinInputInput, PinInputRoot } from '.'

it('accepts a partial required PIN unless complete validation is enabled', async () => {
  const required = ref(true)
  const requireComplete = ref<boolean>()
  const onSubmit = vi.fn((event: Event) => event.preventDefault())
  const wrapper = mount(() => h('form', { onSubmit }, [
    h(PinInputRoot, { name: 'pin', required: required.value, requireComplete: requireComplete.value, type: 'number' }, () =>
      Array.from({ length: 4 }, (_, index) => h(PinInputInput, { index }))),
  ]), { attachTo: document.body })
  const form = wrapper.element as HTMLFormElement
  const inputs = wrapper.findAll('input:not([aria-hidden])')
  const formInput = form.elements.namedItem('pin') as HTMLInputElement
  expect(formInput.validity.valueMissing).toBe(true)

  await userEvent.click(inputs[0].element)
  await userEvent.keyboard('0')
  expect(new FormData(form).get('pin')).toBe('0')
  expect(form.checkValidity()).toBe(true)
  requireComplete.value = true
  await nextTick()
  expect(form.checkValidity()).toBe(false)
  expect(formInput.validationMessage).toBe('Please fill in every PIN field.')
  form.requestSubmit()
  expect(onSubmit).not.toHaveBeenCalled()

  await userEvent.click(inputs[1].element)
  await userEvent.keyboard('123')
  expect(formInput.validationMessage).toBe('')
  form.requestSubmit()
  expect(onSubmit).toHaveBeenCalledOnce()
  expect(new FormData(form).get('pin')).toBe('0123')

  await userEvent.click(inputs[1].element)
  await userEvent.keyboard('{Delete}')
  expect(form.checkValidity()).toBe(false)
  requireComplete.value = false
  await nextTick()
  expect(form.checkValidity()).toBe(true)
  requireComplete.value = true
  required.value = false
  await nextTick()
  expect(form.checkValidity()).toBe(true)
  expect(new FormData(form).get('pin')).toBe('023')
  wrapper.unmount()
})

it.each([false, true])('submits the full PIN synchronously from the complete handler (requireComplete: %s)', async (requireComplete) => {
  const form = ref<HTMLFormElement>()
  const onSubmit = vi.fn((event: SubmitEvent) => {
    event.preventDefault()
    return new FormData(event.currentTarget as HTMLFormElement).get('pin')
  })
  const wrapper = mount(() => h('form', { ref: form, onSubmit }, [
    h(PinInputRoot, {
      name: 'pin',
      required: true,
      requireComplete,
      defaultValue: ['0', '1', '2'],
      onComplete: () => form.value!.requestSubmit(),
    }, () => Array.from({ length: 4 }, (_, index) => h(PinInputInput, { index }))),
  ]), { attachTo: document.body })

  await userEvent.click(wrapper.findAll('input:not([aria-hidden])')[3].element)
  await userEvent.keyboard('3')
  expect(onSubmit).toHaveBeenCalledOnce()
  expect(onSubmit).toHaveReturnedWith('0123')
  wrapper.unmount()
})

it('rechecks completeness when an empty slot unmounts and remounts', async () => {
  const showMiddle = ref(true)
  const wrapper = mount(() => h('form', [
    h(PinInputRoot, { name: 'pin', required: true, requireComplete: true, defaultValue: ['1', '', '3'] }, () =>
      (showMiddle.value ? [0, 1, 2] : [0, 2]).map(index => h(PinInputInput, { key: index, index }))),
  ]), { attachTo: document.body })
  const form = wrapper.element as HTMLFormElement
  await nextTick()
  expect(form.checkValidity()).toBe(false)
  showMiddle.value = false
  await nextTick()
  expect(form.checkValidity()).toBe(true)
  expect(new FormData(form).get('pin')).toBe('13')
  showMiddle.value = true
  await nextTick()
  expect(form.checkValidity()).toBe(false)
  wrapper.unmount()
})
