import type { VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { h } from 'vue'
import { sleep } from '@/test'
import { ProgressIndicator, ProgressRoot } from '.'
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

describe('given a changing maximum', () => {
  it('renders an indeterminate value and recovers when the controlled value is in range again', async () => {
    using error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const wrapper = mount(ProgressRoot, {
      props: { modelValue: 80, max: 100 },
      slots: { default: () => h(ProgressIndicator) },
    })

    await wrapper.setProps({ max: 50 })

    expect(wrapper.attributes('aria-valuemax')).toBe('50')
    expect(wrapper.attributes('aria-valuenow')).toBeUndefined()
    expect(wrapper.attributes('aria-label')).toBeUndefined()
    expect(wrapper.getComponent(ProgressIndicator).attributes('data-state')).toBe('indeterminate')
    expect(wrapper.emitted('update:modelValue')).toEqual([[null]])
    expect(error).toHaveBeenCalledOnce()

    await wrapper.setProps({ max: 80 })

    expect(wrapper.attributes('aria-valuenow')).toBe('80')
    expect(wrapper.attributes('aria-label')).toBe('100%')
    expect(wrapper.getComponent(ProgressIndicator).attributes('data-state')).toBe('complete')
    expect(wrapper.emitted('update:modelValue')).toEqual([[null]])
  })

  it('updates a bound model when a smaller maximum invalidates its value', async () => {
    using error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const wrapper = mount({
      components: { ProgressRoot },
      data: () => ({ value: 80 as number | null, max: 100 }),
      template: '<ProgressRoot v-model="value" :max="max" />',
    })

    await wrapper.setData({ max: 50 })

    expect(wrapper.vm.value).toBeNull()
    expect(wrapper.attributes('data-state')).toBe('indeterminate')
    expect(error).toHaveBeenCalledOnce()
  })

  it('validates the current value against the default when the supplied maximum is invalid', async () => {
    using error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const wrapper = mount(ProgressRoot, { props: { modelValue: 80, max: 100 } })
    await wrapper.setProps({ max: 0 })

    expect(wrapper.attributes('aria-valuemax')).toBe('100')
    expect(wrapper.attributes('aria-valuenow')).toBe('80')
    expect(wrapper.attributes('aria-label')).toBe('80%')
    expect(wrapper.emitted('update:max')).toEqual([[100]])
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(error).toHaveBeenCalledOnce()
  })
})
