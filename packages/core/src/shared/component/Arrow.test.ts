import { mount } from '@vue/test-utils'
import { expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import Arrow from './Arrow.vue'

it('should pass axe accessibility tests', async () => {
  const wrapper = mount(Arrow)
  expect(await axe(wrapper.element)).toHaveNoViolations()
})
