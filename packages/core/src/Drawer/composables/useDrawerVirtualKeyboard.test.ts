import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import {
  findKeyboardScrollTarget,
  getKeyboardViewport,
  resolveKeyboardInputTarget,
  useDrawerVirtualKeyboard,
} from './useDrawerVirtualKeyboard'

/**
 * Unit tests for the software-keyboard handling: the `--drawer-keyboard-inset`
 * CSS variable published on the popup, and the scroll alignment that lifts the
 * focused field into the band left visible above the keyboard.
 *
 * jsdom has no visual viewport and no layout, so both are faked: a stub
 * `window.visualViewport` drives the keyboard state, and the elements under
 * test get explicit rects / scroll metrics.
 */

const LAYOUT_HEIGHT = 800

interface VisualViewportStub {
  height: number
  offsetTop: number
  scale: number
  addEventListener: (type: string, listener: () => void) => void
  removeEventListener: (type: string, listener: () => void) => void
  emit: (type: string) => void
}

function createVisualViewport(): VisualViewportStub {
  const listeners = new Map<string, Set<() => void>>()
  return {
    height: LAYOUT_HEIGHT,
    offsetTop: 0,
    scale: 1,
    addEventListener(type, listener) {
      if (!listeners.has(type))
        listeners.set(type, new Set())
      listeners.get(type)!.add(listener)
    },
    removeEventListener(type, listener) {
      listeners.get(type)?.delete(listener)
    },
    emit(type) {
      listeners.get(type)?.forEach(listener => listener())
    },
  }
}

let visualViewport: VisualViewportStub

/** Shrinks the visual viewport as the software keyboard would. */
function openKeyboard(height = 300) {
  visualViewport.height = LAYOUT_HEIGHT - height
  visualViewport.emit('resize')
}

function closeKeyboard() {
  visualViewport.height = LAYOUT_HEIGHT
  visualViewport.emit('resize')
}

function stubRect(element: HTMLElement, rect: { top: number, bottom: number }) {
  element.getBoundingClientRect = () => ({
    top: rect.top,
    bottom: rect.bottom,
    left: 0,
    right: 0,
    width: 0,
    height: rect.bottom - rect.top,
    x: 0,
    y: rect.top,
    toJSON: () => ({}),
  }) as DOMRect
}

function stubScrollMetrics(element: HTMLElement, scrollHeight: number, clientHeight: number) {
  Object.defineProperty(element, 'scrollHeight', { configurable: true, get: () => scrollHeight })
  Object.defineProperty(element, 'clientHeight', { configurable: true, get: () => clientHeight })
}

beforeEach(() => {
  vi.useFakeTimers()
  visualViewport = createVisualViewport()
  Object.defineProperty(window, 'visualViewport', {
    configurable: true,
    writable: true,
    value: visualViewport,
  })
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    writable: true,
    value: LAYOUT_HEIGHT,
  })
})

afterEach(() => {
  vi.useRealTimers()
  // @ts-expect-error - restoring the jsdom default (no visual viewport)
  delete window.visualViewport
})

/** Runs the rAF-scheduled alignment, including its settle passes. */
function flushAlignment() {
  vi.advanceTimersByTime(100)
}

function dispatchTouch(element: HTMLElement, type: string, x: number, y: number) {
  const event = new Event(type, { bubbles: true, cancelable: true })
  const touch = { clientX: x, clientY: y }
  Object.defineProperty(event, 'touches', { value: type === 'touchend' ? [] : [touch] })
  Object.defineProperty(event, 'changedTouches', { value: [touch] })
  element.dispatchEvent(event)
  return event
}

/** Taps `element`: touchstart then touchend at the same point. */
function tap(element: HTMLElement, x = 0, y = 0) {
  dispatchTouch(element, 'touchstart', x, y)
  return dispatchTouch(element, 'touchend', x, y)
}

interface HarnessOptions {
  /** Rect of the scroller, in client coordinates. */
  scrollerRect?: { top: number, bottom: number }
  /** Rect of the input, in client coordinates. */
  inputRect?: { top: number, bottom: number }
  scrollHeight?: number
  clientHeight?: number
  /** Rendered without `overflow-y` when false, so no scroller is found. */
  scrollable?: boolean
}

