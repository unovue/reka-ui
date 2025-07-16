import type { DOMWrapper, VueWrapper } from '@vue/test-utils'
import userEvent from '@testing-library/user-event'
import { fireEvent } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { useDebounceFn } from '@vueuse/core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { nextTick } from 'vue'
import { sleep } from '@/test'
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
        expect(links[links.length - 1].element).toBe(document.activeElement)
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

  describe('menu triggers', () => {
    const findMenuItem = () => wrapper.findComponent(NavigationMenuItem)

    const findTriggerButton = () => findMenuItem().find('button')

    const findLinkContent = () => wrapper.find('[data-dismissable-layer]')

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
  })
})
