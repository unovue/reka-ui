import type { DOMWrapper, VueWrapper } from '@vue/test-utils'
import { fireEvent } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { sleep } from '@/test'
import { DismissableLayer } from '.'
import DismissableLayerStory from './story/_DismissableLayer.vue'
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

describe('given a default DismissableLayer', () => {
  let wrapper: VueWrapper<InstanceType<typeof DismissableLayerStory>>
  let trigger: DOMWrapper<HTMLElement>

  beforeEach(() => {
    document.body.innerHTML = ''
    wrapper = mount(DismissableLayerStory, { attachTo: document.body, props: { openLabel: OPEN_LABEL, closeLabel: CLOSE_LABEL, outsideLabel: OUTSIDE_LABEL } })
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

describe('given a mounted DismissableLayer toggling disableOutsidePointerEvents', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    document.body.style.pointerEvents = ''
  })

  // Regression: with `unmountOnHide: false` the layer stays mounted while
  // `disableOutsidePointerEvents` toggles `true` -> `false`. The body pointer-events
  // must be restored even though the component is never unmounted.
  it('should restore body pointer-events when toggled off while staying mounted', async () => {
    const wrapper = mount(DismissableLayer, {
      attachTo: document.body,
      props: { disableOutsidePointerEvents: true },
    })
    await nextTick()

    expect(document.body.style.pointerEvents).toBe('none')

    await wrapper.setProps({ disableOutsidePointerEvents: false })
    await nextTick()

    expect(document.body.style.pointerEvents).toBe('')
  })

  it('should keep body locked while another layer still disables pointer events', async () => {
    const first = mount(DismissableLayer, {
      attachTo: document.body,
      props: { disableOutsidePointerEvents: true },
    })
    const second = mount(DismissableLayer, {
      attachTo: document.body,
      props: { disableOutsidePointerEvents: true },
    })
    await nextTick()

    expect(document.body.style.pointerEvents).toBe('none')

    // Close the second (topmost) layer without unmounting it.
    await second.setProps({ disableOutsidePointerEvents: false })
    await nextTick()

    // First layer is still open, so the body stays locked.
    expect(document.body.style.pointerEvents).toBe('none')

    await first.setProps({ disableOutsidePointerEvents: false })
    await nextTick()

    expect(document.body.style.pointerEvents).toBe('')
  })
})
