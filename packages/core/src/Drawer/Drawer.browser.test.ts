import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, nextTick, ref } from 'vue'
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

const ENTER = 80
const EXIT = 120
// Long enough for any animation above to have ended, and for a late emit to show up.
const SETTLE = 400

const OPEN_COMPLETE_STYLES = `
@keyframes oc-in { from { transform: translateY(100%) } to { transform: translateY(0) } }
@keyframes oc-out { from { transform: translateY(0) } to { transform: translateY(100%) } }
.oc { position: fixed; bottom: 0; left: 0; width: 300px; height: 200px; background: white; }
.oc-keyframes[data-state="open"] { animation: oc-in ${ENTER}ms linear; }
.oc-keyframes[data-state="closed"] { animation: oc-out ${EXIT}ms linear; }
.oc-transition { transition: transform 40ms linear, opacity ${EXIT}ms linear; }
.oc-transition[data-state="closed"] { transform: translateY(100%); opacity: 0; }
@starting-style { .oc-transition[data-state="open"] { transform: translateY(100%); opacity: 0; } }
`

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

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
                    h(DrawerContent, { 'data-testid': 'oc', 'class': `oc oc-${variant}`, forceMount }, () => [
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
