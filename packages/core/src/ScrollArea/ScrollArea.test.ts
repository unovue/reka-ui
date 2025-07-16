import type { VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { sleep } from '@/test'
import ScrollArea from './story/_ScrollArea.vue'

describe('given default ScrollArea', () => {
  let wrapper: VueWrapper<InstanceType<typeof ScrollArea>>

  beforeEach(() => {
    wrapper = mount(ScrollArea, { attachTo: document.body })
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 500 })
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 500 })
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', { configurable: true, value: 2000 })
    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', { configurable: true, value: 2000 })
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('should render content, but not scrollbar', () => {
    expect(wrapper.html()).toMatchSnapshot()
    expect(wrapper.html()).not.toContain('data-orientation="vertical"')
  })

  describe('on hover', () => {
    beforeEach(async () => {
      await wrapper.trigger('pointerenter')
      await sleep(100)
    })

    it('should render scrollbar', () => {
      expect(wrapper.html()).toMatchSnapshot()
    })
  })
})

describe('given prop:type="always" ScrollArea', () => {
  let wrapper: VueWrapper<InstanceType<typeof ScrollArea>>

  beforeEach(() => {
    wrapper = mount(ScrollArea, { attachTo: document.body, props: { type: 'always' } })
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 500 })
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 500 })
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', { configurable: true, value: 2000 })
    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', { configurable: true, value: 2000 })
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('should render content and scrollbar', () => {
    expect(wrapper.html()).toMatchSnapshot()
    expect(wrapper.html()).toContain('data-orientation="vertical"')
  })
})

describe('given prop:type="scroll" ScrollArea', () => {
  let wrapper: VueWrapper<InstanceType<typeof ScrollArea>>

  beforeEach(() => {
    wrapper = mount(ScrollArea, { attachTo: document.body, props: { type: 'scroll' } })
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 500 })
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 500 })
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', { configurable: true, value: 2000 })
    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', { configurable: true, value: 2000 })
    Object.defineProperty(HTMLElement.prototype, 'scrollTop', { configurable: true, value: 20 })
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('should render content and scrollbar', () => {
    expect(wrapper.html()).toMatchSnapshot()
    expect(wrapper.html()).not.toContain('data-orientation="vertical"')
  })

  describe('on scroll', () => {
    beforeEach(async () => {
      Object.defineProperty(HTMLElement.prototype, 'scrollTop', { configurable: true, value: 40 })
      await wrapper.find('[data-reka-scroll-area-viewport]').trigger('scroll')
      await sleep(10)
    })

    it('should render scrollbar', () => {
      expect(wrapper.html()).toContain('data-orientation="vertical"')
      expect(wrapper.html()).toMatchSnapshot()
    })
  })
})
