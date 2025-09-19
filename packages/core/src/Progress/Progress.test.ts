import type { VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { sleep } from '@/test'
import Progress from './story/_Progress.vue'

describe('given a default Progress', () => {
  let wrapper: VueWrapper<InstanceType<typeof Progress>>

  beforeEach(() => {
    wrapper = mount(Progress)
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('should contain correct value', () => {
    expect(wrapper.html()).toContain('data-value="0"')
  })

  describe('after 200ms', () => {
    beforeEach(async () => {
      await sleep(200)
    })

    it('should contain correct value', async () => {
      expect(wrapper.html()).toContain('data-value="50"')
    })
  })
})
