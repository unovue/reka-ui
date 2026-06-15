import type { DOMWrapper, VueWrapper } from '@vue/test-utils'
import { fireEvent } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { nextTick } from 'vue'
import { sleep } from '@/test'
import { DismissableLayer as DismissableLayerPrimitive } from '.'
import DismissableLayer from './story/_DismissableLayer.vue'
import Dialog from './story/shadowDom/_Dialog.vue'
import ShadowRootContainer from './story/shadowDom/ShadowRootContainer.vue'
import { isLayerExist } from './utils'

const OPEN_LABEL = 'Open'
const CLOSE_LABEL = 'Close'
const OUTSIDE_LABEL = 'Outside'

describe('isLayerExist', () => {
  it('should return false for non-Element targets without throwing', () => {
    const layer = document.createElement('div')
    layer.setAttribute('data-dismissable-layer', '')

    expect(isLayerExist(layer, document as any)).toBe(false)
    expect(isLayerExist(layer, document.createTextNode('x') as any)).toBe(false)
  })
})

describe('nested layers with disableOutsidePointerEvents (#2674)', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    document.body.style.pointerEvents = ''
  })

  function mountNested() {
    const outerOpen = ref(true)
    const innerOpen = ref(false)
    // Mirrors how a modal Menu drives the prop (`menuContext.open.value`):
    // the layer stays mounted while the prop toggles back to `false`.
    const innerDisable = ref(true)

    const wrapper = mount(defineComponent({
      setup() {
        return () => h('div', [
          outerOpen.value
            ? h(DismissableLayerPrimitive, { 'disableOutsidePointerEvents': true, 'data-testid': 'outer' }, () => 'Outer')
            : null,
          innerOpen.value
            ? h(DismissableLayerPrimitive, { 'disableOutsidePointerEvents': innerDisable.value, 'data-testid': 'inner' }, () => 'Inner')
            : null,
        ])
      },
    }), { attachTo: document.body })

    return { wrapper, outerOpen, innerOpen, innerDisable }
  }

  it('should keep body pointer-events none after a nested layer closes while outer stays open', async () => {
    const { wrapper, innerOpen } = mountNested()
    await sleep(1)

    // Outer (dialog) open -> body locked
    expect(document.body.style.pointerEvents).toBe('none')

    // Open inner (menu) layer
    innerOpen.value = true
    await sleep(1)
    expect(document.body.style.pointerEvents).toBe('none')

    // Close inner layer while outer is still open
    innerOpen.value = false
    await sleep(1)
    expect(document.body.style.pointerEvents).toBe('none')

    wrapper.unmount()
  })

  it('should keep body pointer-events none when a nested layer toggles disableOutsidePointerEvents to false while mounted', async () => {
    const { wrapper, innerOpen, innerDisable } = mountNested()
    await sleep(1)
    expect(document.body.style.pointerEvents).toBe('none')

    // Open inner layer (still disabling outside pointer events)
    innerOpen.value = true
    await sleep(1)
    expect(document.body.style.pointerEvents).toBe('none')

    // Toggle the prop off without unmounting (a modal Menu closing)
    innerDisable.value = false
    await sleep(1)
    expect(document.body.style.pointerEvents).toBe('none')

    // Now unmount the inner layer entirely; outer still open
    innerOpen.value = false
    await sleep(1)
    expect(document.body.style.pointerEvents).toBe('none')

    wrapper.unmount()
  })

  it('should restore and re-lock body pointer-events as the only layer toggles disableOutsidePointerEvents', async () => {
    const disable = ref(true)
    const wrapper = mount(defineComponent({
      setup() {
        return () => h(DismissableLayerPrimitive, { disableOutsidePointerEvents: disable.value }, () => 'Only')
      },
    }), { attachTo: document.body })

    await sleep(1)
    expect(document.body.style.pointerEvents).toBe('none')

    // Toggle off -> body restored, and the layer must leave the tracking set
    disable.value = false
    await sleep(1)
    expect(document.body.style.pointerEvents).toBe('')

    // Toggle back on -> body must lock again (would stay '' if a stale entry
    // remained in the set, making `size === 0` false on re-add)
    disable.value = true
    await sleep(1)
    expect(document.body.style.pointerEvents).toBe('none')

    wrapper.unmount()
  })

  it('should restore body pointer-events after the last layer closes', async () => {
    const { wrapper, outerOpen } = mountNested()
    await sleep(1)
    expect(document.body.style.pointerEvents).toBe('none')

    outerOpen.value = false
    await sleep(1)
    expect(document.body.style.pointerEvents).toBe('')

    wrapper.unmount()
  })
})

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

