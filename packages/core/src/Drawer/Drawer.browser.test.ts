import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, nextTick, ref } from 'vue'
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

const ENTER = 80
const EXIT = 120
// Long enough for any animation above to have ended, and for a late emit to show up.
const SETTLE = 400

const OPEN_COMPLETE_STYLES = `
@keyframes oc-in { from { transform: translateY(100%) } to { transform: translateY(0) } }
@keyframes oc-out { from { transform: translateY(0) } to { transform: translateY(100%) } }
.oc { position: fixed; bottom: 0; left: 0; z-index: 1; width: 300px; height: 200px; background: white; }
.oc-keyframes[data-state="open"] { animation: oc-in ${ENTER}ms linear; }
.oc-keyframes[data-state="closed"] { animation: oc-out ${EXIT}ms linear; }
.oc-transition { transition: transform 40ms linear, opacity ${EXIT}ms linear; }
.oc-transition[data-state="closed"] { transform: translateY(100%); opacity: 0; }
@starting-style { .oc-transition[data-state="open"] { transform: translateY(100%); opacity: 0; } }
`

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
const get = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)

describe('given a Drawer listening to `update:openComplete`, in a real browser', () => {
  let cleanup: (() => void) | undefined

  afterEach(() => {
    cleanup?.()
    cleanup = undefined
  })

  function setup(options: { variant?: 'keyframes' | 'transition' | 'none', forceMount?: boolean, defaultOpen?: boolean } = {}) {
    const { variant = 'keyframes', forceMount = false, defaultOpen = false } = options
    const style = document.createElement('style')
    style.textContent = OPEN_COMPLETE_STYLES
    document.head.appendChild(style)

    const events: boolean[] = []
    // Animations still running on the popup at the time of each emit.
    const running: number[] = []
    const open = ref(false)
    const showRoot = ref(true)
    const showContent = ref(true)

    const Fixture = defineComponent({
      setup() {
        return () => showRoot.value
          ? h(DrawerRoot, {
              ...(defaultOpen ? { defaultOpen: true } : { 'open': open.value, 'onUpdate:open': (value: boolean) => { open.value = value } }),
              'onUpdate:openComplete': (value: boolean) => {
                events.push(value)
                running.push(get('oc')?.getAnimations().length ?? 0)
              },
            }, () => [
              h(DrawerTrigger, { 'data-testid': 'oc-trigger' }, () => 'Open'),
              showContent.value
                ? h(DrawerPortal, null, () => [
                    h(DrawerPopup, { 'data-testid': 'oc', 'class': `oc oc-${variant}`, forceMount, 'aria-describedby': undefined }, () => [
                      h(DrawerTitle, null, () => 'Title'),
                      h(DrawerClose, { 'data-testid': 'oc-close' }, () => 'Close'),
                    ]),
                  ])
                : null,
            ])
          : null
      },
    })
    const wrapper = mount(Fixture, { attachTo: document.body })
    cleanup = () => {
      wrapper.unmount()
      style.remove()
    }
    return { events, running, open, showRoot, showContent }
  }

  it('emits once per completed open and close with a keyframe animation', async () => {
    const { events, running } = setup()

    await userEvent.click(get('oc-trigger')!)
    await expect.poll(() => events).toEqual([true])
    await userEvent.click(get('oc-close')!)
    await expect.poll(() => events).toEqual([true, false])
    await expect.poll(() => get('oc')).toBeNull()

    await userEvent.click(get('oc-trigger')!)
    await expect.poll(() => events).toEqual([true, false, true])
    await userEvent.click(get('oc-close')!)
    await expect.poll(() => events).toEqual([true, false, true, false])

    await sleep(SETTLE)
    expect(events).toEqual([true, false, true, false])
    expect(running).toEqual([0, 0, 0, 0])
  })

  it('waits for every transition to finish, not the first one', async () => {
    const { events, running, open } = setup({ variant: 'transition', forceMount: true })

    open.value = true
    await expect.poll(() => events).toEqual([true])
    open.value = false
    await expect.poll(() => events).toEqual([true, false])

    await sleep(SETTLE)
    expect(events).toEqual([true, false])
    expect(running).toEqual([0, 0])
  })

  it('emits on close when a transition-only drawer unmounts', async () => {
    const { events, open } = setup({ variant: 'transition' })

    open.value = true
    await expect.poll(() => events).toEqual([true])
    open.value = false
    await expect.poll(() => events).toEqual([true, false])

    await sleep(SETTLE)
    expect(events).toEqual([true, false])
  })

  it('emits for a drawer without any animation', async () => {
    const { events, open } = setup({ variant: 'none' })

    open.value = true
    await expect.poll(() => events).toEqual([true])
    open.value = false
    await expect.poll(() => events).toEqual([true, false])
    open.value = true
    await expect.poll(() => events).toEqual([true, false, true])

    // A later transition on the popup, such as a swipe snapping back, is not an opening.
    const popup = get('oc')!
    popup.style.transition = 'transform 40ms linear'
    popup.getBoundingClientRect()
    popup.style.transform = 'translateY(20px)'
    await sleep(SETTLE)
    expect(events).toEqual([true, false, true])
  })

  it('emits once per completed open and close when force mounted', async () => {
    const { events, running, open } = setup({ forceMount: true })

    open.value = true
    await expect.poll(() => events).toEqual([true])
    open.value = false
    await expect.poll(() => events).toEqual([true, false])
    open.value = true
    await expect.poll(() => events).toEqual([true, false, true])
    open.value = false
    await expect.poll(() => events).toEqual([true, false, true, false])

    await sleep(SETTLE)
    expect(events).toEqual([true, false, true, false])
    expect(running).toEqual([0, 0, 0, 0])
    expect(get('oc')).not.toBeNull()
  })

  it.each(['keyframes', 'none'] as const)('emits for a drawer that is open by default (%s)', async (variant) => {
    const { events } = setup({ variant, defaultOpen: true })

    await expect.poll(() => events).toEqual([true])
    await userEvent.click(get('oc-close')!)
    await expect.poll(() => events).toEqual([true, false])

    await sleep(SETTLE)
    expect(events).toEqual([true, false])
  })

  it('emits nothing for a close that is interrupted by reopening', async () => {
    const { events, open } = setup()

    open.value = true
    await expect.poll(() => events).toEqual([true])
    open.value = false
    await sleep(EXIT / 3)
    expect(get('oc')?.getAttribute('data-state')).toBe('closed')
    open.value = true
    await expect.poll(() => events).toEqual([true, true])

    await sleep(SETTLE)
    expect(events).toEqual([true, true])

    open.value = false
    await expect.poll(() => events).toEqual([true, true, false])
  })

  it('emits nothing for an open that is interrupted by closing', async () => {
    const { events, open } = setup()

    open.value = true
    await nextTick()
    await sleep(ENTER / 4)
    expect(get('oc')?.getAnimations()).toHaveLength(1)
    open.value = false
    await expect.poll(() => events).toEqual([false])

    await sleep(SETTLE)
    expect(events).toEqual([false])
  })

  it('emits nothing when the root unmounts while open', async () => {
    const { events, open, showRoot } = setup()

    open.value = true
    await expect.poll(() => events).toEqual([true])
    showRoot.value = false
    await expect.poll(() => get('oc')).toBeNull()

    await sleep(SETTLE)
    expect(events).toEqual([true])
  })

  it('emits nothing when the root unmounts in the middle of closing', async () => {
    const { events, open, showRoot } = setup()

    open.value = true
    await expect.poll(() => events).toEqual([true])
    open.value = false
    await sleep(EXIT / 3)
    expect(get('oc')?.getAttribute('data-state')).toBe('closed')
    showRoot.value = false
    await expect.poll(() => get('oc')).toBeNull()

    await sleep(SETTLE)
    expect(events).toEqual([true])
  })

  it('completes the close when only the content unmounts in the middle of closing', async () => {
    const { events, open, showContent } = setup()

    open.value = true
    await expect.poll(() => events).toEqual([true])
    open.value = false
    await sleep(EXIT / 3)
    expect(get('oc')?.getAttribute('data-state')).toBe('closed')
    showContent.value = false
    await expect.poll(() => events).toEqual([true, false])

    await sleep(SETTLE)
    expect(events).toEqual([true, false])
  })
})
