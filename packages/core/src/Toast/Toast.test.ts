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

  it('should have visible toast with role="alert" for screen readers', async () => {
    // Open toast
    await fireEvent.click(trigger.element)

    // Wait for toast to appear in DOM
    await findByText(document.body, 'Scheduled: Catch up')

    // The visible toast element has role="alert" and aria-live="off"
    // This is the interactive element that users see
    const toastElement = document.querySelector('[role="alert"]')
    expect(toastElement).toBeTruthy()
    expect(toastElement?.getAttribute('aria-live')).toBe('off')
    expect(toastElement?.getAttribute('tabindex')).toBe('0')
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(document.body)).toHaveNoViolations()

    // open toast
    wrapper.find('button').element.click()
    await nextTick()
    expect(await axe(document.body)).toHaveNoViolations()
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
