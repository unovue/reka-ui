import type { VueWrapper } from '@vue/test-utils'
import { findByRole, queryByRole, waitFor } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import ContextMenu from './story/_ContextMenu.vue'
import ControlledContextMenu from './story/_ControlledContextMenu.vue'

globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.IntersectionObserver = class IntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
} as any

describe('given default ContextMenu', () => {
  let wrapper: VueWrapper<InstanceType<typeof ContextMenu>>

  beforeEach(() => {
    document.body.innerHTML = ''
    wrapper = mount(ContextMenu, { attachTo: document.body })
  })

  it('should render trigger area', () => {
    expect(wrapper.html()).toContain('Right click here')
  })

  describe('when RightClick', () => {
    beforeEach(async () => {
      await wrapper.find('span').trigger('click.right')
    })

    it('should pass axe accessibility tests', async () => {
      expect(await axe(document.body)).toHaveNoViolations()
    })

    it('should render the menu', async () => {
      expect(await findByRole(document.body, 'menu')).toBeTruthy()
    })
  })
})

describe('given controlled ContextMenu', () => {
  let wrapper: VueWrapper<InstanceType<typeof ControlledContextMenu>>

  beforeEach(() => {
    document.body.innerHTML = ''
    wrapper = mount(ControlledContextMenu, { attachTo: document.body })
  })

  describe('when open state is changed programmatically', () => {
    it('should render the menu', async () => {
      await wrapper.find('#open-button').trigger('click')

      expect(await findByRole(document.body, 'menu')).toBeTruthy()
    })

    it('should close the menu', async () => {
      await wrapper.find('#open-button').trigger('click')

      expect(await findByRole(document.body, 'menu')).toBeTruthy()

      await wrapper.find('#close-button').trigger('click')

      expect(queryByRole(document.body, 'menu')).toBeNull()
    })

    it('should position relative to the trigger when opened programmatically', async () => {
      const trigger = wrapper.find('#context-menu-trigger')

      vi.spyOn(trigger.element, 'getBoundingClientRect').mockReturnValue({
        x: 100,
        y: 100,
        left: 100,
        top: 100,
        right: 200,
        bottom: 140,
        width: 100,
        height: 40,
        toJSON: () => {},
      } as DOMRect)

      await wrapper.find('#open-button').trigger('click')

      const menu = await findByRole(document.body, 'menu')
      const menuWrapper = menu.parentElement

      await waitFor(() => {
        expect(menuWrapper?.style.transform)
          .toContain('translate(98px, 100px)')
      })
    })

    it('should position relative to the trigger when reopened programmatically', async () => {
      const trigger = wrapper.find('#context-menu-trigger')

      vi.spyOn(trigger.element, 'getBoundingClientRect').mockReturnValue({
        x: 100,
        y: 100,
        left: 100,
        top: 100,
        right: 200,
        bottom: 140,
        width: 100,
        height: 40,
        toJSON: () => {},
      } as DOMRect)

      // First open from a pointer position.
      await trigger.trigger('contextmenu', {
        clientX: 300,
        clientY: 400,
      })

      const menu = await findByRole(document.body, 'menu')
      const menuWrapper = menu.parentElement

      await waitFor(() => {
        expect(menuWrapper?.style.transform)
          .toContain('translate(298px, 400px)')
      })

      // Close the pointer-opened menu.
      await wrapper.find('#close-button').trigger('click')

      expect(queryByRole(document.body, 'menu')).toBeNull()

      // Reopen programmatically.
      await wrapper.find('#open-button').trigger('click')

      const reopenedMenu = await findByRole(document.body, 'menu')
      const reopenedMenuWrapper = reopenedMenu.parentElement

      await waitFor(() => {
        expect(reopenedMenuWrapper?.style.transform)
          .toContain('translate(98px, 100px)')
      })
    })
  })
})
