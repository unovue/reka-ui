import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h } from 'vue'
import { DrawerClose, DrawerContent, DrawerPortal, DrawerRoot, DrawerTitle, DrawerTrigger } from '.'

const BLEED = 48
const EXIT_DURATION = 600

// A stacked layout: while a nested drawer is open, the parent takes the
// frontmost drawer's height (plus a bleed) instead of its own.
const STYLES = `
@keyframes drawer-in { from { transform: translateY(100%) } to { transform: translateY(0) } }
@keyframes drawer-out { from { transform: translateY(0) } to { transform: translateY(100%) } }
.drawer { position: fixed; bottom: 0; left: 0; width: 300px; background: white; }
.drawer[data-state="open"] { animation: drawer-in 50ms linear; }
.drawer[data-state="closed"] { animation: drawer-out ${EXIT_DURATION}ms linear; }
.stack {
  --stack-height: max(0px, calc(var(--drawer-frontmost-height, var(--drawer-height)) - ${BLEED}px));
  height: var(--drawer-height, auto);
}
.stack[data-nested-drawer-open] { height: calc(var(--stack-height) + ${BLEED}px); overflow: hidden; }
`

const get = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)
const renderedHeight = (id: string) => get(id)!.getBoundingClientRect().height
const cssVar = (id: string, name: string) => get(id)!.style.getPropertyValue(name)

describe('given nested Drawers, in a real browser', () => {
  let cleanup: (() => void) | undefined

  afterEach(() => {
    cleanup?.()
    cleanup = undefined
  })

  it('keeps the parent at its own height while the nested drawer animates out', async () => {
    const style = document.createElement('style')
    style.textContent = STYLES
    document.head.appendChild(style)

    const Fixture = defineComponent({
      setup() {
        return () => h(DrawerRoot, null, () => [
          h(DrawerTrigger, { 'data-testid': 'parent-trigger' }, () => 'Open parent'),
          h(DrawerPortal, null, () => [
            h(DrawerContent, { 'data-testid': 'parent', 'class': 'drawer stack' }, () => [
              h(DrawerTitle, null, () => 'Parent'),
              h('div', { style: 'height: 400px;' }),
              h(DrawerRoot, null, () => [
                h(DrawerTrigger, { 'data-testid': 'child-trigger' }, () => 'Open child'),
                h(DrawerPortal, null, () => [
                  h(DrawerContent, { 'data-testid': 'child', 'class': 'drawer', 'style': 'height: 240px;' }, () => [
                    h(DrawerTitle, null, () => 'Child'),
                    h(DrawerClose, { 'data-testid': 'child-close' }, () => 'Close child'),
                  ]),
                ]),
              ]),
            ]),
          ]),
        ])
      },
    })
    const wrapper = mount(Fixture, { attachTo: document.body })
    cleanup = () => {
      wrapper.unmount()
      style.remove()
    }

    await userEvent.click(get('parent-trigger')!)
    await expect.poll(() => get('parent')?.style.getPropertyValue('--drawer-height')).toMatch(/px$/)
    const ownHeight = cssVar('parent', '--drawer-height')
    expect(Number.parseFloat(ownHeight)).toBeGreaterThan(400)
    expect(cssVar('parent', '--drawer-frontmost-height')).toBe(ownHeight)
    expect(renderedHeight('parent')).toBeCloseTo(Number.parseFloat(ownHeight), 0)

    await userEvent.click(get('child-trigger')!)
    await expect.poll(() => cssVar('parent', '--drawer-frontmost-height')).toBe('240px')
    expect(renderedHeight('parent')).toBeCloseTo(240, 0)

    await userEvent.click(get('child-close')!)
    // The nested drawer is still mounted and animating out.
    expect(get('child')?.getAttribute('data-state')).toBe('closed')
    expect(get('parent')!.hasAttribute('data-nested-drawer-open')).toBe(true)
    expect(cssVar('parent', '--drawer-frontmost-height')).toBe(ownHeight)
    expect(renderedHeight('parent')).toBeCloseTo(Number.parseFloat(ownHeight), 0)

    await expect.poll(() => get('child')).toBeNull()
    expect(cssVar('parent', '--drawer-frontmost-height')).toBe(ownHeight)
    expect(renderedHeight('parent')).toBeCloseTo(Number.parseFloat(ownHeight), 0)
  })
})
