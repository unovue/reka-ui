import type { VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import Progress from './story/_Progress.vue'

describe('given a default Progress', () => {
  let wrapper: VueWrapper<InstanceType<typeof Progress>>

  beforeEach(() => {
    // The story bumps its value after a 200 ms timer: drive it.
    vi.useFakeTimers()
    wrapper = mount(Progress)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should pass axe accessibility tests', async () => {
    // axe schedules its own timers.
    vi.useRealTimers()
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('should contain correct value', () => {
    expect(wrapper.html()).toContain('data-value="0"')
  })

  describe('after 200ms', () => {
    beforeEach(async () => {
      await vi.advanceTimersByTimeAsync(200)
    })

    it('should contain correct value', async () => {
      expect(wrapper.html()).toContain('data-value="50"')
    })
  })
})
