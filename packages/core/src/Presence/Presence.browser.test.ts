import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { Presence } from '.'

// Real Chromium: CSS transitions, keyframe animations and `getAnimations()`
// only exist here (jsdom implements none of them), so the timing of the
// starting/ending styles and of the unmount is proven in this suite.

const styleElements: HTMLStyleElement[] = []
function addStyles(css: string) {
  const style = document.createElement('style')
  style.textContent = css
  document.head.appendChild(style)
  styleElements.push(style)
}

/** Resolves on the next animation frame: anything settled "in the same tick" is done by then. */
const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve))

afterEach(() => {
  styleElements.splice(0).forEach(style => style.remove())
})

function mountPresence(options: { forceMount?: boolean, initialOpen?: boolean } = {}) {
  const open = ref(options.initialOpen ?? false)
  const onComplete = vi.fn()
  const events: string[] = []
  const Fixture = defineComponent({
    setup() {
      return () => h(Presence, {
        present: open.value,
        forceMount: options.forceMount,
        onComplete,
      }, {
        default: ({ present }: { present: boolean }) => h('div', {
          'class': 'box',
          'data-testid': 'box',
          'data-state': open.value ? 'open' : 'closed',
          'data-present': String(present),
          'onEnter': () => events.push('enter'),
          'onAfterEnter': () => events.push('after-enter'),
          'onLeave': () => events.push('leave'),
          'onAfterLeave': () => events.push('after-leave'),
        }, 'Content'),
      })
    },
  })
  mount(Fixture, { attachTo: document.body })
  const box = () => document.querySelector<HTMLElement>('[data-testid="box"]')
  return { open, box, onComplete, events }
}

describe('presence with a CSS transition', () => {
  it('renders data-starting-style on the first frame, transitions from it and reports completion', async () => {
    addStyles(`
      .box { opacity: 1; transition: opacity 150ms linear; }
      .box[data-starting-style], .box[data-ending-style] { opacity: 0; }
    `)
    const { open, box, onComplete } = mountPresence()

    open.value = true
    await nextTick()
    // Present on insertion, so the transition starts from the starting style.
    expect(box()!.hasAttribute('data-starting-style')).toBe(true)

    await vi.waitFor(() => expect(box()!.hasAttribute('data-starting-style')).toBe(false))
    // The enter transition is running from opacity 0.
    const enter = box()!.getAnimations()
    expect(enter.length).toBe(1)
    expect(Number(getComputedStyle(box()!).opacity)).toBeLessThan(1)
    expect(onComplete).not.toHaveBeenCalled()

    await vi.waitFor(() => expect(onComplete).toHaveBeenCalledWith(true))
    expect(enter[0].playState).toBe('finished')
  })

  it('keeps the node mounted with data-ending-style until the exit transition finishes', async () => {
    addStyles(`
      .box { opacity: 1; transition: opacity 150ms linear; }
      .box[data-starting-style], .box[data-ending-style] { opacity: 0; }
    `)
    const { open, box, onComplete, events } = mountPresence({ initialOpen: true })
    await vi.waitFor(() => expect(onComplete).toHaveBeenCalledWith(true))
    onComplete.mockClear()
    events.length = 0

    open.value = false
    await nextTick()
    expect(box()!.hasAttribute('data-ending-style')).toBe(true)
    expect(box()!.getAttribute('data-state')).toBe('closed')

    await nextTick()
    // Still mounted while the exit transition runs.
    const exit = box()!.getAnimations()
    expect(exit.length).toBe(1)
    expect(box()!.getAttribute('data-present')).toBe('true')

    await vi.waitFor(() => expect(box()).toBeNull())
    expect(exit[0].playState).toBe('finished')
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(onComplete).toHaveBeenCalledWith(false)
    expect(events).toEqual(['leave', 'after-leave'])
  })

  it('reverses when reopened mid-exit and does not report the interrupted close', async () => {
    addStyles(`
      .box { opacity: 1; transition: opacity 400ms linear; }
      .box[data-starting-style], .box[data-ending-style] { opacity: 0; }
    `)
    const { open, box, onComplete } = mountPresence({ initialOpen: true })
    await vi.waitFor(() => expect(onComplete).toHaveBeenCalledWith(true))
    onComplete.mockClear()

    open.value = false
    await vi.waitFor(() => expect(box()!.getAnimations().length).toBe(1))
    const element = box()

    open.value = true
    await nextTick()
    // Same node, no starting style (it never unmounted), ending style gone.
    expect(box()).toBe(element)
    expect(box()!.hasAttribute('data-ending-style')).toBe(false)
    expect(box()!.hasAttribute('data-starting-style')).toBe(false)

    await vi.waitFor(() => expect(onComplete).toHaveBeenCalledWith(true))
    expect(onComplete).not.toHaveBeenCalledWith(false)
    expect(box()).toBe(element)
  })

  it('removes the starting style when closed before the first frame', async () => {
    addStyles(`
      .box { opacity: 1; transition: opacity 100ms linear; }
      .box[data-starting-style], .box[data-ending-style] { opacity: 0; }
    `)
    const { open, box, onComplete } = mountPresence()

    open.value = true
    await nextTick()
    expect(box()!.hasAttribute('data-starting-style')).toBe(true)
    open.value = false
    await nextTick()
    expect(box()?.hasAttribute('data-starting-style') ?? false).toBe(false)

    await vi.waitFor(() => expect(box()).toBeNull())
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(onComplete).toHaveBeenCalledWith(false)
  })
})

