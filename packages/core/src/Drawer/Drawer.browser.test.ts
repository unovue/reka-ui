import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, ref } from 'vue'
import { DrawerClose, DrawerPopup, DrawerPortal, DrawerRoot, DrawerTitle, DrawerTrigger } from '.'

const STYLE_ID = 'drawer-browser-test-style'
const mounted: { unmount: () => void }[] = []

function addStyle(css: string) {
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = css
  document.head.append(style)
}

function mountDrawer(contentProps: Record<string, unknown> = {}) {
  const onOpenComplete = vi.fn()
  const Fixture = defineComponent({
    setup() {
      return () => h(DrawerRoot, { 'onUpdate:openComplete': onOpenComplete }, () => [
        h(DrawerTrigger, { 'data-testid': 'trigger' }, () => 'Open'),
        h(DrawerPortal, null, () => h(DrawerPopup, {
          'class': 'popup',
          'data-testid': 'content',
          // Above the internal backdrop, as a styled drawer is.
          'style': 'position: fixed; left: 0; right: 0; bottom: 0; z-index: 1; background: white;',
          'aria-describedby': undefined,
          ...contentProps,
        }, () => [
          h(DrawerTitle, null, () => 'Title'),
          h(DrawerClose, { 'data-testid': 'close' }, () => 'Close'),
        ])),
      ])
    },
  })
  const wrapper = mount(Fixture, { attachTo: document.body })
  mounted.push(wrapper)
  const get = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)
  return { wrapper, get, onOpenComplete }
}

describe('given a Drawer, in a real browser', () => {
  afterEach(() => {
    document.getElementById(STYLE_ID)?.remove()
    mounted.splice(0).forEach(wrapper => wrapper.unmount())
  })

  it('reports openComplete after the enter and exit animations finish', async () => {
    addStyle(`
      @keyframes drawer-in { from { opacity: 0 } }
      @keyframes drawer-out { to { opacity: 0 } }
      .popup[data-state="open"] { animation: drawer-in 300ms }
      .popup[data-state="closed"] { animation: drawer-out 300ms }
    `)
    const { get, onOpenComplete } = mountDrawer()

    // Timestamps from before the click: the animation starts during it, so a
    // slow click cannot eat into the measured duration.
    const openedAt = performance.now()
    await userEvent.click(get('trigger')!)
    await expect.poll(() => onOpenComplete.mock.calls, { timeout: 2000 }).toEqual([[true]])
    expect(performance.now() - openedAt).toBeGreaterThan(200)

    const closedAt = performance.now()
    await userEvent.click(get('close')!)
    await expect.poll(() => onOpenComplete.mock.calls, { timeout: 2000 }).toEqual([[true], [false]])
    expect(performance.now() - closedAt).toBeGreaterThan(200)
    await expect.poll(() => get('content')).toBeNull()
  })

  it('reports openComplete right away when the popup has no animation', async () => {
    const { get, onOpenComplete } = mountDrawer()

    await userEvent.click(get('trigger')!)
    await expect.poll(() => onOpenComplete.mock.calls).toEqual([[true]])
    await userEvent.click(get('close')!)
    await expect.poll(() => onOpenComplete.mock.calls).toEqual([[true], [false]])
  })

  it('returns focus to the trigger when a forceMount drawer closes', async () => {
    const { get } = mountDrawer({ forceMount: true })

    await userEvent.click(get('trigger')!)
    // The content is mounted before it opens, so its FocusScope does not move focus on open.
    get('close')!.focus()
    await userEvent.keyboard('{Escape}')
    await expect.poll(() => document.activeElement).toBe(get('trigger'))
  })
})

const BLEED = 48
const EXIT_DURATION = 600

// A stacked layout: while a nested drawer is open, the parent takes the
// frontmost drawer's height (plus a bleed) instead of its own.
const NESTED_STYLES = `
@keyframes nested-in { from { transform: translateY(100%) } to { transform: translateY(0) } }
@keyframes nested-out { from { transform: translateY(0) } to { transform: translateY(100%) } }
.drawer { position: fixed; bottom: 0; left: 0; width: 300px; z-index: 1; background: white; }
.drawer[data-state="open"] { animation: nested-in 50ms linear; }
.drawer[data-state="closed"] { animation: nested-out ${EXIT_DURATION}ms linear; }
.stack {
  --stack-height: max(0px, calc(var(--drawer-frontmost-height, var(--drawer-height)) - ${BLEED}px));
  height: var(--drawer-height, auto);
}
.stack[data-nested-drawer-open] { height: calc(var(--stack-height) + ${BLEED}px); overflow: hidden; }
`

