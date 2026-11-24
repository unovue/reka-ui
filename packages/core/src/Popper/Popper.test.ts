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

describe('transformOrigin direction-aware logic', () => {
  async function run(
    options: Parameters<typeof transformOrigin>[0],
    placement: string,
    arrowData?: { x?: number, y?: number, centerOffset?: number },
  ) {
    const result = await transformOrigin(options).fn({
      placement,
      rects: { floating: { width: 100, height: 50 } },
      middlewareData: { arrow: arrowData },
    } as any)
    return result.data as { x: string, y: string }
  }

  const noArrow = { arrowWidth: 0, arrowHeight: 0 }

  describe('bottom placement', () => {
    it('rTL flips start origin to 100%', async () => {
      expect((await run({ ...noArrow, dir: 'rtl' }, 'bottom-start')).x).toBe('100%')
    })
    it('lTR keeps start origin at 0%', async () => {
      expect((await run({ ...noArrow, dir: 'ltr' }, 'bottom-start')).x).toBe('0%')
    })
    it('rTL flips end origin to 0%', async () => {
      expect((await run({ ...noArrow, dir: 'rtl' }, 'bottom-end')).x).toBe('0%')
    })
    it('lTR keeps end origin at 100%', async () => {
      expect((await run({ ...noArrow, dir: 'ltr' }, 'bottom-end')).x).toBe('100%')
    })
    it('center is unaffected by dir', async () => {
      expect((await run({ ...noArrow, dir: 'rtl' }, 'bottom')).x).toBe('50%')
      expect((await run({ ...noArrow, dir: 'ltr' }, 'bottom')).x).toBe('50%')
    })
  })

  describe('top placement', () => {
    it('rTL flips start origin to 100%', async () => {
      expect((await run({ ...noArrow, dir: 'rtl' }, 'top-start')).x).toBe('100%')
    })
    it('lTR keeps start origin at 0%', async () => {
      expect((await run({ ...noArrow, dir: 'ltr' }, 'top-start')).x).toBe('0%')
    })
    it('rTL flips end origin to 0%', async () => {
      expect((await run({ ...noArrow, dir: 'rtl' }, 'top-end')).x).toBe('0%')
    })
    it('lTR keeps end origin at 100%', async () => {
      expect((await run({ ...noArrow, dir: 'ltr' }, 'top-end')).x).toBe('100%')
    })
  })

  describe('left/right placements use Y-axis alignment, unaffected by dir', () => {
    it('right-start: y origin is 0% for both RTL and LTR', async () => {
      expect((await run({ ...noArrow, dir: 'rtl' }, 'right-start')).y).toBe('0%')
      expect((await run({ ...noArrow, dir: 'ltr' }, 'right-start')).y).toBe('0%')
    })
    it('right-end: y origin is 100% for both RTL and LTR', async () => {
      expect((await run({ ...noArrow, dir: 'rtl' }, 'right-end')).y).toBe('100%')
      expect((await run({ ...noArrow, dir: 'ltr' }, 'right-end')).y).toBe('100%')
    })
    it('left-start: y origin is 0% for both RTL and LTR', async () => {
      expect((await run({ ...noArrow, dir: 'rtl' }, 'left-start')).y).toBe('0%')
      expect((await run({ ...noArrow, dir: 'ltr' }, 'left-start')).y).toBe('0%')
    })
    it('left-end: y origin is 100% for both RTL and LTR', async () => {
      expect((await run({ ...noArrow, dir: 'rtl' }, 'left-end')).y).toBe('100%')
      expect((await run({ ...noArrow, dir: 'ltr' }, 'left-end')).y).toBe('100%')
    })
  })

  describe('default dir (undefined)', () => {
    it('bottom placement defaults to LTR: start → 0%, end → 100%', async () => {
      expect((await run(noArrow, 'bottom-start')).x).toBe('0%')
      expect((await run(noArrow, 'bottom-end')).x).toBe('100%')
    })
    it('top placement defaults to LTR: start → 0%, end → 100%', async () => {
      expect((await run(noArrow, 'top-start')).x).toBe('0%')
      expect((await run(noArrow, 'top-end')).x).toBe('100%')
    })
  })

  describe('arrow-visible scenario: arrow-based x/y positioning is not affected by dir', () => {
    // arrowXCenter = arrowData.x (20) + arrowWidth (10) / 2 = 25
    // arrowYCenter = arrowData.y (15) + arrowHeight (5) / 2 = 17.5
    const withArrow = { arrowWidth: 10, arrowHeight: 5 }
    const arrowData = { x: 20, y: 15, centerOffset: 0 }

    it('bottom placement uses arrow x center regardless of dir', async () => {
      expect((await run({ ...withArrow, dir: 'rtl' }, 'bottom-start', arrowData)).x).toBe('25px')
      expect((await run({ ...withArrow, dir: 'ltr' }, 'bottom-start', arrowData)).x).toBe('25px')
    })
    it('top placement uses arrow x center regardless of dir', async () => {
      expect((await run({ ...withArrow, dir: 'rtl' }, 'top-end', arrowData)).x).toBe('25px')
      expect((await run({ ...withArrow, dir: 'ltr' }, 'top-end', arrowData)).x).toBe('25px')
    })
    it('right placement uses arrow y center regardless of dir', async () => {
      expect((await run({ ...withArrow, dir: 'rtl' }, 'right-start', arrowData)).y).toBe('17.5px')
      expect((await run({ ...withArrow, dir: 'ltr' }, 'right-start', arrowData)).y).toBe('17.5px')
    })
    it('left placement uses arrow y center regardless of dir', async () => {
      expect((await run({ ...withArrow, dir: 'rtl' }, 'left-end', arrowData)).y).toBe('17.5px')
      expect((await run({ ...withArrow, dir: 'ltr' }, 'left-end', arrowData)).y).toBe('17.5px')
    })
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