function mountHarness(options: HarnessOptions = {}) {
  const {
    scrollerRect = { top: 200, bottom: 800 },
    inputRect = { top: 700, bottom: 740 },
    scrollHeight = 1200,
    clientHeight = 600,
    scrollable = true,
  } = options

  const enabled = ref(true)
  const modal = ref(true)
  const nestedDrawerOpen = ref(false)
  const popupRef = ref<HTMLElement | null>(null)

  const Harness = defineComponent({
    setup() {
      useDrawerVirtualKeyboard({ enabled, elementRef: popupRef, modal, nestedDrawerOpen })
      return () =>
        h('div', { ref: (el: any) => (popupRef.value = el as HTMLElement) }, [
          h('div', { class: 'scroller', style: scrollable ? 'overflow-y: auto' : '' }, [
            h('input', { type: 'text', class: 'field' }),
          ]),
        ])
    },
  })

  const wrapper = mount(Harness, { attachTo: document.body })
  const popup = popupRef.value!
  const scroller = wrapper.element.querySelector('.scroller') as HTMLElement
  const input = wrapper.element.querySelector('.field') as HTMLInputElement

  stubRect(scroller, scrollerRect)
  stubRect(input, inputRect)
  stubScrollMetrics(scroller, scrollHeight, clientHeight)
  scroller.scrollTo = vi.fn() as any

  return { wrapper, enabled, modal, nestedDrawerOpen, popup, scroller, input }
}

describe('getKeyboardViewport', () => {
  it('returns null while the keyboard is closed', () => {
    expect(getKeyboardViewport(window)).toBeNull()
  })

  it('ignores viewport changes small enough to be browser chrome', () => {
    visualViewport.height = LAYOUT_HEIGHT - 40
    expect(getKeyboardViewport(window)).toBeNull()
  })

  it('returns the visible band once the keyboard is up', () => {
    visualViewport.height = LAYOUT_HEIGHT - 300
    expect(getKeyboardViewport(window)).toEqual({ top: 0, bottom: 500 })
  })

  it('accounts for a panned visual viewport', () => {
    visualViewport.height = LAYOUT_HEIGHT - 300
    visualViewport.offsetTop = 80
    expect(getKeyboardViewport(window)).toEqual({ top: 80, bottom: 580 })
  })

  it('bails out while pinch-zoomed, where the measurement is meaningless', () => {
    visualViewport.height = LAYOUT_HEIGHT - 300
    visualViewport.scale = 2
    expect(getKeyboardViewport(window)).toBeNull()
  })

  it('returns null without a visual viewport', () => {
    // @ts-expect-error - browsers without `visualViewport` support
    delete window.visualViewport
    expect(getKeyboardViewport(window)).toBeNull()
  })
})

describe('resolveKeyboardInputTarget', () => {
  it('resolves a text input to itself', () => {
    const input = document.createElement('input')
    input.type = 'text'
    expect(resolveKeyboardInputTarget(input)).toBe(input)
  })

  it('resolves a textarea to itself', () => {
    const textarea = document.createElement('textarea')
    expect(resolveKeyboardInputTarget(textarea)).toBe(textarea)
  })

  it('resolves a label to the control it points at', () => {
    document.body.innerHTML = '<label for="name">Name</label><input id="name" type="text">'
    const label = document.querySelector('label')!
    const input = document.querySelector('input')!
    expect(resolveKeyboardInputTarget(label)).toBe(input)
  })

  it('resolves a node inside a contenteditable to its editing host', () => {
    document.body.innerHTML = '<div contenteditable="true"><span>text</span></div>'
    const host = document.querySelector('[contenteditable]') as HTMLElement
    const span = document.querySelector('span')!
    // jsdom does not implement `isContentEditable`.
    for (const el of [host, span])
      Object.defineProperty(el, 'isContentEditable', { configurable: true, get: () => true })
    expect(resolveKeyboardInputTarget(span)).toBe(host)
  })

  it('ignores inputs that never open a keyboard', () => {
    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    expect(resolveKeyboardInputTarget(checkbox)).toBeNull()
    expect(resolveKeyboardInputTarget(document.createElement('button'))).toBeNull()
  })

  it('ignores a disabled field, which can neither focus nor open the keyboard', () => {
    const input = document.createElement('input')
    input.type = 'text'
    input.disabled = true
    expect(resolveKeyboardInputTarget(input)).toBeNull()
  })
})

