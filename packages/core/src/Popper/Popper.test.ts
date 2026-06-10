import type { VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import Popper from './_Popper.vue'
import PopperAnchor from './PopperAnchor.vue'
import PopperContent from './PopperContent.vue'
import PopperRoot from './PopperRoot.vue'
import { transformOrigin } from './utils'

describe('give default Popper', async () => {
  let wrapper: VueWrapper<InstanceType<typeof Popper>>
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  beforeEach(() => {
    wrapper = mount(Popper, { attachTo: document.body })
  })

  it('should render correctly and match snapshot', async () => {
    expect(wrapper.element).toMatchSnapshot()
  })
})

describe('transformOrigin RTL', () => {
  const baseOptions = { arrowWidth: 0, arrowHeight: 0 }
  const makeData = (placement: string) => ({
    placement,
    rects: { floating: { width: 100, height: 50 } },
    middlewareData: { arrow: undefined },
  } as any)

  it('flips start/end x-origin in RTL for bottom placement', () => {
    const middleware = transformOrigin({ ...baseOptions, dir: 'rtl' })
    const ltrMiddleware = transformOrigin({ ...baseOptions, dir: 'ltr' })

    const rtlResult = middleware.fn(makeData('bottom-start'))
    const ltrResult = ltrMiddleware.fn(makeData('bottom-start'))

    // RTL start should be right-aligned (100%), LTR start is left-aligned (0%)
    expect(rtlResult.data.x).toBe('100%')
    expect(ltrResult.data.x).toBe('0%')
  })

  it('flips end x-origin in RTL for bottom placement', () => {
    const middleware = transformOrigin({ ...baseOptions, dir: 'rtl' })
    const ltrMiddleware = transformOrigin({ ...baseOptions, dir: 'ltr' })

    const rtlResult = middleware.fn(makeData('bottom-end'))
    const ltrResult = ltrMiddleware.fn(makeData('bottom-end'))

    // RTL end should be left-aligned (0%), LTR end is right-aligned (100%)
    expect(rtlResult.data.x).toBe('0%')
    expect(ltrResult.data.x).toBe('100%')
  })

  it('center placement is unaffected by dir', () => {
    const rtl = transformOrigin({ ...baseOptions, dir: 'rtl' }).fn(makeData('bottom'))
    const ltr = transformOrigin({ ...baseOptions, dir: 'ltr' }).fn(makeData('bottom'))
    expect(rtl.data.x).toBe('50%')
    expect(ltr.data.x).toBe('50%')
  })
})

describe('popper wrapper dir attribute', () => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  it('sets dir on the floatingRef wrapper so placement and origin are consistent', async () => {
    const RtlPopper = defineComponent({
      setup() {
        return () =>
          h(PopperRoot, null, {
            default: () => [
              h(PopperAnchor, null, { default: () => 'Anchor' }),
              h(PopperContent, { dir: 'rtl' }, { default: () => 'Content' }),
            ],
          })
      },
    })

    const wrapper = mount(RtlPopper, { attachTo: document.body })
    const wrapperDiv = wrapper.find('[data-reka-popper-content-wrapper]')
    expect(wrapperDiv.attributes('dir')).toBe('rtl')
  })

  it('sets dir=ltr on the wrapper when explicitly passed', async () => {
    const LtrPopper = defineComponent({
      setup() {
        return () =>
          h(PopperRoot, null, {
            default: () => [
              h(PopperAnchor, null, { default: () => 'Anchor' }),
              h(PopperContent, { dir: 'ltr' }, { default: () => 'Content' }),
            ],
          })
      },
    })

    const wrapper = mount(LtrPopper, { attachTo: document.body })
    const wrapperDiv = wrapper.find('[data-reka-popper-content-wrapper]')
    expect(wrapperDiv.attributes('dir')).toBe('ltr')
  })
})
