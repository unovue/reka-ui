import type { VueWrapper } from '@vue/test-utils'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, nextTick, ref, Transition } from 'vue'
import { PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from '.'
import Popover from './story/_Popover.vue'

describe('given a Popover root that stays mounted', () => {
  it.each([true, false])('should release the forwarded content element with modal=%s', async (modal) => {
    const open = ref(false)
    const wrapper = mount(defineComponent({
      setup: () => () => h(PopoverRoot, { open: open.value, modal }, () => [
        h(PopoverTrigger, () => 'Open'),
        h(PopoverPortal, null, () => h(PopoverContent, () => 'Content')),
      ]),
    }), { attachTo: document.body })

    for (let cycle = 0; cycle < 2; cycle++) {
      open.value = true
      await vi.waitFor(() => expect(document.querySelector('[role="dialog"]')).not.toBeNull())
      const content = wrapper.getComponent(PopoverContent)
      const exposed = content.vm.$.exposed!
      expect(exposed.$el.contains(document.querySelector('[role="dialog"]'))).toBe(true)

      open.value = false
      await flushPromises()
      expect(document.querySelector('[role="dialog"]')).toBeNull()
      expect(content.vm.$.isUnmounted).toBe(false)
      expect(exposed.$el.nodeType).toBe(Node.COMMENT_NODE)
    }

    wrapper.unmount()
  })
})

describe('given default Popover', () => {
  let wrapper: VueWrapper<InstanceType<typeof Popover>>

  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  beforeEach(() => {
    wrapper = mount(Popover, { attachTo: document.body })
  })

  afterEach(() => {
    wrapper.unmount()
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('should only render aria-controls while open', async () => {
    const trigger = wrapper.find('button')
    expect(trigger.attributes('aria-controls')).toBeUndefined()

    trigger.element.click()
    await nextTick()

    await vi.waitFor(() => expect(document.getElementById(trigger.attributes('aria-controls')!)).not.toBeNull())
  })

  describe('after opening popover', async () => {
    beforeEach(async () => {
      wrapper.find('button').element.click()
      await vi.waitFor(() => expect(document.querySelector('[role="dialog"]')).not.toBeNull())
    })

    it('should pass axe accessibility tests', async () => {
      expect(await axe(document.body, {
        rules: {
          // we dont check for dialog-name when using Popover
          'aria-dialog-name': {
            enabled: false,
          },
        },
      })).toHaveNoViolations()
    })
  })
})

describe('given a Popover with a consumer id on the trigger (#3059)', () => {
  it('renders the consumer id on the trigger and points content aria-labelledby at it', async () => {
    const Harness = defineComponent({
      render() {
        return h(PopoverRoot, null, {
          default: () => [
            h(PopoverTrigger, { id: 'my-trigger' }, { default: () => 'open me' }),
            h(PopoverPortal, null, {
              default: () => [
                h(PopoverContent, null, { default: () => h('div', 'hello') }),
              ],
            }),
          ],
        })
      },
    })
    const wrapper = mount(Harness, { attachTo: document.body })
    await flushPromises()

    const trigger = wrapper.get('button')
    expect(trigger.attributes('id')).toBe('my-trigger')

    await trigger.trigger('click')
    await flushPromises()

    const content = document.querySelector('[role="dialog"]')!
    expect(content.getAttribute('aria-labelledby')).toBe('my-trigger')
    wrapper.unmount()
  })
})

describe('given a Popover with an id only on the asChild trigger element', () => {
  it('points content aria-labelledby at the id the trigger actually renders', async () => {
    const Harness = defineComponent({
      render() {
        return h(PopoverRoot, null, {
          default: () => [
            h(PopoverTrigger, { asChild: true }, {
              default: () => h('button', { id: 'child-trigger' }, 'open me'),
            }),
            h(PopoverPortal, null, {
              default: () => [
                h(PopoverContent, null, { default: () => h('div', 'hello') }),
              ],
            }),
          ],
        })
      },
    })
    const wrapper = mount(Harness, { attachTo: document.body })
    await flushPromises()

    const trigger = wrapper.get('button')
    expect(trigger.attributes('id')).toBe('child-trigger')

    await trigger.trigger('click')
    await flushPromises()

    const content = document.querySelector('[role="dialog"]')!
    expect(content.getAttribute('aria-labelledby')).toBe('child-trigger')
    wrapper.unmount()
  })
})

describe('given a Popover whose content has no tabbable children (#2803)', () => {
  it('should stay open when focus lands on the FocusScope container', async () => {
    const openLog: boolean[] = []
    const Harness = defineComponent({
      render() {
        return h(PopoverRoot, { 'onUpdate:open': (v: boolean) => openLog.push(v) }, {
          default: () => [
            h(PopoverTrigger, null, { default: () => 'open me' }),
            h(PopoverPortal, null, {
              default: () => [
                h(PopoverContent, null, { default: () => h('div', 'hello') }),
              ],
            }),
          ],
        })
      },
    })
    const wrapper = mount(Harness, { attachTo: document.body })
    await flushPromises()
    await wrapper.get('button').trigger('click')
    await vi.waitFor(() => expect(document.querySelector('[data-reka-popper-content-wrapper]')).not.toBeNull())
    await flushPromises()

    // `FocusScope` is rendered `asChild`, so its container resolves to the
    // popper wrapper, the parent of the `[data-dismissable-layer]` element.
    // With no tabbable candidates its mount auto-focus falls back to focusing
    // that container. jsdom refuses to focus a `tabindex`-less div, so mimic
    // the resulting `focusin` (happy-dom / real browsers with a focusable
    // wrapper would fire it natively).
    const focusScopeContainer = document.querySelector('[data-reka-popper-content-wrapper]')!
    expect(focusScopeContainer.querySelector('[data-dismissable-layer]')).not.toBeNull()
    focusScopeContainer.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    await flushPromises()

    expect(openLog).toEqual([true])
    expect(wrapper.get('button').attributes('aria-expanded')).toBe('true')
    wrapper.unmount()
  })
})

describe('given a Popover content wrapped in a Vue Transition', () => {
  afterEach(() => {
    vi.doUnmock('./PopoverContentNonModal.vue')
  })

  it('should run the enter and leave hooks on the content element when it opens cold', async () => {
    let releaseContent!: () => void
    const contentGate = new Promise<void>((resolve) => {
      releaseContent = resolve
    })
    vi.resetModules()
    vi.doMock('./PopoverContentNonModal.vue', async (importOriginal) => {
      await contentGate
      return importOriginal()
    })
    const { PopoverContent, PopoverRoot, PopoverTrigger } = await import('.')

    const open = ref(false)
    const onEnter = vi.fn((_el: Element, done: () => void) => done())
    const onLeave = vi.fn((_el: Element, done: () => void) => done())
    const wrapper = mount(defineComponent({
      setup: () => () => h(PopoverRoot, { open: open.value }, () => [
        h(PopoverTrigger, () => 'Trigger'),
        h(Transition, { onEnter, onLeave }, () => h(PopoverContent, () => 'Content')),
      ]),
    }), { attachTo: document.body, global: { stubs: { transition: false } } })

    open.value = true
    await flushPromises()
    expect(onEnter).not.toHaveBeenCalled()

    releaseContent()
    await vi.waitFor(() => expect(onEnter).toHaveBeenCalledOnce())
    expect(onEnter.mock.calls[0][0].querySelector('[role="dialog"]')).not.toBeNull()

    open.value = false
    await vi.waitFor(() => expect(onLeave).toHaveBeenCalledOnce())
    expect(onLeave.mock.calls[0][0].querySelector('[role="dialog"]')).not.toBeNull()

    wrapper.unmount()
  })
})
