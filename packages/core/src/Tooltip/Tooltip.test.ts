import type { VueWrapper } from '@vue/test-utils'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, nextTick } from 'vue'
import { TooltipContent, TooltipPortal, TooltipProvider, TooltipRoot, TooltipTrigger } from '.'
import Tooltip from './stories/_Tooltip.vue'
import TooltipProviderComponent from './TooltipProvider.vue'

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

  it('should use the provider content values', async () => {
    await wrapper.find('button').trigger('focus')

    const tooltipContentImpl = wrapper.findComponent(TooltipProviderComponent)

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

describe('closeOnAncestorScroll', () => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  const TooltipInScrollableContainer = defineComponent({
    components: { TooltipProvider, TooltipRoot, TooltipTrigger, TooltipContent, TooltipPortal },
    props: {
      closeOnAncestorScroll: {
        type: Boolean,
        default: true,
      },
    },
    template: `
      <TooltipProvider>
        <div id="scrollable-ancestor" style="overflow: auto; height: 200px; width: 200px;">
          <TooltipRoot :close-on-ancestor-scroll="closeOnAncestorScroll">
            <TooltipTrigger>trigger</TooltipTrigger>
            <TooltipPortal>
              <TooltipContent>Tooltip text</TooltipContent>
            </TooltipPortal>
          </TooltipRoot>
        </div>
      </TooltipProvider>
    `,
  })

  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('should close the tooltip when a scrollable ancestor is scrolled', async () => {
    const wrapper = mount(TooltipInScrollableContainer, { attachTo: document.body })

    await wrapper.find('button').trigger('focus')
    expect(document.body.innerHTML).toContain('Tooltip text')

    const scrollable = document.getElementById('scrollable-ancestor')!
    scrollable.dispatchEvent(new Event('scroll'))
    // usePresence does `await nextTick()` internally before unmounting,
    // so flushPromises() is needed to let it complete all async steps
    await flushPromises()

    expect(document.body.innerHTML).not.toContain('Tooltip text')
    wrapper.unmount()
  })

  it('should not close the tooltip when closeOnAncestorScroll is false', async () => {
    const wrapper = mount(TooltipInScrollableContainer, {
      attachTo: document.body,
      props: { closeOnAncestorScroll: false },
    })

    await wrapper.find('button').trigger('focus')
    expect(document.body.innerHTML).toContain('Tooltip text')

    const scrollable = document.getElementById('scrollable-ancestor')!
    scrollable.dispatchEvent(new Event('scroll'))
    await flushPromises()

    expect(document.body.innerHTML).toContain('Tooltip text')
    wrapper.unmount()
  })

  it('should not close a closed tooltip when scrolled', async () => {
    const wrapper = mount(TooltipInScrollableContainer, { attachTo: document.body })

    expect(document.body.innerHTML).not.toContain('Tooltip text')

    const scrollable = document.getElementById('scrollable-ancestor')!
    scrollable.dispatchEvent(new Event('scroll'))
    await flushPromises()

    expect(document.body.innerHTML).not.toContain('Tooltip text')
    wrapper.unmount()
  })

  it('should remove listeners when closeOnAncestorScroll is toggled false at runtime', async () => {
    const wrapper = mount(TooltipInScrollableContainer, { attachTo: document.body })
    await nextTick()

    // Listeners are attached when prop is true (default)
    const scrollable = document.getElementById('scrollable-ancestor')!
    await wrapper.find('button').trigger('focus')
    expect(document.body.innerHTML).toContain('Tooltip text')

    scrollable.dispatchEvent(new Event('scroll'))
    await flushPromises()
    expect(document.body.innerHTML).not.toContain('Tooltip text')

    // Toggle prop to false — listeners must be removed
    await wrapper.setProps({ closeOnAncestorScroll: false })
    await nextTick()

    // Re-open the tooltip
    await wrapper.find('button').trigger('focus')
    expect(document.body.innerHTML).toContain('Tooltip text')

    // Scroll should no longer close the tooltip
    scrollable.dispatchEvent(new Event('scroll'))
    await flushPromises()
    expect(document.body.innerHTML).toContain('Tooltip text')

    wrapper.unmount()
  })

  it('should add listeners when closeOnAncestorScroll is toggled true at runtime', async () => {
    const wrapper = mount(TooltipInScrollableContainer, {
      attachTo: document.body,
      props: { closeOnAncestorScroll: false },
    })
    await nextTick()

    const scrollable = document.getElementById('scrollable-ancestor')!

    // With prop false — scroll must not close
    await wrapper.find('button').trigger('focus')
    expect(document.body.innerHTML).toContain('Tooltip text')

    scrollable.dispatchEvent(new Event('scroll'))
    await flushPromises()
    expect(document.body.innerHTML).toContain('Tooltip text')

    // Toggle prop to true — listeners must be attached
    await wrapper.setProps({ closeOnAncestorScroll: true })
    await nextTick()

    // Re-open and scroll — must close now
    await wrapper.find('button').trigger('focus')
    expect(document.body.innerHTML).toContain('Tooltip text')

    scrollable.dispatchEvent(new Event('scroll'))
    await flushPromises()
    expect(document.body.innerHTML).not.toContain('Tooltip text')

    wrapper.unmount()
  })

  it('should remove scroll listeners on unmount', async () => {
    const addElSpy = vi.spyOn(HTMLElement.prototype, 'addEventListener')
    const removeElSpy = vi.spyOn(HTMLElement.prototype, 'removeEventListener')
    const addWinSpy = vi.spyOn(Window.prototype, 'addEventListener')
    const removeWinSpy = vi.spyOn(Window.prototype, 'removeEventListener')
    const addVvSpy = globalThis.VisualViewport
      ? vi.spyOn(VisualViewport.prototype, 'addEventListener')
      : null
    const removeVvSpy = globalThis.VisualViewport
      ? vi.spyOn(VisualViewport.prototype, 'removeEventListener')
      : null

    const countScroll = (spy: ReturnType<typeof vi.spyOn>) =>
      spy.mock.calls.filter(([event]) => event === 'scroll').length

    const wrapper = mount(TooltipInScrollableContainer, { attachTo: document.body })
    await nextTick()

    const added
      = countScroll(addElSpy)
        + countScroll(addWinSpy)
        + (addVvSpy ? countScroll(addVvSpy) : 0)
    expect(added).toBeGreaterThan(0)

    wrapper.unmount()
    await nextTick()

    const removed
      = countScroll(removeElSpy)
        + countScroll(removeWinSpy)
        + (removeVvSpy ? countScroll(removeVvSpy) : 0)
    expect(removed).toBe(added)

    addElSpy.mockRestore()
    removeElSpy.mockRestore()
    addWinSpy.mockRestore()
    removeWinSpy.mockRestore()
    addVvSpy?.mockRestore()
    removeVvSpy?.mockRestore()
  })
})
