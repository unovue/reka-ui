import type { DOMWrapper, VueWrapper } from '@vue/test-utils'
import { findByText, fireEvent } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, nextTick, ref } from 'vue'
import { ToastAction, ToastDescription, ToastProvider, ToastRoot, ToastTitle, ToastViewport } from '.'
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

describe('ToastProvider pauseOnInteraction', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it.each([
    { pauseOnInteraction: undefined, interaction: 'pointermove', shouldPause: true },
    { pauseOnInteraction: false, interaction: 'pointermove', shouldPause: false },
    { pauseOnInteraction: undefined, interaction: 'focusin', shouldPause: true },
    { pauseOnInteraction: false, interaction: 'focusin', shouldPause: false },
    { pauseOnInteraction: undefined, interaction: 'window blur', shouldPause: true },
    { pauseOnInteraction: false, interaction: 'window blur', shouldPause: false }
  ])('should apply pauseOnInteraction to $interaction', async ({ pauseOnInteraction, interaction, shouldPause }) => {
    vi.useFakeTimers()

    const open = ref(true)
    const providerProps = pauseOnInteraction === undefined ? {} : { pauseOnInteraction }
    const wrapper = mount(defineComponent({
      setup() {
        return () => h(ToastProvider, { duration: 1000, ...providerProps }, () => [
          h(ToastRoot, {
            open: open.value,
            'onUpdate:open': (value: boolean) => {
              open.value = value
            }
          }, () => h(ToastDescription, null, () => 'Timeout toast')),
          h(ToastViewport)
        ])
      }
    }), { attachTo: document.body })

    try {
      await nextTick()

      const viewport = document.querySelector<HTMLElement>('ol')!
      if (interaction === 'pointermove')
        await fireEvent.pointerMove(viewport)
      else if (interaction === 'focusin')
        await fireEvent.focusIn(viewport)
      else
        await fireEvent.blur(window)

      vi.advanceTimersByTime(1000)
      await nextTick()

      expect(open.value).toBe(shouldPause)
    }
    finally {
      wrapper.unmount()
    }
  })

  it.each(['pointermove', 'focusin', 'window blur'])('should pause when enabled during a %s interaction', async (interaction) => {
    vi.useFakeTimers()

    const open = ref(true)
    const pauseOnInteraction = ref(false)
    const wrapper = mount(defineComponent({
      setup() {
        return () => h(ToastProvider, { duration: 1000, pauseOnInteraction: pauseOnInteraction.value }, () => [
          h(ToastRoot, {
            open: open.value,
            'onUpdate:open': (value: boolean) => {
              open.value = value
            }
          }, () => h(ToastDescription, null, () => 'Timeout toast')),
          h(ToastViewport)
        ])
      }
    }), { attachTo: document.body })

    try {
      await nextTick()

      const viewport = document.querySelector<HTMLElement>('ol')!
      if (interaction === 'pointermove')
        await fireEvent.pointerMove(viewport)
      else if (interaction === 'focusin')
        await fireEvent.focusIn(viewport)
      else
        await fireEvent.blur(window)

      vi.advanceTimersByTime(500)
      pauseOnInteraction.value = true
      await nextTick()

      vi.advanceTimersByTime(500)
      await nextTick()

      expect(open.value).toBe(true)
    }
    finally {
      wrapper.unmount()
    }
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
