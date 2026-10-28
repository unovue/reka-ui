import { mount } from '@vue/test-utils'
import { expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { componentNames } from '@/test'
import Separator from './Separator.vue'

it('should pass axe accessibility tests', async () => {
  const wrapper = mount(Separator)
  expect(await axe(wrapper.element)).toHaveNoViolations()

  const wrapperVertical = mount(Separator, {
    props: {
      orientation: 'vertical',
    },
  })
  expect(await axe(wrapperVertical.element)).toHaveNoViolations()
})

it('renders its own element, with no Primitive or BaseSeparator', () => {
  const wrapper = mount(Separator, { props: { orientation: 'vertical' } })
  expect(componentNames(wrapper.vm.$)).toEqual(['Separator'])
  expect(wrapper.html()).toBe('<div data-orientation="vertical" aria-orientation="vertical" role="separator"></div>')
})
