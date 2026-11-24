import type { VueWrapper } from '@vue/test-utils'
import { findByRole, queryByRole, waitFor } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h } from 'vue'
import { ContextMenuContent, ContextMenuItem, ContextMenuPortal, ContextMenuRoot, ContextMenuTrigger } from '.'
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

  it('should not force pointer events on the closed trigger', () => {
    expect((wrapper.find('span').element as HTMLElement).style.pointerEvents).toBe('')
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

    it('should keep the open trigger interactive', () => {
      expect((wrapper.find('span').element as HTMLElement).style.pointerEvents).toBe('auto')
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

    it('should keep the pointer position while closing', async () => {
      // Force mount keeps the content in place after closing, like an exit animation does.
      wrapper.unmount()
      document.body.innerHTML = ''
      wrapper = mount(ControlledContextMenu, {
        attachTo: document.body,
        props: { forceMount: true },
      })

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

      const menuWrapper = document.querySelector('[role="menu"]')?.parentElement as HTMLElement

      // Let the initial (closed) position settle before opening.
      await waitFor(() => {
        expect(menuWrapper.style.transform)
          .toContain('translate(98px, 100px)')
      })

      await trigger.trigger('contextmenu', {
        clientX: 300,
        clientY: 400,
      })

      await waitFor(() => {
        expect(menuWrapper.style.transform)
          .toContain('translate(298px, 400px)')
      })

      await wrapper.find('#close-button').trigger('click')

      expect(trigger.attributes('data-state')).toBe('closed')

      // Give floating-ui a chance to reposition against a changed anchor.
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(menuWrapper.style.transform)
        .toContain('translate(298px, 400px)')
    })

    it('should move to the pointer when right-clicked while opened programmatically', async () => {
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

      await trigger.trigger('contextmenu', {
        clientX: 300,
        clientY: 400,
      })

      await waitFor(() => {
        expect(menuWrapper?.style.transform)
          .toContain('translate(298px, 400px)')
      })
    })

    it('should reset pointer position when a controlled open request is rejected', async () => {
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

      await wrapper.find('#reject-open-button').trigger('click')

      await trigger.trigger('contextmenu', {
        clientX: 300,
        clientY: 400,
      })

      expect(queryByRole(document.body, 'menu')).toBeNull()

      await wrapper.find('#open-button').trigger('click')

      const menu = await findByRole(document.body, 'menu')
      const menuWrapper = menu.parentElement

      await waitFor(() => {
        expect(menuWrapper?.style.transform)
          .toContain('translate(98px, 100px)')
      })
    })
  })
})

// https://github.com/unovue/reka-ui/issues/1844
describe('given nested ContextMenus', () => {
  let wrapper: VueWrapper
  const opened: string[] = []

  // Each trigger holds the next menu's root, so a press on an inner trigger bubbles through the outer ones.
  async function mountNested(ids: string[], disabled: string[] = []) {
    const menu = (index: number): ReturnType<typeof h> => h(ContextMenuRoot, {
      'onUpdate:open': (open: boolean) => open && opened.push(ids[index]),
    }, () => [
      h(ContextMenuTrigger, { 'data-testid': ids[index], 'disabled': disabled.includes(ids[index]) }, () => [
        ids[index],
        index + 1 < ids.length ? menu(index + 1) : null,
      ]),
      h(ContextMenuPortal, () => h(ContextMenuContent, () => h(ContextMenuItem, () => `${ids[index]} item`))),
    ])
    wrapper = mount(defineComponent(() => () => menu(0)), { attachTo: document.body })
    // Vue ignores bubbling events stamped in the same millisecond its listeners were attached
    const mountedAt = Date.now()
    await vi.waitFor(() => expect(Date.now()).toBeGreaterThan(mountedAt))
  }

  function pointerDown(id: string, pointerType = 'touch', pointerId = 1) {
    document.querySelector(`[data-testid="${id}"]`)!
      .dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerType, pointerId }))
  }

  beforeEach(() => {
    document.body.innerHTML = ''
    opened.length = 0
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  })

  afterEach(() => {
    wrapper.unmount()
    vi.useRealTimers()
  })

  it.each(['touch', 'pen'])('opens only the inner menu on a %s long press', async (pointerType) => {
    await mountNested(['outer', 'inner'])
    pointerDown('inner', pointerType)
    await vi.advanceTimersByTimeAsync(700)

    expect(opened).toEqual(['inner'])
    expect(document.querySelectorAll('[role="menu"]')).toHaveLength(1)
  })

  it('opens only the innermost of three menus on a long press', async () => {
    await mountNested(['outer', 'middle', 'inner'])
    pointerDown('inner')
    await vi.advanceTimersByTimeAsync(700)

    expect(opened).toEqual(['inner'])
  })

  it('opens the outer menu on a long press on a disabled inner trigger', async () => {
    await mountNested(['outer', 'inner'], ['inner'])
    pointerDown('inner')
    await vi.advanceTimersByTimeAsync(700)

    expect(opened).toEqual(['outer'])
  })

  // A new touch point cancels the long press already running on the trigger, as on a single trigger.
  it('opens only the inner menu when a second finger presses it while the first holds the outer trigger', async () => {
    await mountNested(['outer', 'inner'])
    pointerDown('outer', 'touch', 1)
    await vi.advanceTimersByTimeAsync(300)
    pointerDown('inner', 'touch', 2)
    await vi.advanceTimersByTimeAsync(700)

    expect(opened).toEqual(['inner'])
  })
})
