import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { DrawerPopup, DrawerPortal, DrawerRoot, DrawerTitle } from '.'

const STYLES = `
.drawer {
  position: fixed; bottom: 0; left: 0; box-sizing: border-box; width: 300px; height: 480px;
  padding: 16px; border-top: 1px solid black; background: white;
  transform: translateY(var(--drawer-snap-point-offset, 0px));
}
`

const content = () => document.querySelector<HTMLElement>('[data-testid="drawer"]')

// jsdom has no layout, so the popup's box can only be measured here.
// TODO(v3-port): #3405 v3 measures the popup's content box for snap points
describe.skip('given a Drawer with snap points and a padded, bordered popup', () => {
  let cleanup: (() => void) | undefined

  afterEach(() => {
    cleanup?.()
    cleanup = undefined
  })

  it('shows the height of the active snap point', async () => {
    const style = document.createElement('style')
    style.textContent = STYLES
    document.head.appendChild(style)
    const wrapper = mount(defineComponent({
      setup() {
        return () => h(DrawerRoot, { defaultOpen: true, snapPoints: ['240px', '480px'], defaultSnapPoint: '240px' }, () => [
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

    await expect.poll(() => content()?.style.getPropertyValue('--drawer-height')).toBe('480px')
    expect(content()!.style.getPropertyValue('--drawer-snap-point-offset')).toBe('240px')
    expect(window.innerHeight - content()!.getBoundingClientRect().top).toBeCloseTo(240, 0)
  })
})
