import type { VueWrapper } from '@vue/test-utils'
import { findByRole } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { nextTick } from 'vue'
import Menubar from './story/_Menubar.vue'
import MenubarUnmountOnHide from './story/_MenubarUnmountOnHide.vue'

globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe('given default Menubar', () => {
  let wrapper: VueWrapper<InstanceType<typeof Menubar>>

  beforeEach(() => {
    document.body.innerHTML = ''
    wrapper = mount(Menubar, { attachTo: document.body })
  })

  it('should render all trigger button', () => {
    expect(wrapper.findAll('button').length).toBe(4)
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  describe('after opening the dropdown', () => {
    beforeEach(async () => {
      await wrapper.find('button').trigger('pointerdown', {
        button: 0,
        ctrlKey: false,
      })
    })

    it('should pass axe accessibility tests', async () => {
      expect(await axe(wrapper.element)).toHaveNoViolations()
    })

    it('should render the menu', async () => {
      expect(await findByRole(wrapper.element as HTMLElement, 'menu')).toBeTruthy()
    })

    describe('after selecting the first item', () => {
      beforeEach(async () => {
        const item = wrapper.find('[role="menu"]').find('[role="menuitem"]')
        await item.trigger('click')
      })

      it('should close the modal', () => {
        expect(wrapper.find('[role="menu"]').exists()).toBeFalsy()
      })

      it('should emit select event', () => {
        expect(wrapper.emitted('select')?.length).toBe(1)
      })
    })
  })
})

describe('given Menubar with default `unmountOnHide` (true)', () => {
  let wrapper: VueWrapper<InstanceType<typeof MenubarUnmountOnHide>>

  beforeEach(() => {
    document.body.innerHTML = ''
    wrapper = mount(MenubarUnmountOnHide, { attachTo: document.body })
  })

  it('should not render menu content when closed', () => {
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
  })

  describe('after opening and closing a menu', () => {
    beforeEach(async () => {
      // Open menu
      await wrapper.find('button').trigger('pointerdown', {
        button: 0,
        ctrlKey: false,
      })
      await nextTick()

      // Verify it opened
      expect(wrapper.find('[role="menu"]').exists()).toBe(true)

      // Close by clicking item
      const item = wrapper.find('[role="menu"]').find('[role="menuitem"]')
      await item.trigger('click')
      await nextTick()
    })

    it('should remove menu content from DOM', () => {
      expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    })
  })
})

describe('given Menubar with `unmountOnHide: false`', () => {
  let wrapper: VueWrapper<InstanceType<typeof MenubarUnmountOnHide>>

  beforeEach(() => {
    document.body.innerHTML = ''
    wrapper = mount(MenubarUnmountOnHide, {
      attachTo: document.body,
      props: { unmountOnHide: false },
    })
  })

  it('should keep menu content in DOM when closed', async () => {
    // Content should be in DOM but hidden
    const menus = wrapper.findAll('[role="menu"]')
    expect(menus.length).toBeGreaterThan(0)
  })

  it('should hide menu content with display:none when closed', async () => {
    const menu = wrapper.find('[role="menu"]')
    expect(menu.exists()).toBe(true)
    expect(menu.isVisible()).toBe(false)
  })

  describe('after opening a menu', () => {
    beforeEach(async () => {
      await wrapper.find('button').trigger('pointerdown', {
        button: 0,
        ctrlKey: false,
      })
      await nextTick()
    })

    it('should show the menu content', () => {
      const menu = wrapper.find('[role="menu"]')
      expect(menu.exists()).toBe(true)
      expect(menu.isVisible()).toBe(true)
    })

    describe('after selecting an item', () => {
      beforeEach(async () => {
        const item = wrapper.find('[role="menu"]').find('[role="menuitem"]')
        await item.trigger('click')
        await nextTick()
      })

      it('should keep menu content in DOM but hidden', () => {
        const menu = wrapper.find('[role="menu"]')
        expect(menu.exists()).toBe(true)
        expect(menu.isVisible()).toBe(false)
      })
    })
  })
})
