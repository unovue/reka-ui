import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, ref } from 'vue'
import { DrawerPopup, DrawerPortal, DrawerRoot, DrawerTitle, DrawerTrigger } from '.'

const EXIT_DURATION = 1500

const STYLES = `
@keyframes drawer-exit-out { from { transform: translateY(0) } to { transform: translateY(100%) } }
.drawer-exit { position: fixed; bottom: 0; left: 0; width: 300px; background: white; }
.drawer-exit[data-state="closed"] { animation: drawer-exit-out ${EXIT_DURATION}ms linear; }
.drawer-exit-parent { height: 400px; }
.drawer-exit-child { height: 200px; }
`

const get = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)

// The exit animation keeps the closed drawer mounted, which only a real browser runs.
describe('given a nested Drawer that animates out', () => {
  let cleanup: (() => void) | undefined

  afterEach(() => {
    cleanup?.()
    cleanup = undefined
  })

  async function openBoth() {
    const style = document.createElement('style')
    style.textContent = STYLES
    document.head.appendChild(style)
    const count = ref(0)
    const wrapper = mount(defineComponent({
      setup() {
        return () => h(DrawerRoot, { defaultOpen: true }, () => [
          h(DrawerPortal, null, () => [
            h(DrawerPopup, { 'data-testid': 'parent', 'class': 'drawer-exit drawer-exit-parent' }, () => [
              h(DrawerTitle, null, () => 'Parent'),
              h('button', { 'data-testid': 'parent-action', 'onClick': () => count.value++ }, 'Parent action'),
              h(DrawerRoot, null, () => [
                h(DrawerTrigger, { 'data-testid': 'child-trigger' }, () => 'Open child'),
                h(DrawerPortal, null, () => [
                  h(DrawerPopup, { 'data-testid': 'child', 'class': 'drawer-exit drawer-exit-child' }, () => [
                    h(DrawerTitle, null, () => 'Child'),
                    h('button', null, 'Child action'),
                  ]),
                ]),
              ]),
            ]),
          ]),
        ])
      },
    }), { attachTo: document.body })
    cleanup = () => {
      wrapper.unmount()
      style.remove()
    }

    await expect.poll(() => get('parent')).not.toBeNull()
    await userEvent.click(get('child-trigger')!)
    await expect.poll(() => get('child')?.getAttribute('data-state')).toBe('open')
    return count
  }

  it('lets the drawer below take a press while the drawer on top animates out', async () => {
    const count = await openBoth()

    await userEvent.keyboard('{Escape}')
    await expect.poll(() => get('child')?.getAttribute('data-state')).toBe('closed')

    // A press on an element the closing layer still made inert would never land.
    await userEvent.click(get('parent-action')!, { timeout: 500 })
    expect(get('child')?.getAttribute('data-state')).toBe('closed')
    expect(count.value).toBe(1)
  })

  it('closes the drawer below on a second Escape while the drawer on top animates out', async () => {
    await openBoth()

    await userEvent.keyboard('{Escape}')
    await expect.poll(() => get('child')?.getAttribute('data-state')).toBe('closed')
    expect(get('parent')?.getAttribute('data-state')).toBe('open')

    await userEvent.keyboard('{Escape}')
    expect(get('child')?.getAttribute('data-state')).toBe('closed')
    await expect.poll(() => get('parent')?.getAttribute('data-state'), { timeout: 500 }).toBe('closed')
  })
})
