import type { DOMWrapper, VueWrapper } from '@vue/test-utils'
import { fireEvent } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { sleep } from '@/test'
import DismissableLayer from './story/_DismissableLayer.vue'

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
