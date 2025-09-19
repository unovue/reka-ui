import { mount } from '@vue/test-utils'
import { expect, it } from 'vitest'
import { axe } from 'vitest-axe'
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