describe('presence with keyframe animations', () => {
  it('waits for the exit animation before unmounting', async () => {
    addStyles(`
      @keyframes presence-fade-out { from { opacity: 1; } to { opacity: 0; } }
      .box[data-state=closed] { animation: presence-fade-out 150ms linear; }
    `)
    const { open, box, onComplete } = mountPresence({ initialOpen: true })
    await vi.waitFor(() => expect(onComplete).toHaveBeenCalledWith(true))

    open.value = false
    await vi.waitFor(() => expect(box()!.getAnimations().length).toBe(1))
    const [exit] = box()!.getAnimations()
    expect(exit).toBeInstanceOf(CSSAnimation)
    // Rejects if the node is removed (which cancels the animation) before it ends.
    const finished = exit.finished.then(() => true, () => false)

    await vi.waitFor(() => expect(box()).toBeNull())
    expect(await finished).toBe(true)
    expect(onComplete).toHaveBeenLastCalledWith(false)
  })

  it('waits for the enter animation before reporting the open as complete', async () => {
    addStyles(`
      @keyframes presence-fade-in { from { opacity: 0; } to { opacity: 1; } }
      .box[data-state=open] { animation: presence-fade-in 150ms linear; }
    `)
    const { open, box, onComplete } = mountPresence()

    open.value = true
    await vi.waitFor(() => expect(box()!.getAnimations().length).toBe(1))
    const [enter] = box()!.getAnimations()
    expect(onComplete).not.toHaveBeenCalled()

    await vi.waitFor(() => expect(onComplete).toHaveBeenCalledWith(true))
    expect(enter.playState).toBe('finished')
  })

  it('does not wait for an infinite animation', async () => {
    addStyles(`
      @keyframes presence-pulse { from { opacity: 1; } to { opacity: .5; } }
      .box { animation: presence-pulse 100ms infinite alternate; }
    `)
    const { open, box, onComplete } = mountPresence({ initialOpen: true })
    await vi.waitFor(() => expect(onComplete).toHaveBeenCalledWith(true))

    open.value = false
    await nextFrame()
    expect(box()).toBeNull()
    expect(onComplete).toHaveBeenLastCalledWith(false)
  })
})

describe('presence without transitions or animations', () => {
  it('unmounts in the same tick', async () => {
    const { open, box, onComplete } = mountPresence({ initialOpen: true })
    await vi.waitFor(() => expect(onComplete).toHaveBeenCalledWith(true))

    open.value = false
    await nextFrame()
    expect(box()).toBeNull()
    expect(onComplete).toHaveBeenLastCalledWith(false)
  })

  it('unmounts in the same tick when reduced motion disables the transition', async () => {
    addStyles(`
      .box { opacity: 1; transition: opacity 400ms linear; }
      .box[data-ending-style] { opacity: 0; }
      .box.reduced { transition: none; }
    `)
    const { open, box, onComplete } = mountPresence({ initialOpen: true })
    await vi.waitFor(() => expect(onComplete).toHaveBeenCalledWith(true))
    box()!.classList.add('reduced')

    open.value = false
    await nextFrame()
    expect(box()).toBeNull()
  })
})

describe('force-mounted presence', () => {
  it('keeps the node, stamps the lifecycle attributes and reports both directions', async () => {
    addStyles(`
      .box { opacity: 1; transition: opacity 100ms linear; }
      .box[data-starting-style], .box[data-ending-style] { opacity: 0; }
    `)
    const { open, box, onComplete } = mountPresence({ forceMount: true })
    expect(box()!.getAttribute('data-present')).toBe('false')
    expect(box()!.hasAttribute('data-starting-style')).toBe(false)

    open.value = true
    await nextTick()
    expect(box()!.hasAttribute('data-starting-style')).toBe(true)
    await vi.waitFor(() => expect(onComplete).toHaveBeenCalledWith(true))

    open.value = false
    await nextTick()
    expect(box()!.hasAttribute('data-ending-style')).toBe(true)
    await vi.waitFor(() => expect(onComplete).toHaveBeenLastCalledWith(false))
    expect(box()).not.toBeNull()
    expect(box()!.hasAttribute('data-ending-style')).toBe(false)
    expect(box()!.getAttribute('data-present')).toBe('false')
  })
})
