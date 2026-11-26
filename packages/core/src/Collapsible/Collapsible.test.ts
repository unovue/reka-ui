import type { DOMWrapper, VueWrapper } from '@vue/test-utils'
import { findByText } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, nextTick } from 'vue'
import { CollapsibleContent, CollapsibleRoot, CollapsibleTrigger } from '.'
import Collapsible from './story/_Collapsible.vue'

const CONTENT_TEXT = 'Content'

describe('given a default Collapsible', async () => {
  let wrapper: VueWrapper<InstanceType<typeof Collapsible>>
  let trigger: DOMWrapper<HTMLButtonElement>
  let content: DOMWrapper<HTMLDivElement>

  beforeEach(() => {
    wrapper = mount(Collapsible)
    trigger = wrapper.find('button')
    content = wrapper.find('[hidden]')
  })
  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('should have hidden content', async () => {
    // console.log(content.element)
    expect(content.element).not.toBeNull()
    expect(content.element).toHaveTextContent('')
  })

  describe('when clicking the trigger', async () => {
    let content: HTMLElement
    beforeEach(async () => {
      await trigger.trigger('click')
      content = await findByText(wrapper.element as HTMLElement, CONTENT_TEXT)
    })

    it('should open the content', async () => {
      expect(wrapper.text()).toContain(content.innerHTML)
    })

    describe('and clicking the trigger again', () => {
      beforeEach(() => {
        trigger.trigger('click')
      })

      it('should close the content', () => {
        expect(wrapper.text()).not.toContain(content.innerHTML)
      })
    })
  })
})

describe('given a Collapsible with `unmountOnHide:false` ', async () => {
  let wrapper: VueWrapper<InstanceType<typeof Collapsible>>
  let trigger: DOMWrapper<HTMLButtonElement>
  let content: DOMWrapper<HTMLDivElement>

  beforeEach(() => {
    wrapper = mount(Collapsible, { props: { unmountOnHide: false } })
    trigger = wrapper.find('button')
    content = wrapper.find('[hidden]')
  })
  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('should have hidden attribute', async () => {
    // `jsdom` doesn't render hidden attribute correctly
    expect(content.element.getAttribute('hidden')).toBe('')
    // it should be
    // expect(content.element.getAttribute('hidden')).toBe('until-found')
  })

  describe('when clicking the trigger', async () => {
    let content: HTMLElement
    beforeEach(async () => {
      await trigger.trigger('click')
      content = await findByText(wrapper.element as HTMLElement, CONTENT_TEXT)
    })

    it('should open the content', async () => {
      expect(wrapper.text()).toContain(content.innerHTML)
    })

    describe('and clicking the trigger again', () => {
      beforeEach(() => {
        trigger.trigger('click')
      })

      it('should close the content', () => {
        expect(content.getAttribute('data-state')).toBe('closed')
        expect(content.getAttribute('hidden')).toBe('')
        expect(wrapper.text()).toContain(content.innerHTML)
      })
    })
  })
})

describe('given an open uncontrolled Collapsible', () => {
  let content: HTMLElement
  describe('when clicking the trigger', async () => {
    let wrapper: VueWrapper<InstanceType<typeof Collapsible>>
    beforeEach(async () => {
      wrapper = mount(Collapsible, {
        props: {
          defaultOpen: true,
        },
      })
      content = await findByText(wrapper.element as HTMLElement, CONTENT_TEXT)
    })

    it('should open the content by default', () => {
      expect(wrapper.text()).toContain(content.innerHTML)
    })

    it('should close the content', async () => {
      const trigger = wrapper.find('button')
      await trigger.trigger('click')
      expect(wrapper.text()).not.toContain(content.innerHTML)
    })

    it('should call `update:open` prop with `false` value', () => {
      wrapper.vm.$emit('update:open', false)
      expect(wrapper.emitted('update:open')?.[0]?.[0]).toBe(false)
    })
  })
})

describe('measuring the content size', () => {
  const contentRects = () => {
    const spy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect')
    spy.mockImplementation(function (this: HTMLElement) {
      const rect = this.hasAttribute('hidden') ? { width: 0, height: 0 } : { width: 200, height: 120 }
      return { ...rect, x: 0, y: 0, top: 0, left: 0, right: rect.width, bottom: rect.height, toJSON: () => rect } as DOMRect
    })
    // Calls made on the content elements (or the one with `id`), which is what the measurement reads.
    return (id = 'content') => spy.mock.contexts.filter(el => (el as HTMLElement).dataset.testid?.startsWith(id)).length
  }

  function mountList(count: number, rootProps: Record<string, unknown> = {}, contentProps: Record<string, unknown> = {}) {
    const Fixture = defineComponent({
      setup() {
        return () => h('div', Array.from({ length: count }, (_, i) =>
          h(CollapsibleRoot, { key: i, ...rootProps }, () => [
            h(CollapsibleTrigger, { 'data-testid': `trigger-${i}` }, () => `Trigger ${i}`),
            h(CollapsibleContent, { 'data-testid': `content-${i}`, ...contentProps }, () => `Content ${i}`),
          ])))
      },
    })
    return mount(Fixture, { attachTo: document.body })
  }

  const settle = async () => {
    for (let i = 0; i < 4; i++)
      await nextTick()
  }

  let wrapper: VueWrapper | undefined
  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
    vi.restoreAllMocks()
  })

  it.each([true, false])('does not measure panels mounted closed (unmountOnHide: %s)', async (unmountOnHide) => {
    const measured = contentRects()
    wrapper = mountList(20, { unmountOnHide })
    await settle()

    expect(measured()).toBe(0)
  })

  it.each([true, false])('measures a panel mounted closed when it opens (unmountOnHide: %s)', async (unmountOnHide) => {
    const measured = contentRects()
    wrapper = mountList(3, { unmountOnHide })
    await settle()

    await wrapper.find('[data-testid="trigger-1"]').trigger('click')
    await settle()

    const content = wrapper.find<HTMLElement>('[data-testid="content-1"]').element
    expect(content.hasAttribute('hidden')).toBe(false)
    expect(content.style.getPropertyValue('--reka-collapsible-content-height')).toBe('120px')
    expect(content.style.getPropertyValue('--reka-collapsible-content-width')).toBe('200px')
    expect(measured('content-1')).toBeGreaterThan(0)
    // The other panels are still closed and never measured.
    expect(measured()).toBe(measured('content-1'))
  })

  it('measures panels mounted open', async () => {
    const measured = contentRects()
    wrapper = mountList(3, { defaultOpen: true })
    await settle()

    expect(measured()).toBeGreaterThan(0)
    const content = wrapper.find<HTMLElement>('[data-testid="content-0"]').element
    expect(content.style.getPropertyValue('--reka-collapsible-content-height')).toBe('120px')
  })

  it('measures closed panels that are force mounted', async () => {
    const measured = contentRects()
    wrapper = mountList(3, {}, { forceMount: true })
    await settle()

    expect(measured()).toBeGreaterThan(0)
    const content = wrapper.find<HTMLElement>('[data-testid="content-0"]').element
    expect(content.style.getPropertyValue('--reka-collapsible-content-height')).toBe('120px')
  })

  it('measures a panel again when it closes after opening', async () => {
    const measured = contentRects()
    wrapper = mountList(1, { defaultOpen: true })
    await settle()
    const afterMount = measured()

    await wrapper.find('[data-testid="trigger-0"]').trigger('click')
    await settle()

    expect(measured()).toBeGreaterThan(afterMount)
  })
})
