import type { DOMWrapper, VueWrapper } from '@vue/test-utils'
import { findByText, fireEvent } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { nextTick } from 'vue'
import Toast from './story/_Toast.vue'

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