describe('findKeyboardScrollTarget', () => {
  it('skips the field itself and returns the scrollable ancestor', () => {
    document.body.innerHTML = '<div class="root"><div class="scroller" style="overflow-y: auto"><textarea></textarea></div></div>'
    const root = document.querySelector('.root') as HTMLElement
    const scroller = document.querySelector('.scroller') as HTMLElement
    const textarea = document.querySelector('textarea')!
    stubScrollMetrics(scroller, 1000, 400)
    stubScrollMetrics(textarea, 1000, 100)
    expect(findKeyboardScrollTarget(textarea, root)).toBe(scroller)
  })

  it('falls back to a container that only overflows once slack is added', () => {
    document.body.innerHTML = '<div class="root"><div class="scroller" style="overflow-y: auto"><input></div></div>'
    const root = document.querySelector('.root') as HTMLElement
    const scroller = document.querySelector('.scroller') as HTMLElement
    const input = document.querySelector('input')!
    stubScrollMetrics(scroller, 400, 400)
    expect(findKeyboardScrollTarget(input, root)).toBe(scroller)
  })

  it('returns null when nothing inside the drawer scrolls', () => {
    document.body.innerHTML = '<div class="root"><div><input></div></div>'
    const root = document.querySelector('.root') as HTMLElement
    const input = document.querySelector('input')!
    expect(findKeyboardScrollTarget(input, root)).toBeNull()
  })
})

