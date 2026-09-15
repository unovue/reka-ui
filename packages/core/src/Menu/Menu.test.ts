import type { VueWrapper } from '@vue/test-utils'
import { findAllByRole } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { nextTick } from 'vue'
import Menu from './story/_Menu.vue'
import MenuWithSubmenu from './story/_MenuWithSubmenu.vue'

describe('given a default Menu', () => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  let wrapper: VueWrapper<InstanceType<typeof Menu>>
  beforeEach(() => {
    document.body.innerHTML = ''
    wrapper = mount(Menu, {
      attachTo: document.body,
    })
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(document.body)).toHaveNoViolations()
  })

  it('should have all the groups', async () => {
    const groups = await findAllByRole(document.body, 'group')
    expect(groups.length).toBe(4)
  })

  it('should render item in group', async () => {
    const group = (await findAllByRole(document.body, 'group'))[0]
    const items = await findAllByRole(group, 'menuitem')
    expect(items.length).toBe(5)
  })

  describe('after focusing on item', () => {
    let firstItem: HTMLElement
    beforeEach(async () => {
      const items = await findAllByRole(document.body, 'menuitem')
      firstItem = items[0]
      firstItem.focus()
      await nextTick()
    })

    it('should have highlighted state', () => {
      expect(firstItem.parentElement?.innerHTML).toContain('data-highlighted')
    })

    describe('after selecting the item', () => {
      beforeEach(async () => {
        firstItem.click()
        await nextTick()
      })

      it('should emit select', () => {
        expect(wrapper.emitted('select')?.length).toBe(1)
      })
    })
  })
})

describe('given a Menu with submenu', () => {
  let wrapper: VueWrapper<InstanceType<typeof MenuWithSubmenu>>
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  beforeEach(() => {
    document.body.innerHTML = ''
    wrapper = mount(MenuWithSubmenu, {
      attachTo: document.body,
    })
  })

  afterEach(async () => {
    wrapper.unmount()
    if (vi.isFakeTimers())
      await vi.runOnlyPendingTimersAsync()
    vi.useRealTimers()
  })

  it('should highlight sub trigger on pointermove', async () => {
    const allItems = await findAllByRole(document.body, 'menuitem')
    const subTrigger = allItems.find(el => el.getAttribute('aria-haspopup') === 'menu')!
    expect(subTrigger).toBeTruthy()

    // Simulate pointermove (mouse) on the sub trigger
    // jsdom doesn't support PointerEvent, so we use MouseEvent with pointerType
    const pointerMoveEvent = new MouseEvent('pointermove', {
      bubbles: true,
    })
    Object.defineProperty(pointerMoveEvent, 'pointerType', { value: 'mouse' })
    subTrigger.dispatchEvent(pointerMoveEvent)
    await nextTick()

    expect(subTrigger.hasAttribute('data-highlighted')).toBe(true)
  })

  it('should keep the submenu open when the pointer moves within its focused trigger', async () => {
    vi.useFakeTimers()
    const subTrigger = wrapper.get<HTMLElement>('[aria-haspopup="menu"]').element

    async function movePointer() {
      // jsdom does not support PointerEvent.
      const event = new MouseEvent('pointermove', { bubbles: true })
      Object.defineProperty(event, 'pointerType', { value: 'mouse' })
      subTrigger.dispatchEvent(event)
      await nextTick()
    }

    await movePointer()
    expect(subTrigger).toHaveFocus()

    await vi.advanceTimersByTimeAsync(100)
    expect(subTrigger).toHaveAttribute('aria-expanded', 'true')

    await movePointer()
    expect(subTrigger).toHaveAttribute('aria-expanded', 'true')
    expect(wrapper.find('[role="menu"][aria-labelledby]').exists()).toBe(true)
  })
})
