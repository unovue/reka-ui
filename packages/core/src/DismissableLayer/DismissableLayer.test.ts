import type { DOMWrapper, VueWrapper } from '@vue/test-utils'
import { fireEvent } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { sleep } from '@/test'
import DismissableLayer from './story/_DismissableLayer.vue'
import ShadowRootContainer from './story/shadowRoot/ShadowRootContainer.vue'

const OPEN_LABEL = 'Open'
const CLOSE_LABEL = 'Close'
const OUTSIDE_LABEL = 'Outside'

describe('given a default DismissableLayer', () => {
  let wrapper: VueWrapper<InstanceType<typeof DismissableLayer>>
  let trigger: DOMWrapper<HTMLElement>

  beforeEach(() => {
    document.body.innerHTML = ''
    wrapper = mount(DismissableLayer, { attachTo: document.body, props: { openLabel: OPEN_LABEL, closeLabel: CLOSE_LABEL, outsideLabel: OUTSIDE_LABEL } })
    trigger = wrapper.find('button')
  })

  it('should render button without content', async () => {
    expect(document.body.innerHTML).not.toContain(CLOSE_LABEL)
  })

  describe('after clicking a trigger', () => {
    beforeEach(async () => {
      await fireEvent.click(trigger.element)
      const buttons = wrapper.findAll('button')
      buttons.find(i => i.text() === CLOSE_LABEL)?.element.focus()
    })

    it('should render the content', () => {
      expect(document.body.innerHTML).toContain(CLOSE_LABEL)
    })

    describe('pressing Escape', () => {
      it('should close layer', async () => {
        const layer = wrapper.findComponent('#layer') as VueWrapper
        await fireEvent.keyDown(document.body, { key: 'Escape' })
        expect(document.body.innerHTML).not.toContain(CLOSE_LABEL)
        expect(layer.emitted('escapeKeyDown')?.length).toBe(1)
        expect(layer.emitted('dismiss')?.length).toBe(1)
      })

      it('should not close layer when prevented', async () => {
        await wrapper.setProps({ preventEscapeKeyDownEvent: true })
        const layer = wrapper.findComponent('#layer') as VueWrapper
        await fireEvent.keyDown(document.body, { key: 'Escape' })
        expect(document.body.innerHTML).toContain(CLOSE_LABEL)
        expect(layer.emitted('escapeKeyDown')?.length).toBe(1)
      })
    })

    describe('focus Outside', () => {
      it('should close layer', async () => {
        const outsideEl = document.getElementById('outside') as HTMLElement
        outsideEl.focus()
        await sleep(1)
        expect(document.body.innerHTML).not.toContain(CLOSE_LABEL)
      })

      it('should not close layer when prevented', async () => {
        await wrapper.setProps({ preventFocusOutsideEvent: true })
        const outsideEl = document.getElementById('outside') as HTMLElement
        outsideEl.focus()
        await sleep(1)
        expect(document.body.innerHTML).toContain(CLOSE_LABEL)
      })
    })
  })
})

