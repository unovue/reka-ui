import type { DrawerModal } from '.'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import { defineComponent, h, nextTick, ref } from 'vue'
import { DrawerClose, DrawerContent, DrawerOverlay, DrawerPortal, DrawerRoot, DrawerTitle, DrawerTrigger } from '.'

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

  it('keeps the height of a nested drawer that opened while its sibling was animating out', async () => {
    const style = document.createElement('style')
    style.textContent = STYLES
    document.head.appendChild(style)

    const nested = (id: string, open: boolean, height: number) => h(DrawerRoot, { open }, () => [
      h(DrawerPortal, null, () => [
        h(DrawerContent, { 'data-testid': id, 'class': 'drawer', 'style': `height: ${height}px;` }, () => [
          h(DrawerTitle, null, () => id),
        ]),
      ]),
    ])
    const Fixture = defineComponent({
      props: { openFirst: Boolean, openSecond: Boolean },
      setup(props) {
        return () => h(DrawerRoot, { defaultOpen: true }, () => [
          h(DrawerPortal, null, () => [
            h(DrawerContent, { 'data-testid': 'parent', 'class': 'drawer stack' }, () => [
              h(DrawerTitle, null, () => 'Parent'),
              h('div', { style: 'height: 400px;' }),
              nested('first', props.openFirst, 240),
              nested('second', props.openSecond, 160),
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

    await wrapper.setProps({ openFirst: true })
    await expect.poll(() => cssVar('parent', '--drawer-frontmost-height')).toBe('240px')

    await wrapper.setProps({ openFirst: false, openSecond: true })
    await expect.poll(() => cssVar('parent', '--drawer-frontmost-height')).toBe('160px')
    // The first drawer is still animating out.
    expect(get('first')?.getAttribute('data-state')).toBe('closed')

    await expect.poll(() => get('first')).toBeNull()
    await new Promise(resolve => requestAnimationFrame(resolve))
    expect(cssVar('parent', '--drawer-frontmost-height')).toBe('160px')
    expect(renderedHeight('parent')).toBeCloseTo(160, 0)
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

describe('given a modal Drawer with an exit animation, in a real browser', () => {
  // Headless Chromium draws no scrollbar, so the lock sees no gap to make up for. Reporting a
  // window wider than the document gives it one.
  const GAP = 15
  // The exit animations are paused, so that a drawer stays in its exit until the test ends it.
  const STYLES = `
    body { margin: 0 }
    @keyframes drawer-lock-out { from { opacity: 1 } to { opacity: 0 } }
    .exit[data-state="closed"] { animation: drawer-lock-out 1s linear paused; }
    .exit-transition { transition: opacity 1s linear; }
    .exit-transition[data-state="closed"] { opacity: 0; }
  `

  interface Options {
    modal?: DrawerModal
    overlay?: boolean
    overlayExit?: boolean
    contentExit?: boolean | 'transition'
    forceMountOverlay?: boolean
    forceMountContent?: boolean
  }

  let sheet: HTMLStyleElement
  let page: HTMLElement
  let observer: MutationObserver | undefined

  beforeEach(() => {
    vi.spyOn(window, 'innerWidth', 'get').mockImplementation(() => document.documentElement.clientWidth + GAP)
    sheet = document.createElement('style')
    sheet.textContent = STYLES
    document.head.append(sheet)
    page = document.createElement('div')
    page.style.height = '3000px'
    document.body.append(page)
  })

  afterEach(() => {
    observer?.disconnect()
    observer = undefined
    vi.restoreAllMocks()
    sheet.remove()
    page.remove()
    document.body.removeAttribute('style')
  })

  const lock = () => ({
    overflow: document.body.style.overflow,
    paddingRight: document.body.style.paddingRight,
    scrollbarWidth: document.documentElement.style.getPropertyValue('--scrollbar-width'),
  })
  const LOCKED = { overflow: 'hidden', paddingRight: `${GAP}px`, scrollbarWidth: `${GAP}px` }
  const UNLOCKED = { overflow: '', paddingRight: '', scrollbarWidth: '' }

  /**
   * Every value the body `overflow` goes through from here on. The observer is only told after
   * the script that wrote the style has finished, so an unlock that is undone in the same turn
   * never shows in the live style. Each record carries the style it replaced, and those are read too.
   */
  function recordOverflow() {
    const values = [document.body.style.overflow]
    const previous = document.createElement('div')
    const push = (value: string) => {
      if (value !== values.at(-1))
        values.push(value)
    }
    observer = new MutationObserver((records) => {
      for (const record of records) {
        previous.setAttribute('style', record.oldValue ?? '')
        push(previous.style.overflow)
      }
      push(document.body.style.overflow)
    })
    observer.observe(document.body, { attributes: true, attributeFilter: ['style'], attributeOldValue: true })
    return values
  }

  const exiting = (id: string) => get(id)?.getAnimations().some(animation => animation.playState === 'paused') ?? false
  const finishExit = (id: string) => get(id)!.getAnimations().forEach(animation => animation.finish())

  function drawer(id: string, open: { value: boolean }, options: Options = {}, children?: () => unknown) {
    const { modal = true, overlay = true, overlayExit, contentExit, forceMountOverlay, forceMountContent } = options
    return h(DrawerRoot, { 'open': open.value, 'onUpdate:open': (value: boolean) => open.value = value, modal }, () => [
      h(DrawerPortal, null, () => [
        overlay
          ? h(DrawerOverlay, { 'data-testid': `${id}-overlay`, 'class': overlayExit ? 'exit' : undefined, 'forceMount': forceMountOverlay, 'style': 'position: fixed; inset: 0;' })
          : null,
        h(DrawerContent, {
          'data-testid': id,
          'class': contentExit === 'transition' ? 'exit-transition' : contentExit ? 'exit' : undefined,
          'forceMount': forceMountContent,
          'style': 'position: fixed; bottom: 0; left: 0; width: 300px; height: 200px; background: white;',
        }, () => [
          h(DrawerTitle, null, () => 'Title'),
          h(DrawerClose, null, () => 'Close'),
          children?.(),
        ]),
      ]),
    ])
  }

  async function mountOpenDrawer(options?: Options) {
    const open = ref(true)
    const show = ref(true)
    const overlay = ref(options?.overlay ?? true)
    mount(defineComponent({
      setup: () => () => show.value ? drawer('content', open, { ...options, overlay: overlay.value }) : null,
    }), { attachTo: document.body })
    await expect.poll(() => get('content')?.contains(document.activeElement)).toBe(true)
    await nextTick()
    return { open, show, overlay }
  }

  it.each<{ name: string, options: Options }>([
    { name: 'the content and the overlay both animate out', options: { contentExit: true, overlayExit: true } },
    { name: 'only the content animates out', options: { contentExit: true } },
    { name: 'only the content animates out, under a force-mounted overlay', options: { contentExit: true, forceMountOverlay: true } },
    { name: 'only the content animates out, both force-mounted', options: { contentExit: true, forceMountOverlay: true, forceMountContent: true } },
    { name: 'only the content animates out, in a `trap-focus` drawer', options: { modal: 'trap-focus', contentExit: true } },
  ])('keeps body scroll locked until the exit has finished when $name', async ({ options }) => {
    await mountOpenDrawer(options)
    expect(lock()).toEqual(LOCKED)
    const overflow = recordOverflow()

    await userEvent.keyboard('{Escape}')
    await expect.poll(() => exiting('content')).toBe(true)
    if (options.overlayExit) {
      // The overlay finishes first, as it would with the shorter of two animations.
      await expect.poll(() => exiting('content-overlay')).toBe(true)
      finishExit('content-overlay')
    }
    if (!options.forceMountOverlay)
      await expect.poll(() => get('content-overlay')).toBeNull()
    expect(lock()).toEqual(LOCKED)
    expect(overflow).toEqual(['hidden'])

    finishExit('content')
    await expect.poll(lock).toEqual(UNLOCKED)
    if (!options.forceMountContent)
      await expect.poll(() => get('content')).toBeNull()
    expect(overflow).toEqual(['hidden', ''])
  })

  it('keeps body scroll locked until a force-mounted content has finished its exit transition', async () => {
    await mountOpenDrawer({ contentExit: 'transition', forceMountContent: true })
    expect(lock()).toEqual(LOCKED)
    const overflow = recordOverflow()

    await userEvent.keyboard('{Escape}')
    await expect.poll(() => get('content')!.getAnimations().length).toBe(1)
    get('content')!.getAnimations()[0].pause()
    await expect.poll(() => get('content-overlay')).toBeNull()
    expect(lock()).toEqual(LOCKED)

    finishExit('content')
    await expect.poll(lock).toEqual(UNLOCKED)
    expect(overflow).toEqual(['hidden', ''])
  })

  it('keeps body scroll locked until the exit has finished when the drawer is swiped away', async () => {
    const { open } = await mountOpenDrawer({ contentExit: true })
    const overflow = recordOverflow()

    const box = get('content')!.getBoundingClientRect()
    await commands.mouseDrag(box.left + 150, box.top + 60, box.left + 150, box.top + 190, 8)
    await expect.poll(() => open.value).toBe(false)
    await expect.poll(() => exiting('content')).toBe(true)
    expect(lock()).toEqual(LOCKED)
    expect(overflow).toEqual(['hidden'])

    finishExit('content')
    await expect.poll(lock).toEqual(UNLOCKED)
    expect(overflow).toEqual(['hidden', ''])
  })

  it('keeps body scroll locked until the overlay has finished when only the overlay animates out', async () => {
    await mountOpenDrawer({ overlayExit: true })
    const overflow = recordOverflow()

    await userEvent.keyboard('{Escape}')
    await expect.poll(() => exiting('content-overlay')).toBe(true)
    expect(get('content')).toBeNull()
    expect(lock()).toEqual(LOCKED)

    finishExit('content-overlay')
    await expect.poll(() => get('content-overlay')).toBeNull()
    expect(lock()).toEqual(UNLOCKED)
    expect(overflow).toEqual(['hidden', ''])
  })

  it.each<{ name: string, options: Options }>([
    { name: 'a drawer', options: { contentExit: true } },
    { name: 'a drawer with a force-mounted overlay and content', options: { contentExit: true, forceMountOverlay: true, forceMountContent: true } },
  ])('keeps the lock without a gap when $name is reopened during its exit', async ({ options }) => {
    const { open } = await mountOpenDrawer(options)
    const overflow = recordOverflow()

    await userEvent.keyboard('{Escape}')
    await expect.poll(() => exiting('content')).toBe(true)
    expect(lock()).toEqual(LOCKED)

    open.value = true
    await expect.poll(() => get('content')?.dataset.state).toBe('open')
    await expect.poll(() => get('content-overlay')?.dataset.state).toBe('open')
    await expect.poll(() => exiting('content')).toBe(false)
    expect(lock()).toEqual(LOCKED)
    expect(overflow).toEqual(['hidden'])

    open.value = false
    await expect.poll(() => exiting('content')).toBe(true)
    finishExit('content')
    await expect.poll(lock).toEqual(UNLOCKED)
    expect(overflow).toEqual(['hidden', ''])
  })

  it('gives body scroll back when the drawer is reopened during its exit without its overlay', async () => {
    const { open, overlay } = await mountOpenDrawer({ contentExit: true })
    const overflow = recordOverflow()

    await userEvent.keyboard('{Escape}')
    await expect.poll(() => exiting('content')).toBe(true)
    expect(get('content-overlay')).toBeNull()
    expect(lock()).toEqual(LOCKED)

    overlay.value = false
    open.value = true
    await expect.poll(() => get('content')?.dataset.state).toBe('open')
    await expect.poll(() => exiting('content')).toBe(false)
    expect(get('content-overlay')).toBeNull()
    expect(lock()).toEqual(UNLOCKED)
    expect(overflow).toEqual(['hidden', ''])
  })

  it('locks body scroll when an overlay is given to an open drawer', async () => {
    const { overlay } = await mountOpenDrawer({ overlay: false, contentExit: true })
    expect(lock()).toEqual(UNLOCKED)
    const overflow = recordOverflow()

    overlay.value = true
    await expect.poll(() => get('content-overlay')).not.toBeNull()
    expect(lock()).toEqual(LOCKED)

    await userEvent.keyboard('{Escape}')
    await expect.poll(() => exiting('content')).toBe(true)
    expect(get('content-overlay')).toBeNull()
    expect(lock()).toEqual(LOCKED)

    finishExit('content')
    await expect.poll(lock).toEqual(UNLOCKED)
    expect(overflow).toEqual(['', 'hidden', ''])
  })

  it('unlocks body scroll when the overlay is taken away from an open drawer', async () => {
    const { overlay } = await mountOpenDrawer({ contentExit: true })
    expect(lock()).toEqual(LOCKED)

    overlay.value = false
    await expect.poll(() => get('content-overlay')).toBeNull()
    expect(get('content')?.dataset.state).toBe('open')
    expect(lock()).toEqual(UNLOCKED)
  })

  it('unlocks body scroll when the drawer is removed during its exit', async () => {
    const { show } = await mountOpenDrawer({ contentExit: true })
    const overflow = recordOverflow()

    await userEvent.keyboard('{Escape}')
    await expect.poll(() => exiting('content')).toBe(true)
    expect(lock()).toEqual(LOCKED)

    show.value = false
    await expect.poll(() => get('content')).toBeNull()
    expect(lock()).toEqual(UNLOCKED)
    expect(overflow).toEqual(['hidden', ''])
  })

  it('keeps the outer lock when a nested drawer has finished its exit', async () => {
    const outerOpen = ref(true)
    const innerOpen = ref(true)
    mount(defineComponent({
      setup: () => () => drawer('outer', outerOpen, {}, () => drawer('inner', innerOpen, { contentExit: true })),
    }), { attachTo: document.body })
    await expect.poll(() => get('inner')?.contains(document.activeElement)).toBe(true)
    await nextTick()
    const overflow = recordOverflow()

    await userEvent.keyboard('{Escape}')
    await expect.poll(() => exiting('inner')).toBe(true)
    expect(outerOpen.value).toBe(true)
    finishExit('inner')
    await expect.poll(() => get('inner')).toBeNull()
    expect(lock()).toEqual(LOCKED)

    outerOpen.value = false
    await expect.poll(() => get('outer')).toBeNull()
    expect(lock()).toEqual(UNLOCKED)
    expect(overflow).toEqual(['hidden', ''])
  })

  it('unlocks body scroll as it closes when nothing animates out', async () => {
    await mountOpenDrawer()
    expect(lock()).toEqual(LOCKED)
    const overflow = recordOverflow()

    await userEvent.keyboard('{Escape}')
    await expect.poll(() => get('content')).toBeNull()
    expect(get('content-overlay')).toBeNull()
    expect(lock()).toEqual(UNLOCKED)
    expect(overflow).toEqual(['hidden', ''])
  })

  it.each<{ name: string, options: Options }>([
    { name: 'a modal drawer without an overlay', options: { overlay: false, contentExit: true } },
    { name: 'a non-modal drawer', options: { modal: false, contentExit: true } },
  ])('never locks body scroll for $name', async ({ options }) => {
    await mountOpenDrawer(options)
    expect(lock()).toEqual(UNLOCKED)
    const overflow = recordOverflow()

    await userEvent.keyboard('{Escape}')
    await expect.poll(() => exiting('content')).toBe(true)
    expect(lock()).toEqual(UNLOCKED)

    finishExit('content')
    await expect.poll(() => get('content')).toBeNull()
    expect(overflow).toEqual([''])
  })

  it('never locks body scroll while a force-mounted drawer stays closed', async () => {
    const overflow = recordOverflow()
    mount(defineComponent({
      setup: () => () => drawer('content', { value: false }, { contentExit: true, overlayExit: true, forceMountOverlay: true, forceMountContent: true }),
    }), { attachTo: document.body })
    await expect.poll(() => get('content')?.dataset.state).toBe('closed')
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    expect(get('content-overlay')).not.toBeNull()
    expect(lock()).toEqual(UNLOCKED)
    expect(overflow).toEqual([''])
  })
})
