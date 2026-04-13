import type { VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import DropdownMenuWithFilter from './story/_DropdownMenuWithFilter.vue'

describe('given DropdownMenu with Filter', () => {
  let wrapper: VueWrapper<InstanceType<typeof DropdownMenuWithFilter>>

  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  beforeEach(() => {
    document.body.innerHTML = ''
    wrapper = mount(DropdownMenuWithFilter, { attachTo: document.body })
  })

  it('should render trigger button', () => {
    expect(wrapper.find('button').exists()).toBeTruthy()
  })

  describe('after opening the dropdown', () => {
    beforeEach(async () => {
      await wrapper.find('button').trigger('click')
      await nextTick()
    })

    it('should render filter input', async () => {
      const filterInput = document.querySelector('[role="searchbox"]')
      expect(filterInput).toBeTruthy()
    })

    it('should have correct type and role attributes', async () => {
      const filterInput = document.querySelector('[role="searchbox"]')
      expect(filterInput?.getAttribute('type')).toBe('text')
      expect(filterInput?.getAttribute('role')).toBe('searchbox')
    })

    it('should update modelValue when typing', async () => {
      const filterInput = document.querySelector('[role="searchbox"]') as HTMLInputElement
      filterInput.value = 'New'
      filterInput.dispatchEvent(new Event('input'))
      await nextTick()

      expect(wrapper.vm.filterText).toBe('New')
    })

    it('should filter menu items based on input', async () => {
      // Initially all items should be visible
      let items = document.querySelectorAll('[role="menuitem"]')
      expect(items.length).toBe(4)

      // Type filter
      const filterInput = document.querySelector('[role="searchbox"]') as HTMLInputElement
      filterInput.value = 'New'
      filterInput.dispatchEvent(new Event('input'))
      await nextTick()

      // Only "New Tab" and "New Window" should be visible
      items = document.querySelectorAll('[role="menuitem"]')
      expect(items.length).toBe(2)
      expect(items[0]?.textContent).toContain('New Tab')
      expect(items[1]?.textContent).toContain('New Window')
    })

    it('should handle ArrowDown key to navigate to items', async () => {
      const filterInput = document.querySelector('[role="searchbox"]') as HTMLInputElement
      filterInput.focus()

      // Press ArrowDown
      filterInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
      await nextTick()

      const firstItem = document.querySelector('[role="menuitem"]')
      expect(firstItem?.getAttribute('data-highlighted')).toBe('')
    })

    it('should handle ArrowUp key to navigate to last item', async () => {
      const filterInput = document.querySelector('[role="searchbox"]') as HTMLInputElement
      filterInput.focus()

      // Press ArrowUp
      filterInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))
      await nextTick()

      const items = [...document.querySelectorAll('[role="menuitem"]')]
      const lastItem = items.at(-1)
      expect(lastItem?.getAttribute('data-highlighted')).toBe('')
    })

    it('should handle Escape key to clear filter when not empty', async () => {
      const filterInput = document.querySelector('[role="searchbox"]') as HTMLInputElement
      filterInput.value = 'test'
      filterInput.dispatchEvent(new Event('input'))
      await nextTick()

      expect(wrapper.vm.filterText).toBe('test')

      // Press Escape
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
      filterInput.dispatchEvent(escapeEvent)
      await nextTick()

      expect(wrapper.vm.filterText).toBe('')
    })

    it('should sync aria-activedescendant with highlighted item', async () => {
      const filterInput = document.querySelector('[role="searchbox"]') as HTMLInputElement
      filterInput.focus()

      // Press ArrowDown to highlight first item
      filterInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
      await nextTick()

      const firstItem = document.querySelector('[role="menuitem"]')
      const activeDescendant = filterInput?.getAttribute('aria-activedescendant')
      expect(activeDescendant).toBe(firstItem?.id)
    })
  })

  describe('with disabled filter', () => {
    beforeEach(async () => {
      wrapper.unmount()
      wrapper = mount(DropdownMenuWithFilter, {
        attachTo: document.body,
        props: {
          disabledFilter: true,
        },
      })
      await wrapper.find('button').trigger('click')
      await nextTick()
    })

    it('should render disabled filter input', async () => {
      const filterInput = document.querySelector('[role="searchbox"]')
      expect(filterInput?.hasAttribute('disabled')).toBe(true)
      expect(filterInput?.getAttribute('data-disabled')).toBe('')
    })
  })
})
