import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { commands } from 'vitest/browser'
import { defineComponent, h } from 'vue'
import { DrawerPopup, DrawerPortal, DrawerRoot, DrawerTitle } from '.'

const HEIGHT = 400

const STYLES = `
.drawer {
  position: fixed; bottom: 0; left: 0; width: 300px; height: ${HEIGHT}px; background: white;
  transform: translateY(var(--drawer-swipe-movement-y, 0px));
}
`

const content = () => document.querySelector<HTMLElement>('[data-testid="drawer"]')

// The release decision reads the popup's size and the speed of real pointer
// moves, neither of which jsdom has.
describe('given a Drawer swiped with a real pointer', () => {
  let cleanup: (() => void) | undefined

  afterEach(() => {
    cleanup?.()
    cleanup = undefined
  })

  function setup() {
    const style = document.createElement('style')
    style.textContent = STYLES
    document.head.appendChild(style)
    const wrapper = mount(defineComponent({
      setup() {
        return () => h(DrawerRoot, { defaultOpen: true }, () => [
          h(DrawerPortal, null, () => [
            h(DrawerPopup, { 'data-testid': 'drawer', 'class': 'drawer' }, () => [
              h(DrawerTitle, null, () => 'Drawer'),
            ]),
          ]),
        ])
      },
    }), { attachTo: document.body })
    cleanup = () => {
      wrapper.unmount()
      style.remove()
    }
  }

  /** Drags down from the top of the drawer, then holds before the release unless `holdMs` is 0. */
  async function dragDown(distance: number, holdMs: number) {
    await expect.poll(() => content()).not.toBeNull()
    const box = content()!.getBoundingClientRect()
    const x = box.left + 150
    const y = box.top + 12
    await commands.mouseDrag(x, y, x, y + distance, 10, holdMs)
  }

  it('settles back open after a slow drag of a quarter of its height', async () => {
    setup()
    await dragDown(HEIGHT / 4, 300)

    await new Promise(resolve => setTimeout(resolve, 100))
    expect(content()?.getAttribute('data-state')).toBe('open')
    expect(content()!.hasAttribute('data-swipe-dismissed')).toBe(false)
    expect(content()!.style.getPropertyValue('--drawer-swipe-movement-y')).toBe('0px')
    expect(content()!.getBoundingClientRect().bottom).toBeCloseTo(window.innerHeight, 0)
  })

  it('closes after a slow drag past half of its height', async () => {
    setup()
    await dragDown(HEIGHT * 0.75, 300)

    await expect.poll(() => content()).toBeNull()
  })

  it('closes after a fast flick shorter than half of its height', async () => {
    setup()
    await dragDown(120, 0)

    await expect.poll(() => content()).toBeNull()
  })
})
