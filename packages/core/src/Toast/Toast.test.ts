import type { DOMWrapper, VueWrapper } from '@vue/test-utils'
import { findByText, fireEvent } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, nextTick, ref } from 'vue'
import { ToastAction, ToastClose, ToastDescription, ToastProvider, ToastRoot, ToastTitle, ToastViewport } from '.'
import Toast from './story/_Toast.vue'
import { VIEWPORT_PAUSE, VIEWPORT_RESUME } from './utils'

const CLOSE_TEXT = 'Close'

const ToastWithAction = defineComponent({
  props: {
    closeOnClick: {
      type: Boolean,
      default: undefined,
    },
  },
  setup() {
    const open = ref(true)
    const actionClicks = ref(0)

    return {
      open,
      actionClicks,
    }
  },
  render() {
    return h(ToastProvider, null, {
      default: () => [
        h(ToastRoot, {
          'open': this.open,
          'onUpdate:open': (value: boolean) => {
            this.open = value
          },
        }, {
          default: () => [
            h(ToastDescription, null, { default: () => 'Action available' }),
            h(ToastAction, {
              altText: 'Perform action',
              closeOnClick: this.closeOnClick,
              onClick: () => {
                this.actionClicks += 1
              },
            }, { default: () => 'Undo' }),
          ],
        }),
        h(ToastViewport),
      ],
    })
  },
})

describe('given a default Toast', () => {
  let wrapper: VueWrapper<InstanceType<typeof Toast>>
  let trigger: DOMWrapper<HTMLElement>
  let closeButton: HTMLElement

  beforeEach(() => {
    document.body.innerHTML = ''
    wrapper = mount(Toast, { attachTo: document.body })
    trigger = wrapper.find('button')
  })

  it('should have visible toast that is focusable', async () => {
    // Open toast
    await fireEvent.click(trigger.element)

    // Wait for toast to appear in DOM
    const toastText = await findByText(document.body, 'Scheduled: Catch up')

    // The visible toast element should be focusable
    const toastElement = toastText.closest('li')
    expect(toastElement).toBeTruthy()
    expect(toastElement?.getAttribute('tabindex')).toBe('0')
  })

  it('should have focus proxies that are focusable but not aria-hidden', async () => {
    await fireEvent.click(trigger.element)
    await findByText(document.body, 'Scheduled: Catch up')

    // The viewport renders head/tail focus proxies: tabbable sentinels
    // (tabindex="0") that catch focus entering or leaving the viewport and
    // redirect it onto a toast. A tabbable element must not be aria-hidden,
    // otherwise axe reports an `aria-hidden-focus` violation.
    const proxies = Array.from(
      document.querySelectorAll<HTMLElement>('[tabindex="0"]'),
    ).filter(el => el.style.position === 'fixed')

    expect(proxies).toHaveLength(2)
    for (const proxy of proxies)
      expect(proxy.getAttribute('aria-hidden')).toBeNull()
  })

  it('should proxy focus out of the viewport on shift+Tab', async () => {
    await fireEvent.click(trigger.element)
    await findByText(document.body, 'Scheduled: Catch up')

    // Shift+Tab on the focused viewport hands focus to the head proxy (through
    // its template ref) so the browser can move it on to the preceding
    // document. Focus arrives from inside the viewport, so the proxy must not
    // bounce it back onto a toast.
    const viewport = document.querySelector<HTMLElement>('ol[tabindex="-1"]')
    expect(viewport).toBeTruthy()
    const headProxy = viewport!.previousElementSibling
    viewport!.focus()
    await fireEvent.keyDown(viewport!, { key: 'Tab', shiftKey: true })

    expect(document.activeElement).toBe(headProxy)
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(document.body)).toHaveNoViolations()

    // open toast
    wrapper.find('button').element.click()
    await nextTick()
    expect(await axe(document.body)).toHaveNoViolations()
  })

  it('should announce title and description as plain text (not JSON)', async () => {
    await fireEvent.click(trigger.element)
    await findByText(document.body, 'Scheduled: Catch up')

    // ToastAnnounce renders the live region on the next animation frame
    // (see ToastAnnounce.vue's useRafFn) — wait for two RAFs so it's
    // guaranteed to be in the DOM.
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    })

    const liveRegion = document.querySelector('[role="alert"][aria-live]')
    expect(liveRegion).toBeTruthy()
    const text = liveRegion!.textContent ?? ''

    // Vue's `{{ array }}` would JSON-stringify the announceTextContent
    // array — guard against that regression by asserting the live region
    // does not contain JSON syntax characters.
    expect(text).not.toMatch(/[[\]"]/)

    // The toast title and description must both be part of the announced
    // text so screen-reader users actually hear the toast.
    expect(text).toContain('Scheduled: Catch up')
  })

  it('should expose the live region to assistive technology (not aria-hidden)', async () => {
    await fireEvent.click(trigger.element)
    await findByText(document.body, 'Scheduled: Catch up')

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    })

    const liveRegion = document.querySelector('[role="alert"][aria-live]')
    expect(liveRegion).toBeTruthy()

    // A live region inside an aria-hidden subtree is ignored by screen readers,
    // so the toast would never be announced.
    expect(liveRegion!.closest('[aria-hidden="true"]')).toBeNull()
  })

  it('should remove viewport event listeners when the toast is dismissed', async () => {
    await fireEvent.click(trigger.element)
    await findByText(document.body, 'Scheduled: Catch up')

    // The toast registers pause/resume listeners on the shared viewport while
    // it is mounted; dismissing it must tear them down so the detached toast
    // (and its listeners) can be garbage collected.
    const viewport = document.querySelector('ol')!
    const removeEventListener = vi.spyOn(viewport, 'removeEventListener')

    const closeButton = await findByText(document.body, CLOSE_TEXT)
    await fireEvent.click(closeButton)
    await nextTick()

    expect(removeEventListener).toHaveBeenCalledWith(VIEWPORT_PAUSE, expect.any(Function))
    expect(removeEventListener).toHaveBeenCalledWith(VIEWPORT_RESUME, expect.any(Function))
  })

  describe('after clicking the trigger', () => {
    beforeEach(async () => {
      fireEvent.click(trigger.element)
      closeButton = await findByText(document.body, CLOSE_TEXT)
    })

    it('should open the content', () => {
      expect(document.body.innerHTML).toContain(closeButton.innerHTML)
    })

    describe('when clicking close button', () => {
      beforeEach(async () => {
        await fireEvent.click(closeButton)
      })

      it('should close the content', () => {
        expect(document.body.innerHTML).not.toContain(closeButton.innerHTML)
      })
    })

    describe('when pressing escape', () => {
      beforeEach(() => {
        fireEvent.keyDown(document.activeElement!, { key: 'Escape' })
      })

      it('should close the content', () => {
        expect(document.body.innerHTML).not.toContain(closeButton.innerHTML)
      })
    })
  })
})

