import { mount } from '@vue/test-utils'
import { expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { h } from 'vue'
import { RatingItem, RatingItemIndicator, RatingRoot } from '.'

it('submits the cleared rating and unchecks its radio', async ({ onTestFinished }) => {
  const form = document.body.appendChild(document.createElement('form'))
  const wrapper = mount(RatingRoot, {
    attachTo: form,
    props: { clearable: true, name: 'rating' },
    slots: {
      default: () => h(RatingItem, { item: 2 }, () =>
        h(RatingItemIndicator, { step: 2 }, () => h('span', 'Two stars'))),
    },
  })
  onTestFinished(() => {
    wrapper.unmount()
    form.remove()
  })

  const radio = wrapper.get('[role="radio"]')
  await userEvent.click(radio.element)
  expect(radio.attributes('aria-checked')).toBe('true')
  expect(new FormData(form).get('rating')).toBe('2')

  await userEvent.click(radio.element)
  expect(wrapper.emitted('update:modelValue')).toEqual([[2], [0]])
  expect(radio.attributes('aria-checked')).toBe('false')
  expect(new FormData(form).get('rating')).toBe('0')
})
