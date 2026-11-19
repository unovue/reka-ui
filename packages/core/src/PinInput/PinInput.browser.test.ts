import { mount } from '@vue/test-utils'
import { expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { h, nextTick, ref } from 'vue'
import { PinInputInput, PinInputRoot } from '.'

it('validates required PINs against all slots while keeping the current form value', async () => {
  const required = ref(true)
  const onSubmit = vi.fn((event: Event) => event.preventDefault())
  const wrapper = mount(() => h('form', { onSubmit }, [
    h(PinInputRoot, { name: 'pin', required: required.value, type: 'number' }, () =>
      Array.from({ length: 4 }, (_, index) => h(PinInputInput, { index }))),
  ]), { attachTo: document.body })
  const form = wrapper.element as HTMLFormElement
  const inputs = wrapper.findAll('input:not([aria-hidden])')

  await userEvent.click(inputs[0].element)
  await userEvent.keyboard('0')
  expect(new FormData(form).get('pin')).toBe('0')
  expect(form.checkValidity()).toBe(false)
  form.requestSubmit()
  expect(onSubmit).not.toHaveBeenCalled()

  await userEvent.click(inputs[1].element)
  await userEvent.keyboard('123')
  form.requestSubmit()
  expect(onSubmit).toHaveBeenCalledOnce()
  expect(new FormData(form).get('pin')).toBe('0123')

  await userEvent.click(inputs[1].element)
  await userEvent.keyboard('{Delete}')
  expect(form.checkValidity()).toBe(false)
  required.value = false
  await nextTick()
  expect(form.checkValidity()).toBe(true)
  expect(new FormData(form).get('pin')).toBe('023')
  wrapper.unmount()
})
