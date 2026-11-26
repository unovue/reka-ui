import { mount } from '@vue/test-utils'
import { expect, it, onTestFinished } from 'vitest'
import { userEvent } from 'vitest/browser'
import { h, nextTick, ref } from 'vue'
import { PinInputInput, PinInputRoot } from '.'

function mountPin(defaultValue: (number | undefined)[], otp = false) {
  const indices = ref([0, 1, 2, 3])
  const form = document.body.appendChild(document.createElement('form'))
  const wrapper = mount(PinInputRoot, {
    attachTo: form,
    // `mount` does not infer the generic `Type`, so it checks the props against the 'text' variant
    props: { type: 'number', name: 'pin', defaultValue: defaultValue as unknown as string[], otp },
    slots: { default: () => indices.value.map(index => h(PinInputInput, { key: index, index })) },
  })
  onTestFinished(() => {
    wrapper.unmount()
    form.remove()
  })
  return { wrapper, form, indices, inputs: () => wrapper.findAll<HTMLInputElement>('input:not([aria-hidden])') }
}

// TODO(v3-port): #3309 navigate, paste and submit by mounted slot order (usePinInput resolved to v3, still index-based)
it.skip('submits the visible digits and restores a retained digit when its slot returns', async () => {
  const { indices, form, inputs, wrapper } = mountPin([0, 5, 3, 6])
  indices.value = [0, 1, 3]
  await nextTick()
  expect(new FormData(form).get('pin')).toBe('056')
  await userEvent.fill(inputs()[2].element, '7')
  expect(wrapper.emitted('complete')?.at(-1)).toEqual([[0, 5, 7]])
  expect(new FormData(form).get('pin')).toBe('057')

  indices.value = [0, 1, 2, 3]
  await nextTick()
  expect(inputs()[2].element.value).toBe('3')
  expect(new FormData(form).get('pin')).toBe('0537')
})

// TODO(v3-port): #3309 navigate, paste and submit by mounted slot order (usePinInput resolved to v3, still index-based)
it.skip('writes full and partial pastes to the model indices of visible slots', async () => {
  const { form, indices, inputs, wrapper } = mountPin([0, 1, 8, 3])
  indices.value = [0, 2, 3]
  await nextTick()
  const source = form.appendChild(document.createElement('input'))
  const paste = async (position: number, text: string) => {
    await userEvent.fill(source, text)
    source.select()
    await userEvent.copy()
    await userEvent.click(inputs()[position].element)
    await userEvent.paste()
  }

  await paste(1, '456')
  expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([[4, 1, 5, 6]])
  await paste(1, '07')
  expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([[4, 1, 0, 7]])
  expect(wrapper.emitted('complete')?.at(-1)).toEqual([[4, 0, 7]])
})

// TODO(v3-port): #3309 navigate, paste and submit by mounted slot order (usePinInput resolved to v3, still index-based)
it.skip('moves focus and clears the previous visible digit across a gap', async () => {
  const { indices, inputs, wrapper } = mountPin([9, undefined, undefined, undefined], true)
  indices.value = [1, 2, 3]
  await nextTick()
  const [first, second, third] = inputs()
  await userEvent.click(third.element)
  expect(document.activeElement).toBe(first.element)
  await userEvent.keyboard('0')
  expect(document.activeElement).toBe(second.element)
  await userEvent.keyboard('{Backspace}')
  expect(document.activeElement).toBe(first.element)
  expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([[9, undefined, undefined, undefined]])
})

// TODO(v3-port): #3309 navigate, paste and submit by mounted slot order (usePinInput resolved to v3, still index-based)
it.skip('announces ordinals in mounted order when a middle slot is removed', async () => {
  const { indices, inputs } = mountPin([])
  indices.value = [0, 1, 3]
  await nextTick()
  expect(inputs().map(input => input.attributes('aria-label'))).toEqual([
    'pin input 1 of 3',
    'pin input 2 of 3',
    'pin input 3 of 3',
  ])
})
