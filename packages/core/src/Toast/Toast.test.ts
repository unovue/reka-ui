import type { DOMWrapper, VueWrapper } from '@vue/test-utils'
import { findByText, fireEvent } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { nextTick } from 'vue'
import Toast from './story/_Toast.vue'
import { VIEWPORT_PAUSE, VIEWPORT_RESUME } from './utils'

const CLOSE_TEXT = 'Close'

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

    // Shift+Tab on the viewport hands focus to the head proxy, which bounces it
    // onto the first toast. The viewport only reaches the proxy through its
    // template ref, so this covers the ref resolving to the proxy element
    // itself rather than to some other node.
    const viewport = document.querySelector<HTMLElement>('ol[tabindex="-1"]')
    expect(viewport).toBeTruthy()
    await fireEvent.keyDown(viewport!, { key: 'Tab', shiftKey: true })

    expect(document.activeElement?.closest('li')).toBeTruthy()
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