describe('given nested Drawers, in a real browser', () => {
  afterEach(() => {
    document.getElementById(STYLE_ID)?.remove()
    mounted.splice(0).forEach(wrapper => wrapper.unmount())
  })

  it('sizes the parent to the nested drawer, and to itself while the nested drawer animates out', async () => {
    addStyle(NESTED_STYLES)
    const Fixture = defineComponent({
      setup() {
        return () => h(DrawerRoot, null, () => [
          h(DrawerTrigger, { 'data-testid': 'parent-trigger' }, () => 'Open parent'),
          h(DrawerPortal, null, () => [
            h(DrawerPopup, { 'data-testid': 'parent', 'class': 'drawer stack', 'aria-describedby': undefined }, () => [
              h(DrawerTitle, null, () => 'Parent'),
              h('div', { style: 'height: 400px;' }),
              h(DrawerRoot, null, () => [
                h(DrawerTrigger, { 'data-testid': 'child-trigger' }, () => 'Open child'),
                h(DrawerPortal, null, () => [
                  h(DrawerPopup, { 'data-testid': 'child', 'class': 'drawer', 'style': 'height: 240px;', 'aria-describedby': undefined }, () => [
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
    mounted.push(mount(Fixture, { attachTo: document.body }))
    const get = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)
    const heightVar = (id: string) => get(id)?.style.getPropertyValue('--drawer-height')
    // The parent's `--drawer-frontmost-height` and the height it renders at.
    const measure = () => ({
      frontmostHeight: get('parent')!.style.getPropertyValue('--drawer-frontmost-height'),
      renderedHeight: Math.round(get('parent')!.getBoundingClientRect().height),
    })
    const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve))

    await userEvent.click(get('parent-trigger')!)
    await expect.poll(() => heightVar('parent')).toMatch(/px$/)
    await nextFrame()
    const ownHeight = heightVar('parent')!
    const own = { frontmostHeight: ownHeight, renderedHeight: Math.round(Number.parseFloat(ownHeight)) }
    expect(own.renderedHeight).toBeGreaterThan(400)
    const parentOnly = measure()

    await userEvent.click(get('child-trigger')!)
    await expect.poll(() => heightVar('child')).toBe('240px')
    await nextFrame()
    const childOpen = measure()

    await userEvent.click(get('child-close')!)
    // The nested drawer is still mounted and animating out.
    expect(get('child')?.getAttribute('data-state')).toBe('closed')
    expect(get('parent')!.hasAttribute('data-nested-drawer-open')).toBe(true)
    const childAnimatingOut = measure()

    await expect.poll(() => get('child')).toBeNull()
    const childGone = measure()

    expect({ parentOnly, childOpen, childAnimatingOut, childGone }).toEqual({
      parentOnly: own,
      childOpen: { frontmostHeight: '240px', renderedHeight: 240 },
      childAnimatingOut: own,
      childGone: own,
    })
  })

  it('exposes its own height again when the parent reopens', async () => {
    addStyle(NESTED_STYLES)
    const { get } = mountDrawer({ class: 'drawer stack' })
    const frontmostHeight = () => get('content')?.style.getPropertyValue('--drawer-frontmost-height')

    await userEvent.click(get('trigger')!)
    await expect.poll(() => get('content')?.style.getPropertyValue('--drawer-height')).toMatch(/px$/)
    const ownHeight = get('content')!.style.getPropertyValue('--drawer-height')
    await expect.poll(frontmostHeight).toBe(ownHeight)

    await userEvent.click(get('close')!)
    await expect.poll(() => get('content')).toBeNull()
    await userEvent.click(get('trigger')!)
    await expect.poll(() => get('content')).not.toBeNull()
    expect(frontmostHeight()).toBe(ownHeight)
  })

  it('keeps the height of a nested drawer that opened while its sibling was animating out', async () => {
    addStyle(NESTED_STYLES)
    const openFirst = ref(false)
    const openSecond = ref(false)
    const nested = (id: string, open: typeof openFirst, height: number) => h(DrawerRoot, { open: open.value }, () => [
      h(DrawerPortal, null, () => [
        h(DrawerPopup, { 'data-testid': id, 'class': 'drawer', 'style': `height: ${height}px;`, 'aria-describedby': undefined }, () => [
          h(DrawerTitle, null, () => id),
        ]),
      ]),
    ])
    const Fixture = defineComponent({
      setup() {
        return () => h(DrawerRoot, { defaultOpen: true }, () => [
          h(DrawerPortal, null, () => [
            h(DrawerPopup, { 'data-testid': 'parent', 'class': 'drawer stack', 'aria-describedby': undefined }, () => [
              h(DrawerTitle, null, () => 'Parent'),
              h('div', { style: 'height: 400px;' }),
              nested('first', openFirst, 240),
              nested('second', openSecond, 160),
            ]),
          ]),
        ])
      },
    })
    mounted.push(mount(Fixture, { attachTo: document.body }))
    const get = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)
    const frontmostHeight = () => get('parent')?.style.getPropertyValue('--drawer-frontmost-height')

    openFirst.value = true
    await expect.poll(frontmostHeight).toBe('240px')

    openFirst.value = false
    openSecond.value = true
    await expect.poll(frontmostHeight).toBe('160px')
    // The first drawer is still animating out.
    expect(get('first')?.getAttribute('data-state')).toBe('closed')

    await expect.poll(() => get('first')).toBeNull()
    await new Promise(resolve => requestAnimationFrame(resolve))
    expect(frontmostHeight()).toBe('160px')
    expect(Math.round(get('parent')!.getBoundingClientRect().height)).toBe(160)
  })
})