const PausableToasts = defineComponent({
  setup() {
    const open = ref({ first: true, second: true })
    const preventSecondEscape = ref(false)
    return { open, preventSecondEscape }
  },
  render() {
    const toast = (name: 'first' | 'second') => h(ToastRoot, {
      'key': name,
      'open': this.open[name],
      'onUpdate:open': (value: boolean) => {
        this.open[name] = value
      },
      'onEscapeKeyDown': (event: KeyboardEvent) => {
        if (name === 'second' && this.preventSecondEscape)
          event.preventDefault()
      },
    }, {
      default: () => [
        h(ToastDescription, null, { default: () => name }),
        h(ToastClose, { 'data-close': name }, { default: () => CLOSE_TEXT }),
      ],
    })
    return h(ToastProvider, { duration: 1000 }, {
      default: () => [toast('first'), toast('second'), h(ToastViewport)],
    })
  },
})

describe('given toasts whose close timers are paused', () => {
  let wrapper: VueWrapper<InstanceType<typeof PausableToasts>>
  let viewport: HTMLElement

  async function flush() {
    for (let i = 0; i < 5; i++)
      await nextTick()
  }

  async function waitForUnmount(selector = 'li') {
    for (let i = 0; i < 10 && document.querySelector(selector); i++)
      await nextTick()
    expect(document.querySelector(selector)).toBeNull()
  }

  async function reopenFirst() {
    wrapper.vm.open.first = true
    await flush()
  }

  async function runDuration() {
    vi.advanceTimersByTime(1000)
    await flush()
  }

  // A keyboard-activated click is a PointerEvent with an empty pointerType.
  function keyboardClick(element: Element) {
    const event = new MouseEvent('click', { bubbles: true })
    Object.defineProperty(event, 'pointerType', { value: '' })
    element.dispatchEvent(event)
  }

  beforeEach(async () => {
    vi.useFakeTimers()
    document.body.innerHTML = ''
    wrapper = mount(PausableToasts, { attachTo: document.body })
    await flush()
    viewport = document.querySelector('ol')!
  })

  afterEach(() => {
    wrapper.unmount()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('when the last toast closes while hovered', () => {
    beforeEach(async () => {
      await fireEvent.pointerMove(viewport)
    })

    it('should not leave the next toast paused after Escape', async () => {
      await fireEvent.keyDown(document.body, { key: 'Escape' })
      await waitForUnmount()
      await reopenFirst()
      await runDuration()
      expect(wrapper.vm.open.first).toBe(false)
    })

    it('should not leave the next toast paused after a mouse click on close', async () => {
      wrapper.vm.open.second = false
      await fireEvent.click(document.querySelector('[data-close="first"]')!)
      await waitForUnmount()
      await reopenFirst()
      await runDuration()
      expect(wrapper.vm.open.first).toBe(false)
    })

    it('should not leave the next toast paused after closing from code', async () => {
      wrapper.vm.open = { first: false, second: false }
      await waitForUnmount()
      await reopenFirst()
      await runDuration()
      expect(wrapper.vm.open.first).toBe(false)
    })
  })

  describe('when the last toast closes while the window is blurred', () => {
    beforeEach(async () => {
      vi.spyOn(document, 'hasFocus').mockReturnValue(false)
      window.dispatchEvent(new Event('blur'))
      wrapper.vm.open = { first: false, second: false }
      await waitForUnmount()
    })

    function focusWindow() {
      vi.mocked(document.hasFocus).mockReturnValue(true)
      window.dispatchEvent(new Event('focus'))
    }

    it('should keep a toast opened while blurred paused until the window gets focus', async () => {
      await reopenFirst()
      await runDuration()
      expect(wrapper.vm.open.first).toBe(true)

      focusWindow()
      await runDuration()
      expect(wrapper.vm.open.first).toBe(false)
    })

    it('should not leave the next toast paused when the window gets focus with no toasts open', async () => {
      focusWindow()
      await reopenFirst()
      await runDuration()
      expect(wrapper.vm.open.first).toBe(false)
    })
  })

  describe('when one of two focused toasts is closed from the keyboard', () => {
    it('should keep the other paused until focus leaves the viewport', async () => {
      const closeFirst = document.querySelector<HTMLElement>('[data-close="first"]')!
      closeFirst.focus()
      await fireEvent.focusIn(closeFirst)
      keyboardClick(closeFirst)
      await waitForUnmount('[data-close="first"]')

      await runDuration()
      expect(wrapper.vm.open.second).toBe(true)

      const outside = document.createElement('button')
      document.body.append(outside)
      await fireEvent.focusOut(viewport, { relatedTarget: outside })
      await runDuration()
      expect(wrapper.vm.open.second).toBe(false)
    })
  })

  describe('when Escape closes only one of two hovered toasts', () => {
    it('should keep the other paused until the pointer leaves', async () => {
      wrapper.vm.preventSecondEscape = true
      await fireEvent.pointerMove(viewport)
      await fireEvent.keyDown(document.body, { key: 'Escape' })
      await flush()
      expect(wrapper.vm.open).toEqual({ first: false, second: true })

      await runDuration()
      expect(wrapper.vm.open.second).toBe(true)

      await fireEvent.pointerLeave(viewport)
      await runDuration()
      expect(wrapper.vm.open.second).toBe(false)
    })
  })
})

describe('given a Toast with an action', () => {
  let wrapper: VueWrapper<InstanceType<typeof ToastWithAction>>

  afterEach(() => {
    wrapper.unmount()
  })

  it('should close the toast when action is clicked by default', async () => {
    wrapper = mount(ToastWithAction, { attachTo: document.body })

    const action = await findByText(document.body, 'Undo')
    await fireEvent.click(action)

    expect(wrapper.vm.actionClicks).toBe(1)
    expect(wrapper.vm.open).toBe(false)
    expect(action.closest('li')?.getAttribute('data-state')).toBe('closed')
  })

  it('should keep the toast open when action closeOnClick is false', async () => {
    wrapper = mount(ToastWithAction, {
      attachTo: document.body,
      props: { closeOnClick: false },
    })

    const action = await findByText(document.body, 'Undo')
    await fireEvent.click(action)

    expect(wrapper.vm.actionClicks).toBe(1)
    expect(wrapper.vm.open).toBe(true)
    expect(document.body.innerHTML).toContain('Action available')
  })

  it('should move focus to the viewport when the action is activated by keyboard', async () => {
    wrapper = mount(ToastWithAction, { attachTo: document.body })

    const action = await findByText(document.body, 'Undo')
    const viewport = action.closest('ol')
    action.focus()
    // A click from Enter / Space has an empty `pointerType`. jsdom does not support PointerEvent.
    const event = new MouseEvent('click', { bubbles: true, cancelable: true })
    Object.defineProperty(event, 'pointerType', { value: '' })
    action.dispatchEvent(event)
    await nextTick()

    expect(wrapper.vm.open).toBe(false)
    expect(viewport).toHaveFocus()
  })
})

describe('given a ToastTitle and ToastDescription outside a managed toast', () => {
  // Vue only falls attrs through a fragment root in development, so a root that
  // is not a single element loses `class` / `id` in a production build.
  it.each([
    ['ToastTitle', ToastTitle],
    ['ToastDescription', ToastDescription],
  ])('%s should render a single root element', (_, component) => {
    const wrapper = mount(component, {
      attrs: { class: 'custom', id: 'custom-id' },
      slots: { default: 'Content' },
    })

    expect(wrapper.vm.$.subTree.el).toBeInstanceOf(HTMLElement)
    expect(wrapper.element.outerHTML).toBe('<div class="custom" id="custom-id">Content</div>')
    wrapper.unmount()
  })
})
