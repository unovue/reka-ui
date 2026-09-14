import type { VueWrapper } from '@vue/test-utils'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, ref } from 'vue'
import { injectPopperRootContext } from '@/Popper'
import Tooltip from './stories/_Tooltip.vue'
import TooltipContent from './TooltipContent.vue'
import TooltipPortal from './TooltipPortal.vue'
import TooltipProvider from './TooltipProvider.vue'
import TooltipRoot from './TooltipRoot.vue'
import TooltipTrigger from './TooltipTrigger.vue'
import { TOOLTIP_OPEN } from './utils'

function pointerEvent(type: string, init: { clientX?: number, clientY?: number }) {
  const Ctor = typeof PointerEvent !== 'undefined' ? PointerEvent : MouseEvent
  return new Ctor(type, { bubbles: true, ...init }) as PointerEvent
}

describe('given default Tooltip', () => {
  let wrapper: VueWrapper<InstanceType<typeof Tooltip>>

  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  beforeEach(() => {
    document.body.innerHTML = ''
    wrapper = mount(Tooltip, { attachTo: document.body })
  },
  )

  afterEach(async () => {
    wrapper.unmount()
    await flushPromises()
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()

    await wrapper.find('button').trigger('focus')
    expect(await axe(document.body)).toHaveNoViolations()
  })

  it('should open when focus', async () => {
    await wrapper.find('button').trigger('focus')
    expect(document.body.innerHTML).toContain('Add to library')
  })

  describe('after focusing out', () => {
    beforeEach(() => {
      document.body.focus()
    })

    it('should close the tooltip', () => {
      expect(document.body.innerHTML).not.toContain('Add to library')
    })
  })

  describe('disabled tooltip', () => {
    it('should not be open when focus', async () => {
      await wrapper.setProps({ disabled: true })

      await wrapper.find('button').trigger('focus')

      expect(document.body.innerHTML).not.toContain('Add to library')
    })
  })

  it('should close when another tooltip broadcasts that it opened', async () => {
    await wrapper.find('button').trigger('focus')
    expect(document.body.innerHTML).toContain('Add to library')

    document.dispatchEvent(new CustomEvent(TOOLTIP_OPEN))
    await flushPromises()

    expect(document.body.innerHTML).not.toContain('Add to library')
  })
})

describe('given tooltip within TooltipProvider', () => {
  let wrapper: VueWrapper<InstanceType<typeof Tooltip>>

  beforeEach(() => {
    document.body.innerHTML = ''

    wrapper = mount(Tooltip, {
      global: {
        stubs: {
          teleport: {
            template: '<div><slot /></div>',
          },
        },
      },
      attachTo: document.body,
    })
  })

  afterEach(async () => {
    wrapper.unmount()
    await flushPromises()
  })

  it('should use the provider content values', async () => {
    await wrapper.find('button').trigger('focus')

    const tooltipContentImpl = wrapper.findComponent(TooltipProvider)

    expect(tooltipContentImpl.props('content')).toBe(undefined)

    expect(tooltipContentImpl.html()).toContain('data-side="top"')

    await wrapper.setProps({
      tooltipProvider: {
        content: {
          side: 'left',
        },
      },
    })

    await flushPromises()

    expect(tooltipContentImpl.props('content')).toEqual({
      side: 'left',
    })

    expect(tooltipContentImpl.html()).toContain('data-side="left"')
  })
})

describe('given a tooltip trigger whose element is replaced after mount', () => {
  let wrapper: VueWrapper

  const AnchorProbe = defineComponent({
    setup() {
      return { anchor: injectPopperRootContext().anchor }
    },
    template: '<span />',
  })

  const SwappableTrigger = defineComponent({
    components: { AnchorProbe, TooltipContent, TooltipPortal, TooltipProvider, TooltipRoot, TooltipTrigger },
    setup() {
      return { tag: ref('button') }
    },
    template: `
      <TooltipProvider>
        <TooltipRoot>
          <TooltipTrigger :as="tag">trigger</TooltipTrigger>
          <AnchorProbe />
          <TooltipPortal>
            <TooltipContent>tooltip content</TooltipContent>
          </TooltipPortal>
        </TooltipRoot>
      </TooltipProvider>
    `,
  })

  beforeEach(() => {
    document.body.innerHTML = ''
    wrapper = mount(SwappableTrigger, {
      global: {
        stubs: {
          teleport: { template: '<div><slot /></div>' },
        },
      },
      attachTo: document.body,
    })
  })

  afterEach(async () => {
    wrapper.unmount()
    await flushPromises()
  })

  it('should still close on pointerleave after the trigger element is replaced', async () => {
    await wrapper.find('button').trigger('focus')
    expect(document.body.innerHTML).toContain('tooltip content')

    wrapper.vm.tag = 'a'
    await flushPromises()

    expect(document.body.innerHTML).toContain('tooltip content')

    const trigger = wrapper.find('a').element as HTMLElement
    trigger.dispatchEvent(pointerEvent('pointerleave', { clientX: 0, clientY: 0 }))
    await flushPromises()
    document.body.dispatchEvent(pointerEvent('pointermove', { clientX: 9999, clientY: 9999 }))
    await flushPromises()

    expect(document.body.innerHTML).not.toContain('tooltip content')
  })

  it('should stop listening on the replaced trigger element', async () => {
    await wrapper.find('button').trigger('focus')
    const replacedTrigger = wrapper.find('button').element as HTMLElement

    wrapper.vm.tag = 'a'
    await flushPromises()

    replacedTrigger.dispatchEvent(pointerEvent('pointerleave', { clientX: 0, clientY: 0 }))
    await flushPromises()
    document.body.dispatchEvent(pointerEvent('pointermove', { clientX: 9999, clientY: 9999 }))
    await flushPromises()

    expect(document.body.innerHTML).toContain('tooltip content')
  })

  it('should anchor the content to the new trigger element', async () => {
    const probe = wrapper.findComponent(AnchorProbe)
    expect(probe.vm.anchor).toBe(wrapper.find('button').element)

    wrapper.vm.tag = 'a'
    await flushPromises()

    expect(probe.vm.anchor).toBe(wrapper.find('a').element)
  })
})