describe('given a Dialog inside a ShadowRoot', () => {
  let wrapper: VueWrapper<InstanceType<typeof ShadowRootContainer>>
  let shadowHost: HTMLElement
  let shadowRoot: ShadowRoot

  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  beforeEach(async () => {
    document.body.innerHTML = ''
    wrapper = mount(ShadowRootContainer, { attachTo: document.body })
    await nextTick()
    shadowHost = wrapper.find('#shadow-root-container').element as HTMLElement
    shadowRoot = (shadowHost as unknown as { shadowRoot: ShadowRoot }).shadowRoot!
    // Open the dialog
    const trigger = shadowRoot.querySelector('[data-testid="dialog-trigger"]') as HTMLElement
    await fireEvent.click(trigger)
    await sleep(1)
    const dialogOverlay = shadowRoot.querySelector('[data-testid="dialog-overlay"]')
    expect(dialogOverlay).toBeTruthy()
    const dialogContent = shadowRoot.querySelector('[data-testid="dialog-content"]')
    expect(dialogContent).toBeTruthy()
  })

  afterEach(async () => {
    // Unmount the shadow-root container to avoid Vue patching into a cleared body
    await wrapper.unmount()
    await nextTick()
  })

  it('shadowRoot should be defined', () => {
    expect(shadowRoot).toBeDefined()
  })

  it('should be able to dismiss Dialog on pressing Escape', async () => {
    await fireEvent.keyDown(shadowHost, { key: 'Escape' })
    await sleep(1)
    expect(shadowRoot.querySelector('[data-testid="dialog-content"]')).toBeFalsy()
  })

  it('should dismiss Dialog when interacting outside via overlay', async () => {
    await fireEvent.pointerDown(shadowRoot.querySelector('[data-testid="dialog-overlay"]')!)
    await sleep(1)
    expect(shadowRoot.querySelector('[data-testid="dialog-content"]')).toBeFalsy()
  })

  describe('nested Combobox (non-modal)', () => {
    beforeEach(async () => {
      const comboboxTrigger = shadowRoot.querySelector('[data-testid="combobox-trigger"]') as HTMLElement
      await fireEvent.click(comboboxTrigger)
      await sleep(1)
      const comboboxContent = shadowRoot.querySelector('[data-testid="combobox-content"]') as HTMLElement
      expect(comboboxContent).toBeTruthy()
    })

    it('interacting inside Combobox content should not close combobox content, nor the dialog', async () => {
      const item = shadowRoot.querySelector('[data-testid="combobox-item"]') as HTMLElement
      expect(item).toBeTruthy()
      await fireEvent.pointerDown(item)
      await sleep(1)
      expect(shadowRoot.querySelector('[data-testid="combobox-content"]')).toBeTruthy()
      expect(shadowRoot.querySelector('[data-testid="dialog-content"]')).toBeTruthy()
    })

    it('pressing Escape inside Combobox content should close combobox content, but not the dialog', async () => {
      await fireEvent.keyDown(shadowHost, { key: 'Escape' })
      await sleep(1)
      expect(shadowRoot.querySelector('[data-testid="combobox-content"]')).toBeFalsy()
      expect(shadowRoot.querySelector('[data-testid="dialog-content"]')).toBeTruthy()
    })

    it('interacting outside Combobox content should close combobox and close dialog', async () => {
      await fireEvent.pointerDown(shadowRoot.querySelector('[data-testid="dialog-overlay"]')!)
      await sleep(1)
      expect(shadowRoot.querySelector('[data-testid="combobox-content"]')).toBeFalsy()
      expect(shadowRoot.querySelector('[data-testid="dialog-content"]')).toBeFalsy()
    })
  })

  describe('nested Popover', () => {
    describe('modal popover', () => {
      it('interacting inside popover content should not close the dialog', async () => {
        const popoverTrigger = shadowRoot.querySelector('[data-testid="popover-trigger-modal"]') as HTMLElement
        await fireEvent.click(popoverTrigger)
        const popoverContent = shadowRoot.querySelector('[data-testid="popover-content-modal"]') as HTMLElement
        expect(popoverContent).toBeTruthy()
        const firstInput = shadowRoot.querySelector('[data-testid="popover-first-input"]') as HTMLElement
        await fireEvent.pointerDown(firstInput)
        await sleep(1)
        expect(popoverContent).toBeTruthy()
        expect(shadowRoot.querySelector('[data-testid="dialog-content"]')).toBeTruthy()
      })

      it('modal popover: pressing escape key should close popover, not dialog', async () => {
        const popoverTrigger = shadowRoot.querySelector('[data-testid="popover-trigger-modal"]') as HTMLElement
        await fireEvent.click(popoverTrigger)
        const popoverContent = shadowRoot.querySelector('[data-testid="popover-content-modal"]') as HTMLElement
        expect(popoverContent).toBeTruthy()
        await fireEvent.keyDown(shadowHost, { key: 'Escape' })
        await sleep(1)
        expect(shadowRoot.querySelector('[data-testid="popover-content-modal"]')).toBeFalsy()
        expect(shadowRoot.querySelector('[data-testid="dialog-content"]')).toBeTruthy()
      })

      // it('modal popover: interacting outside should close popover, not dialog', async () => {
      //   const popoverTrigger = shadowRoot.querySelector('[data-testid="popover-trigger-modal"]') as HTMLElement
      //   await fireEvent.click(popoverTrigger)
      //   const popoverContent = shadowRoot.querySelector('[data-testid="popover-content-modal"]') as HTMLElement
      //   expect(popoverContent).toBeTruthy()
      //   await fireEvent.pointerDown(shadowRoot.querySelector('[data-testid="dialog-overlay"]')!)
      //   await sleep(1)
      //   expect(shadowRoot.querySelector('[data-testid="popover-content-modal"]')).toBeFalsy()
      //   expect(shadowRoot.querySelector('[data-testid="dialog-content"]')).toBeTruthy()
      // })
    })

    describe('non-modal popover', () => {
      it('interacting inside popover content should not close the dialog', async () => {
        const popoverTrigger = shadowRoot.querySelector('[data-testid="popover-trigger-nonmodal"]') as HTMLElement
        await fireEvent.click(popoverTrigger)
        const popoverContent = shadowRoot.querySelector('[data-testid="popover-content-nonmodal"]') as HTMLElement
        expect(popoverContent).toBeTruthy()
        const firstInput = shadowRoot.querySelector('[data-testid="popover-first-input"]') as HTMLElement
        await fireEvent.pointerDown(firstInput)
        await sleep(1)
        expect(popoverContent).toBeTruthy()
        expect(shadowRoot.querySelector('[data-testid="dialog-content"]')).toBeTruthy()
      })

      it('non-modal popover: pressing escape key should close popover, but not close the dialog', async () => {
        const popoverTrigger = shadowRoot.querySelector('[data-testid="popover-trigger-nonmodal"]') as HTMLElement
        await fireEvent.click(popoverTrigger)
        await sleep(1)
        const popoverContent = shadowRoot.querySelector('[data-testid="popover-content-nonmodal"]') as HTMLElement
        expect(popoverContent).toBeTruthy()
        await fireEvent.keyDown(shadowHost, { key: 'Escape' })
        await sleep(1)
        expect(shadowRoot.querySelector('[data-testid="popover-content-nonmodal"]')).toBeFalsy()
        expect(shadowRoot.querySelector('[data-testid="dialog-content"]')).toBeTruthy()
      })

      it('non-modal popover: interacting outside should close popover and the dialog', async () => {
        const popoverTrigger = shadowRoot.querySelector('[data-testid="popover-trigger-nonmodal"]') as HTMLElement
        await fireEvent.click(popoverTrigger)
        await sleep(1)
        const popoverContent = shadowRoot.querySelector('[data-testid="popover-content-nonmodal"]') as HTMLElement
        expect(popoverContent).toBeTruthy()
        await fireEvent.pointerDown(shadowRoot.querySelector('[data-testid="dialog-overlay"]')!)
        await sleep(1)
        expect(shadowRoot.querySelector('[data-testid="popover-content-nonmodal"]')).toBeFalsy()
        expect(shadowRoot.querySelector('[data-testid="dialog-content"]')).toBeFalsy()
      })
    })
  })

  describe('nested Dropdown Menu', () => {
    describe('modal dropdown', () => {
      it('interacting inside dropdown and sub menus should not close the dialog', async () => {
        const trigger = shadowRoot.querySelector('[data-testid="dropdown-trigger-modal"]') as HTMLElement
        await fireEvent.click(trigger)
        await sleep(1)
        const dropdownContent = shadowRoot.querySelector('[data-testid="dropdown-content-modal"]') as HTMLElement
        expect(dropdownContent).toBeTruthy()
        const moreTools = shadowRoot.querySelector('[data-testid="more-tools-subtrigger"]') as HTMLElement
        await fireEvent.pointerDown(moreTools)
        await sleep(1)
        expect(dropdownContent).toBeTruthy()
        expect(shadowRoot.querySelector('[data-testid="dialog-content"]')).toBeTruthy()
      })

      it('modal dropdown: pressing escape key should close dropdown, not the dialog', async () => {
        const trigger = shadowRoot.querySelector('[data-testid="dropdown-trigger-modal"]') as HTMLElement
        await fireEvent.click(trigger)
        await sleep(1)
        const dialogContent = shadowRoot.querySelector('[data-testid="dialog-content"]') as HTMLElement
        expect(dialogContent).toBeTruthy()
        await fireEvent.keyDown(shadowHost, { key: 'Escape' })
        await sleep(1)
        expect(shadowRoot.querySelector('[data-testid="dropdown-content-modal"]')).toBeFalsy()
        expect(shadowRoot.querySelector('[data-testid="dialog-content"]')).toBeTruthy()
      })

      it('modal dropdown: interacting outside should close dropdown, not the dialog', async () => {
        const trigger = shadowRoot.querySelector('[data-testid="dropdown-trigger-modal"]') as HTMLElement
        await fireEvent.click(trigger)
        await sleep(1)
        const dialogContent = shadowRoot.querySelector('[data-testid="dialog-content"]') as HTMLElement
        expect(dialogContent).toBeTruthy()
        await fireEvent.pointerDown(shadowRoot.querySelector('[data-testid="dialog-overlay"]')!)
        await sleep(1)
        expect(shadowRoot.querySelector('[data-testid="dropdown-content-modal"]')).toBeFalsy()
        expect(shadowRoot.querySelector('[data-testid="dialog-content"]')).toBeTruthy()
      })
    })

    describe('non-modal dropdown', () => {
      it('non-modal dropdown: pressing escape key should close dropdown, but not close the dialog', async () => {
        const trigger = shadowRoot.querySelector('[data-testid="dropdown-trigger-nonmodal"]') as HTMLElement
        await fireEvent.click(trigger)
        await sleep(1)
        const dialogContent = shadowRoot.querySelector('[data-testid="dialog-content"]') as HTMLElement
        expect(dialogContent).toBeTruthy()
        await fireEvent.keyDown(shadowHost, { key: 'Escape' })
        await sleep(1)
        expect(shadowRoot.querySelector('[data-testid="dropdown-content-nonmodal"]')).toBeFalsy()
        expect(shadowRoot.querySelector('[data-testid="dialog-content"]')).toBeTruthy()
      })

      it('non-modal dropdown: interacting outside should close dropdown and close the dialog', async () => {
        const trigger = shadowRoot.querySelector('[data-testid="dropdown-trigger-nonmodal"]') as HTMLElement
        await fireEvent.click(trigger)
        await sleep(1)
        const dialogContent = shadowRoot.querySelector('[data-testid="dialog-content"]') as HTMLElement
        expect(dialogContent).toBeTruthy()
        await fireEvent.pointerDown(shadowRoot.querySelector('[data-testid="dialog-overlay"]')!)
        await sleep(1)
        expect(shadowRoot.querySelector('[data-testid="dropdown-content-nonmodal"]')).toBeFalsy()
        expect(shadowRoot.querySelector('[data-testid="dialog-content"]')).toBeFalsy()
      })
    })
  })
})
