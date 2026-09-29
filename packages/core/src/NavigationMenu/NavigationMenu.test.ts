import type { DOMWrapper, VueWrapper } from '@vue/test-utils'
import userEvent from '@testing-library/user-event'
import { fireEvent } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { useDebounceFn } from '@vueuse/core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { nextTick } from 'vue'
import { sleep } from '@/test'
import NavigationMenuUnmountOnHideFalse from './__test__/NavigationMenuUnmountOnHideFalse.vue'

import NavigationMenuItem from './NavigationMenuItem.vue'
import NavigationMenu from './story/_NavigationMenu.vue'

vi.mock('@vueuse/core', async () => {
  const actual = await vi.importActual('@vueuse/core')
  return {
    ...actual,
    useDebounceFn: vi.fn(),

  }
})

describe('given default NavigationMenu', () => {
  let wrapper: VueWrapper<InstanceType<typeof NavigationMenu>>
  let content: DOMWrapper<HTMLDivElement>

  beforeEach(() => {
    document.body.innerHTML = ''
    wrapper = mount(NavigationMenu, { attachTo: document.body })

    // @ts-expect-error simple mock
    vi.mocked(useDebounceFn).mockImplementation((cb: (val: string) => void, _delay: string) => {
      return function (arg: string) {
        cb(arg)
      }
    })
  })

  afterEach(() => {
    wrapper.unmount()
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  describe('after clicking on button to open menu', () => {
    beforeEach(async () => {
      const button = wrapper.find('button').element
      button.focus()
      button.click()
      await nextTick()
      content = wrapper.find('[data-dismissable-layer]')
    })

    it('should pass axe accessibility tests', async () => {
      expect(await axe(document.body)).toHaveNoViolations()
    })

    describe('after pressing tab', async () => {
      beforeEach(async () => {
        await userEvent.tab()
      })

      it('should focus on the first item in menu', () => {
        const links = content.findAll('a')
        expect(links[0].element).toBe(document.activeElement)
      })
    })

    describe('after pressing down key', async () => {
      beforeEach(async () => {
        await fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' })
        await sleep(0)
      })

      it('should focus on the first item in menu', () => {
        const links = content.findAll('a')
        expect(links[0].element).toBe(document.activeElement)
      })

      it('should focus on the last item in menu', async () => {
        const links = content.findAll('a')
        for (let i = 0; i < links.length; i++) {
          await fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' })
          await sleep(0)
        }
        expect(links.at(-1).element).toBe(document.activeElement)
      })
    })

    // TODO: Better dismissable test
    // describe('after interacting outside', () => {
    //   beforeEach(async () => {
    //     await fireEvent.pointerDown(document.body)
    //     await sleep(0)
    //   })

    //   it('should close the content', () => {
    //     expect(wrapper.find('[data-dismissable-layer]').exists()).toBe(false)
    //   })
    // })
  })

  it('keeps active content open when clicking inside with unmountOnHide disabled', async () => {
    const wrapper = mount(NavigationMenuUnmountOnHideFalse, { attachTo: document.body })

    await wrapper.find('[data-testid="trigger-one"]').trigger('click')
    await wrapper.vm.$nextTick()
    await sleep(0)

    expect(wrapper.find('[data-testid="model-value"]').text()).toBe('one')

    // Open second content; first stays mounted but becomes inactive
    await wrapper.find('[data-testid="trigger-two"]').trigger('click')
    await wrapper.vm.$nextTick()
    await sleep(0)

    expect(wrapper.find('[data-testid="model-value"]').text()).toBe('two')

    // Click inside active content-two; inactive content-one should not interfere
    await fireEvent.pointerDown(wrapper.find('[data-testid="inside-two"]').element)
    await wrapper.vm.$nextTick()
    await sleep(0)

    // Content-two should remain open (content-one's dismiss handler returned early)
    expect(wrapper.find('[data-testid="model-value"]').text()).toBe('two')

    wrapper.unmount()
  })

  describe('menu triggers', () => {
    const findMenuItem = () => wrapper.findComponent(NavigationMenuItem)

    const findTriggerButton = () => findMenuItem().find('button')

    const findLinkContent = () => wrapper.find('[data-dismissable-layer]')

    async function useRealDebounceFn() {
      const { useDebounceFn: realUseDebounceFn } = await vi.importActual<typeof import('@vueuse/core')>('@vueuse/core')
      vi.mocked(useDebounceFn).mockImplementation(realUseDebounceFn)
    }

    it('should open menu on click by default', async () => {
      const button = findTriggerButton()

      button.trigger('click')

      await wrapper.vm.$nextTick()

      const content = findLinkContent()

      expect(content.exists()).toBeTruthy()
    })

    it('should open menu on hover by default', async () => {
      const button = findTriggerButton()

      button.trigger('pointermove', { pointerType: 'mouse' })

      await wrapper.vm.$nextTick()

      const content = findLinkContent()

      expect(content.exists()).toBeTruthy()
    })

    it('should not trigger content on click', async () => {
      await wrapper.setProps({ disableClickTrigger: true })

      const button = findTriggerButton()

      button.trigger('click', { pointerType: 'mouse' })

      await wrapper.vm.$nextTick()

      const content = findLinkContent()

      expect(content.exists()).toBeFalsy()
    })

    it('should not trigger content on hover', async () => {
      await wrapper.setProps({ disableHoverTrigger: true })
      const button = findTriggerButton()

      button.trigger('pointermove', { pointerType: 'mouse' })

      await wrapper.vm.$nextTick()

      const content = findLinkContent()

      expect(content.exists()).toBeFalsy()
    })

    it('should close menu when clicking top-level link with hover disabled', async () => {
      await wrapper.setProps({
        disableHoverTrigger: true,
        disablePointerLeaveClose: true,
      })

      const button = findTriggerButton().element
      button.click()
      await wrapper.vm.$nextTick()

      // Menu should be open
      expect(findLinkContent().exists()).toBeTruthy()

      // Click the top-level Github link
      const topLevelLink = wrapper.find('a[href="https://github.com/unovue"]').element as HTMLElement
      topLevelLink.click()
      await sleep(0)
      await wrapper.vm.$nextTick()

      // Menu should be closed
      expect(findLinkContent().exists()).toBeFalsy()
    })

    it('switching triggers keeps menu open', async () => {
      vi.useFakeTimers()
      await useRealDebounceFn()

      const localWrapper = mount(NavigationMenu, { attachTo: document.body })
      const triggers = localWrapper.findAll('[data-navigation-menu-trigger]')
      const findContent = () => localWrapper.find('[data-dismissable-layer]')

      await triggers[0].trigger('pointermove', { pointerType: 'mouse' })
      await vi.advanceTimersByTimeAsync(200)
      await nextTick()

      expect(findContent().exists()).toBe(true)

      await triggers[0].trigger('pointerleave', { pointerType: 'mouse' })
      await triggers[1].trigger('pointermove', { pointerType: 'mouse' })
      await nextTick()

      expect(triggers[1].attributes('data-state')).toBe('open')
      expect(findContent().exists()).toBe(true)

      await vi.advanceTimersByTimeAsync(150)
      await nextTick()

      expect(findContent().exists()).toBe(true)

      localWrapper.unmount()
      vi.useRealTimers()
    })

    it('leaving content closes menu', async () => {
      vi.useFakeTimers()
      await useRealDebounceFn()

      const localWrapper = mount(NavigationMenu, { attachTo: document.body })
      const findContent = () => localWrapper.find('[data-dismissable-layer]')

      await localWrapper.find('[data-navigation-menu-trigger]').trigger('pointermove', { pointerType: 'mouse' })
      await vi.advanceTimersByTimeAsync(200)
      await nextTick()

      expect(findContent().exists()).toBe(true)

      await findContent().trigger('pointerleave', { pointerType: 'mouse' })
      await vi.advanceTimersByTimeAsync(150)
      await nextTick()

      expect(findContent().exists()).toBe(false)

      localWrapper.unmount()
      vi.useRealTimers()
    })
  })
})