describe('useDrawerVirtualKeyboard', () => {
  it('publishes the keyboard inset on the popup while a field is focused', async () => {
    const { wrapper, popup, input } = mountHarness()

    input.focus()
    await nextTick()
    openKeyboard(300)
    flushAlignment()

    expect(popup.style.getPropertyValue('--drawer-keyboard-inset')).toBe('300px')
    wrapper.unmount()
  })

  it('does not react to focus on a non-keyboard element', async () => {
    const { wrapper, popup, scroller } = mountHarness()
    const button = document.createElement('button')
    scroller.appendChild(button)

    button.focus()
    await nextTick()
    openKeyboard(300)
    flushAlignment()

    expect(popup.style.getPropertyValue('--drawer-keyboard-inset')).toBe('0px')
    wrapper.unmount()
  })

  it('ignores a field focused outside the drawer', async () => {
    const { wrapper, popup } = mountHarness()
    const outside = document.createElement('input')
    outside.type = 'text'
    document.body.appendChild(outside)

    outside.focus()
    await nextTick()
    openKeyboard(300)
    flushAlignment()

    expect(popup.style.getPropertyValue('--drawer-keyboard-inset')).toBe('0px')
    outside.remove()
    wrapper.unmount()
  })

  it('drops the inset back to zero when the keyboard closes', async () => {
    const { wrapper, popup, input } = mountHarness()

    input.focus()
    await nextTick()
    openKeyboard(300)
    flushAlignment()
    expect(popup.style.getPropertyValue('--drawer-keyboard-inset')).toBe('300px')

    closeKeyboard()
    flushAlignment()
    expect(popup.style.getPropertyValue('--drawer-keyboard-inset')).toBe('0px')
    wrapper.unmount()
  })

  it('drops the inset when focus leaves the field', async () => {
    const { wrapper, popup, input } = mountHarness()

    input.focus()
    await nextTick()
    openKeyboard(300)
    flushAlignment()

    input.blur()
    await nextTick()
    flushAlignment()

    expect(popup.style.getPropertyValue('--drawer-keyboard-inset')).toBe('0px')
    wrapper.unmount()
  })

  it('scrolls the focused field into the band above the keyboard', async () => {
    // The band is the overlap of the scroller (200-800) and the visible
    // viewport (0-500), inset by the 16px margins → 216-484, centered on 350.
    // The input sits at 700-740 (center 720), so the scroller has to advance by
    // 720 - 350 = 370px.
    const { wrapper, input, scroller } = mountHarness()

    input.focus()
    await nextTick()
    openKeyboard(300)
    flushAlignment()

    expect(scroller.scrollTo).toHaveBeenCalledWith({ top: 370, behavior: 'smooth' })
    wrapper.unmount()
  })

  it('clamps the scroll to the scrollable range', async () => {
    // Same geometry, but the scroller can only travel 100px.
    const { wrapper, input, scroller } = mountHarness({ scrollHeight: 700, clientHeight: 600 })

    input.focus()
    await nextTick()
    openKeyboard(300)
    flushAlignment()

    expect(scroller.scrollTo).toHaveBeenCalledWith({ top: 100, behavior: 'smooth' })
    wrapper.unmount()
  })

  it('adds scroll slack under a scroller the keyboard overlaps, and restores it', async () => {
    // Scroller bottom (800) is 300px below the visible band (500).
    const { wrapper, input, scroller } = mountHarness()

    input.focus()
    await nextTick()
    openKeyboard(300)
    flushAlignment()

    expect(scroller.style.paddingBottom).toBe('348px')
    expect(scroller.style.scrollPaddingBottom).toBe('16px')
    expect(scroller.style.overflowAnchor).toBe('none')

    closeKeyboard()
    flushAlignment()

    expect(scroller.style.paddingBottom).toBe('')
    expect(scroller.style.scrollPaddingBottom).toBe('')
    expect(scroller.style.overflowAnchor).toBe('')
    wrapper.unmount()
  })

  it('leaves a scroller the keyboard does not reach untouched', async () => {
    const { wrapper, input, scroller } = mountHarness({
      scrollerRect: { top: 0, bottom: 400 },
      inputRect: { top: 300, bottom: 340 },
    })

    input.focus()
    await nextTick()
    openKeyboard(300)
    flushAlignment()

    expect(scroller.style.paddingBottom).toBe('')
    wrapper.unmount()
  })

  it('still publishes the inset when the drawer has nothing to scroll', async () => {
    const { wrapper, popup, input, scroller } = mountHarness({ scrollable: false })

    input.focus()
    await nextTick()
    openKeyboard(300)
    flushAlignment()

    expect(popup.style.getPropertyValue('--drawer-keyboard-inset')).toBe('300px')
    expect(scroller.scrollTo).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('stops listening and clears the variable once the drawer closes', async () => {
    const { wrapper, enabled, popup, input, scroller } = mountHarness()

    input.focus()
    await nextTick()
    openKeyboard(300)
    flushAlignment()
    expect(popup.style.getPropertyValue('--drawer-keyboard-inset')).toBe('300px')

    enabled.value = false
    await nextTick()

    expect(popup.style.getPropertyValue('--drawer-keyboard-inset')).toBe('')
    expect(scroller.style.paddingBottom).toBe('')

    vi.mocked(scroller.scrollTo).mockClear()
    openKeyboard(300)
    flushAlignment()
    expect(scroller.scrollTo).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('does not re-issue a scroll that already landed on target', async () => {
    const { wrapper, input, scroller } = mountHarness()

    input.focus()
    await nextTick()
    openKeyboard(300)
    flushAlignment()
    expect(scroller.scrollTo).toHaveBeenCalledTimes(1)

    // The scroller reached the destination; a realign pass must not restart the
    // smooth scroll, which would visibly stutter.
    Object.defineProperty(scroller, 'scrollTop', { configurable: true, writable: true, value: 370 })
    stubRect(input, { top: 330, bottom: 370 })
    visualViewport.emit('scroll')
    flushAlignment()

    expect(scroller.scrollTo).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('realigns after focus moves between fields with the keyboard already up', async () => {
    const { wrapper, input, scroller } = mountHarness()
    const second = document.createElement('input')
    second.type = 'text'
    stubRect(second, { top: 760, bottom: 800 })
    scroller.appendChild(second)

    input.focus()
    await nextTick()
    openKeyboard(300)
    flushAlignment()
    vi.mocked(scroller.scrollTo).mockClear()

    second.focus()
    await nextTick()
    flushAlignment()
    expect(scroller.scrollTo).toHaveBeenCalledWith({ top: 430, behavior: 'smooth' })

    // Follow-up passes re-measure geometry that is still settling.
    vi.mocked(scroller.scrollTo).mockClear()
    stubRect(second, { top: 700, bottom: 740 })
    vi.advanceTimersByTime(200)
    expect(scroller.scrollTo).toHaveBeenCalledWith({ top: 370, behavior: 'smooth' })
    wrapper.unmount()
  })
  it('suspends while a nested drawer owns the interaction', async () => {
    const { wrapper, popup, input, nestedDrawerOpen } = mountHarness()
    nestedDrawerOpen.value = true

    input.focus()
    await nextTick()
    openKeyboard(300)
    flushAlignment()

    expect(popup.style.getPropertyValue('--drawer-keyboard-inset')).toBe('')
    wrapper.unmount()
  })

  it('pins the page a modal drawer scroll lock could not hold', async () => {
    const { wrapper, input } = mountHarness()
    const scrollTo = vi.fn()
    window.scrollTo = scrollTo as any

    input.focus()
    await nextTick()
    // WebKit reveals the focused field by scrolling the locked page.
    Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 120 })
    openKeyboard(300)
    flushAlignment()

    expect(scrollTo).toHaveBeenCalledWith({ left: 0, top: 0, behavior: 'instant' })
    wrapper.unmount()
  })

  it('leaves the page alone when the drawer is not modal', async () => {
    const { wrapper, input, modal } = mountHarness()
    const scrollTo = vi.fn()
    window.scrollTo = scrollTo as any
    modal.value = false

    input.focus()
    await nextTick()
    Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 120 })
    openKeyboard(300)
    flushAlignment()

    expect(scrollTo).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('waits for the scroll destination to settle before committing', async () => {
    const { wrapper, input, scroller } = mountHarness()

    input.focus()
    await nextTick()
    openKeyboard(300)

    // Layout still reacting to the focus: the destination moves every frame.
    let top = 700
    input.getBoundingClientRect = () => {
      top -= 40
      return { top, bottom: top + 40, left: 0, right: 0, width: 0, height: 40, x: 0, y: top, toJSON: () => ({}) } as DOMRect
    }
    vi.advanceTimersByTime(100)
    expect(scroller.scrollTo).not.toHaveBeenCalled()

    stubRect(input, { top: 700, bottom: 740 })
    vi.advanceTimersByTime(100)
    expect(scroller.scrollTo).toHaveBeenCalledWith({ top: 370, behavior: 'smooth' })
    wrapper.unmount()
  })
})

describe('useDrawerVirtualKeyboard tap handling', () => {
  it('focuses a tapped field itself so iOS cannot scroll the page to it', async () => {
    const { wrapper, input } = mountHarness()
    document.elementFromPoint = vi.fn(() => input) as any
    const onClick = vi.fn()
    input.addEventListener('click', onClick)

    const event = tap(input, 40, 720)
    await nextTick()

    expect(event.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(input)
    // The prevented touchend suppresses the compatibility click, so it is redispatched.
    expect(onClick).toHaveBeenCalledTimes(1)
    // The geometry override is restored before paint.
    expect(input.style.opacity).toBe('')
    expect(input.style.transform).toBe('')
    wrapper.unmount()
  })

  it('falls back to the touch target when the point resolves to nothing', async () => {
    const { wrapper, input } = mountHarness()
    document.elementFromPoint = vi.fn(() => null) as any

    const event = tap(input, 40, 720)
    await nextTick()

    expect(event.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(input)
    wrapper.unmount()
  })

  it('does not steal a tap that lands on another interactive element', async () => {
    const { wrapper, input, scroller } = mountHarness()
    const button = document.createElement('button')
    scroller.appendChild(button)
    document.elementFromPoint = vi.fn(() => button) as any

    const event = tap(input, 40, 720)
    await nextTick()

    expect(event.defaultPrevented).toBe(false)
    expect(document.activeElement).not.toBe(input)
    wrapper.unmount()
  })

  it('treats a moved finger as a scroll, not a tap', async () => {
    const { wrapper, input } = mountHarness()
    document.elementFromPoint = vi.fn(() => input) as any

    dispatchTouch(input, 'touchstart', 40, 720)
    dispatchTouch(input, 'touchmove', 40, 690)
    const event = dispatchTouch(input, 'touchend', 40, 690)
    await nextTick()

    expect(event.defaultPrevented).toBe(false)
    expect(document.activeElement).not.toBe(input)
    wrapper.unmount()
  })

  it('lets the native tap through while pinch-zoomed', async () => {
    const { wrapper, input } = mountHarness()
    document.elementFromPoint = vi.fn(() => input) as any
    visualViewport.scale = 2

    const event = tap(input, 40, 720)
    await nextTick()

    expect(event.defaultPrevented).toBe(false)
    wrapper.unmount()
  })

  it('lets the native tap through on the already focused field, so the caret moves', async () => {
    const { wrapper, input } = mountHarness()
    document.elementFromPoint = vi.fn(() => input) as any

    input.focus()
    await nextTick()
    openKeyboard(300)
    flushAlignment()

    const event = tap(input, 40, 720)
    expect(event.defaultPrevented).toBe(false)
    wrapper.unmount()
  })
})