type ShadowRootTestCase = {
  description: string
  testCase: 'shadowDomOnly' | 'mixedBodyAndShadowDom' | 'bodyOnly'
}

describe('shadow DOM dismissable layer tests', () => {
  const testSuite: ShadowRootTestCase[] = [
    {
      description: 'given a Dialog inside a ShadowRoot, with nested dismissable layers also inside the ShadowRoot',
      testCase: 'shadowDomOnly',
    },
    {
      description: 'given a Dialog in the document body, with nested dismissable layers inside a ShadowRoot',
      testCase: 'mixedBodyAndShadowDom',
    },
    {
      description: 'given a Dialog in the document body, with nested dismissable layers also in the document body',
      testCase: 'bodyOnly',
    },
  ]

  testSuite.forEach(({ description, testCase }) => {
    describe(description, () => {
      let wrapper: VueWrapper<InstanceType<typeof ShadowRootContainer>>
      let shadowHost: HTMLElement
      let shadowRoot: ShadowRoot

      globalThis.ResizeObserver = class ResizeObserver {
        observe() {}
        unobserve() {}
        disconnect() {}
      }

      function getDialogOverlay(): HTMLElement | null {
        if (testCase === 'shadowDomOnly') {
          return shadowRoot.querySelector('[data-testid="dialog-overlay"]')
        }
        else {
          return document.body.querySelector('[data-testid="dialog-overlay"]')
        }
      }

      function getDialogTrigger(): HTMLElement | null {
        if (testCase === 'shadowDomOnly') {
          return shadowRoot.querySelector('[data-testid="dialog-trigger"]')
        }
        else {
          return document.body.querySelector('[data-testid="dialog-trigger"]')
        }
      }

      function getDialogContent(): HTMLElement | null {
        if (testCase === 'shadowDomOnly') {
          return shadowRoot.querySelector('[data-testid="dialog-content"]')
        }
        else {
          return document.body.querySelector('[data-testid="dialog-content"]')
        }
      }

      function getQueryRoot(): Document | ShadowRoot {
        if (testCase === 'bodyOnly') {
          return document
        }
        else {
          return shadowRoot
        }
      }

      beforeEach(async () => {
        document.body.innerHTML = ''
        if (testCase === 'shadowDomOnly') {
          wrapper = mount(ShadowRootContainer, { attachTo: document.body, props: { withDialog: true } })
          await nextTick()
          shadowHost = wrapper.find('#shadow-root-container').element as HTMLElement
          shadowRoot = (shadowHost as unknown as { shadowRoot: ShadowRoot }).shadowRoot!
          // Open the dialog
          const trigger = getDialogTrigger() as HTMLElement
          await fireEvent.click(trigger)
          await sleep(1)
          const dialogOverlay = getDialogOverlay()
          expect(dialogOverlay).toBeTruthy()
          const dialogContent = getDialogContent()
          expect(dialogContent).toBeTruthy()
        }
        else if (testCase === 'mixedBodyAndShadowDom') {
          wrapper = mount(Dialog, { attachTo: document.body, props: { hasShadowRootInside: true } })
          await nextTick()

          // Open the dialog
          const trigger = getDialogTrigger() as HTMLElement
          await fireEvent.click(trigger)
          await sleep(1)
          const dialogOverlay = getDialogOverlay()
          expect(dialogOverlay).toBeTruthy()
          const dialogContent = getDialogContent()
          expect(dialogContent).toBeTruthy()

          shadowHost = dialogContent?.querySelector('#shadow-root-container') as HTMLElement
          shadowRoot = (shadowHost as unknown as { shadowRoot: ShadowRoot }).shadowRoot!
        }
        else {
          wrapper = mount(Dialog, { attachTo: document.body })
          await nextTick()

          // Open the dialog
          const trigger = getDialogTrigger() as HTMLElement
          await fireEvent.click(trigger)
          await sleep(1)
          const dialogOverlay = getDialogOverlay()
          expect(dialogOverlay).toBeTruthy()
          const dialogContent = getDialogContent()
          expect(dialogContent).toBeTruthy()
        }
      })

      afterEach(async () => {
        await wrapper.unmount()
        await nextTick()
      })

      if (testCase !== 'bodyOnly') {
        it('shadowRoot should be defined', () => {
          expect(shadowRoot).toBeDefined()
        })
      }

      it('should be able to dismiss Dialog on pressing Escape', async () => {
        await fireEvent.keyDown(document.body, { key: 'Escape' })
        await sleep(1)
        expect(getDialogContent()).toBeFalsy()
      })

      it('should dismiss Dialog when interacting outside via overlay', async () => {
        await fireEvent.pointerDown(getDialogOverlay()!)
        await sleep(1)
        expect(getDialogContent()).toBeFalsy()
      })

      describe('nested Combobox (non-modal)', () => {
        beforeEach(async () => {
          const comboboxTrigger = getQueryRoot().querySelector('[data-testid="combobox-trigger"]') as HTMLElement
          await fireEvent.click(comboboxTrigger)
          await sleep(1)
          const comboboxContent = getQueryRoot().querySelector('[data-testid="combobox-content"]') as HTMLElement
          expect(comboboxContent).toBeTruthy()
        })

        it('interacting inside Combobox content should not close combobox content, nor the dialog', async () => {
          const item = getQueryRoot().querySelector('[data-testid="combobox-item"]') as HTMLElement
          expect(item).toBeTruthy()
          await fireEvent.pointerDown(item)
          await sleep(1)
          expect(getQueryRoot().querySelector('[data-testid="combobox-content"]')).toBeTruthy()
          expect(getDialogContent()).toBeTruthy()
        })

        it('pressing Escape inside Combobox content should close combobox content, but not the dialog', async () => {
          await fireEvent.keyDown(document.body, { key: 'Escape' })
          await sleep(1)
          expect(getQueryRoot().querySelector('[data-testid="combobox-content"]')).toBeFalsy()
          expect(getDialogContent()).toBeTruthy()
        })

        it('interacting outside Combobox content should close combobox and close dialog', async () => {
          await fireEvent.pointerDown(getDialogOverlay()!)
          await sleep(1)
          expect(getQueryRoot().querySelector('[data-testid="combobox-content"]')).toBeFalsy()
          expect(getDialogContent()).toBeFalsy()
        })
      })

      describe('nested Popover', () => {
        describe('modal popover', () => {
          it('interacting inside popover content should not close the dialog', async () => {
            const popoverTrigger = getQueryRoot().querySelector('[data-testid="popover-trigger-modal"]') as HTMLElement
            await fireEvent.click(popoverTrigger)
            const popoverContent = getQueryRoot().querySelector('[data-testid="popover-content-modal"]') as HTMLElement
            expect(popoverContent).toBeTruthy()
            const firstInput = getQueryRoot().querySelector('[data-testid="popover-first-input"]') as HTMLElement
            await fireEvent.pointerDown(firstInput)
            await sleep(1)
            expect(popoverContent).toBeTruthy()
            expect(getDialogContent()).toBeTruthy()
          })

          it('modal popover: pressing escape key should close popover, not dialog', async () => {
            const popoverTrigger = getQueryRoot().querySelector('[data-testid="popover-trigger-modal"]') as HTMLElement
            await fireEvent.click(popoverTrigger)
            const popoverContent = getQueryRoot().querySelector('[data-testid="popover-content-modal"]') as HTMLElement
            expect(popoverContent).toBeTruthy()
            await fireEvent.keyDown(document.body, { key: 'Escape' })
            await sleep(1)
            expect(getQueryRoot().querySelector('[data-testid="popover-content-modal"]')).toBeFalsy()
            expect(getDialogContent()).toBeTruthy()
          })

          it('modal popover: interacting outside should close popover, not dialog', async () => {
            const popoverTrigger = getQueryRoot().querySelector('[data-testid="popover-trigger-modal"]') as HTMLElement
            await fireEvent.click(popoverTrigger)
            await sleep(1)
            const popoverContent = getQueryRoot().querySelector('[data-testid="popover-content-modal"]') as HTMLElement
            expect(popoverContent).toBeTruthy()
            await fireEvent.pointerDown(getDialogOverlay()!)
            await sleep(1)
            expect(getQueryRoot().querySelector('[data-testid="popover-content-modal"]')).toBeFalsy()
            expect(getDialogContent()).toBeTruthy()
          })
        })

        describe('non-modal popover', () => {
          it('interacting inside popover content should not close the dialog', async () => {
            const popoverTrigger = getQueryRoot().querySelector('[data-testid="popover-trigger-nonmodal"]') as HTMLElement
            await fireEvent.click(popoverTrigger)
            const popoverContent = getQueryRoot().querySelector('[data-testid="popover-content-nonmodal"]') as HTMLElement
            expect(popoverContent).toBeTruthy()
            const firstInput = getQueryRoot().querySelector('[data-testid="popover-first-input"]') as HTMLElement
            await fireEvent.pointerDown(firstInput)
            await sleep(1)
            expect(popoverContent).toBeTruthy()
            expect(getDialogContent()).toBeTruthy()
          })

          it('non-modal popover: pressing escape key should close popover, but not close the dialog', async () => {
            const popoverTrigger = getQueryRoot().querySelector('[data-testid="popover-trigger-nonmodal"]') as HTMLElement
            await fireEvent.click(popoverTrigger)
            await sleep(1)
            const popoverContent = getQueryRoot().querySelector('[data-testid="popover-content-nonmodal"]') as HTMLElement
            expect(popoverContent).toBeTruthy()
            await fireEvent.keyDown(document.body, { key: 'Escape' })
            await sleep(1)
            expect(getQueryRoot().querySelector('[data-testid="popover-content-nonmodal"]')).toBeFalsy()
            expect(getDialogContent()).toBeTruthy()
          })

          it('non-modal popover: interacting outside should close popover and the dialog', async () => {
            const popoverTrigger = getQueryRoot().querySelector('[data-testid="popover-trigger-nonmodal"]') as HTMLElement
            await fireEvent.click(popoverTrigger)
            await sleep(1)
            const popoverContent = getQueryRoot().querySelector('[data-testid="popover-content-nonmodal"]') as HTMLElement
            expect(popoverContent).toBeTruthy()
            await fireEvent.pointerDown(getDialogOverlay()!)
            await sleep(1)
            expect(getQueryRoot().querySelector('[data-testid="popover-content-nonmodal"]')).toBeFalsy()
            expect(getDialogContent()).toBeFalsy()
          })
        })
      })

      describe('nested Dropdown Menu', () => {
        describe('modal dropdown', () => {
          it('interacting inside dropdown and sub menus should not close the dialog', async () => {
            const trigger = getQueryRoot().querySelector('[data-testid="dropdown-trigger-modal"]') as HTMLElement
            await fireEvent.click(trigger)
            await sleep(1)
            const dropdownContent = getQueryRoot().querySelector('[data-testid="dropdown-content-modal"]') as HTMLElement
            expect(dropdownContent).toBeTruthy()
            const moreTools = getQueryRoot().querySelector('[data-testid="more-tools-subtrigger"]') as HTMLElement
            await fireEvent.pointerDown(moreTools)
            await sleep(1)
            expect(dropdownContent).toBeTruthy()
            expect(getDialogContent()).toBeTruthy()
          })

          it('modal dropdown: pressing escape key should close dropdown, not the dialog', async () => {
            const trigger = getQueryRoot().querySelector('[data-testid="dropdown-trigger-modal"]') as HTMLElement
            await fireEvent.click(trigger)
            await sleep(1)
            const dialogContent = getDialogContent() as HTMLElement
            expect(dialogContent).toBeTruthy()
            await fireEvent.keyDown(document.body, { key: 'Escape' })
            await sleep(1)
            expect(getQueryRoot().querySelector('[data-testid="dropdown-content-modal"]')).toBeFalsy()
            expect(getDialogContent()).toBeTruthy()
          })

          it('modal dropdown: interacting outside should close dropdown, not the dialog', async () => {
            const trigger = getQueryRoot().querySelector('[data-testid="dropdown-trigger-modal"]') as HTMLElement
            await fireEvent.click(trigger)
            await sleep(1)
            const dialogContent = getDialogContent() as HTMLElement
            expect(dialogContent).toBeTruthy()
            await fireEvent.pointerDown(getDialogOverlay()!)
            await sleep(1)
            expect(getQueryRoot().querySelector('[data-testid="dropdown-content-modal"]')).toBeFalsy()
            expect(getDialogContent()).toBeTruthy()
          })
        })

        describe('non-modal dropdown', () => {
          it('non-modal dropdown: pressing escape key should close dropdown, but not close the dialog', async () => {
            const trigger = getQueryRoot().querySelector('[data-testid="dropdown-trigger-nonmodal"]') as HTMLElement
            await fireEvent.click(trigger)
            await sleep(1)
            const dialogContent = getDialogContent() as HTMLElement
            expect(dialogContent).toBeTruthy()
            await fireEvent.keyDown(document.body, { key: 'Escape' })
            await sleep(1)
            expect(getQueryRoot().querySelector('[data-testid="dropdown-content-nonmodal"]')).toBeFalsy()
            expect(getDialogContent()).toBeTruthy()
          })

          it('non-modal dropdown: interacting outside should close dropdown and close the dialog', async () => {
            const trigger = getQueryRoot().querySelector('[data-testid="dropdown-trigger-nonmodal"]') as HTMLElement
            await fireEvent.click(trigger)
            await sleep(1)
            const dialogContent = getDialogContent() as HTMLElement
            expect(dialogContent).toBeTruthy()
            await fireEvent.pointerDown(getDialogOverlay()!)
            await sleep(1)
            expect(getQueryRoot().querySelector('[data-testid="dropdown-content-nonmodal"]')).toBeFalsy()
            expect(getDialogContent()).toBeFalsy()
          })
        })
      })
    })
  })
})
