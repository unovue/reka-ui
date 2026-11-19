import type { VueWrapper } from '@vue/test-utils'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest'
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
    // Unmount even when an assertion fails, so a failure cannot leak into later tests.
    onTestFinished(() => wrapper.unmount())
    await flushPromises()

    const trigger = wrapper.get('button')
    expect(trigger.attributes('id')).toBe('my-trigger')

    await trigger.trigger('click')
    await flushPromises()

    const content = document.querySelector('[role="dialog"]')!
    expect(content.getAttribute('aria-labelledby')).toBe('my-trigger')
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
    // Unmount even when an assertion fails, so a failure cannot leak into later tests.
    onTestFinished(() => wrapper.unmount())
    await flushPromises()

    const trigger = wrapper.get('button')
    expect(trigger.attributes('id')).toBe('child-trigger')

    await trigger.trigger('click')
    await flushPromises()

    const content = document.querySelector('[role="dialog"]')!
    expect(content.getAttribute('aria-labelledby')).toBe('child-trigger')
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

describe('given a Popover with content event listeners', () => {
  type CloseBy = 'Escape' | 'outside click' | 'trigger click'

  function setup(modal: boolean, onCloseAutoFocus?: (event: Event) => void) {
    const counts = { openAutoFocus: 0, closeAutoFocus: 0, escapeKeyDown: 0, pointerDownOutside: 0, interactOutside: 0, focusOutside: 0 }
    const wrapper = mount(defineComponent({
      setup: () => () => h('div', [
        h('button', { id: 'elsewhere' }, 'Elsewhere'),
        h(PopoverRoot, { modal }, () => [
          h(PopoverTrigger, { id: 'trigger' }, () => 'Open'),
          h(PopoverPortal, null, () => h(PopoverContent, {
            onOpenAutoFocus: () => counts.openAutoFocus++,
            onCloseAutoFocus: (event: Event) => {
              counts.closeAutoFocus++
              onCloseAutoFocus?.(event)
            },
            onEscapeKeyDown: () => counts.escapeKeyDown++,
            onPointerDownOutside: () => counts.pointerDownOutside++,
            onInteractOutside: () => counts.interactOutside++,
            onFocusOutside: () => counts.focusOutside++,
          }, () => h('input', { id: 'inside' }))),
        ]),
      ]),
    }), { attachTo: document.body })
    // Unmount even when an assertion fails, so a failure cannot leak into later tests.
    onTestFinished(() => wrapper.unmount())
    return { wrapper, counts }
  }

  async function open(wrapper: VueWrapper) {
    const trigger = wrapper.get('#trigger')
    ;(trigger.element as HTMLElement).focus()
    await trigger.trigger('click')
    await vi.waitFor(() => expect(document.querySelector('[role="dialog"]')).not.toBeNull())
    await flushPromises()
  }

  async function close(wrapper: VueWrapper, by: CloseBy) {
    if (by === 'Escape') {
      document.querySelector('[role="dialog"]')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    }
    else if (by === 'outside click') {
      // The outside pointerdown listener is registered on the next macrotask
      await new Promise(resolve => setTimeout(resolve))
      document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0 }))
    }
    else {
      await wrapper.get('#trigger').trigger('click')
    }
    await vi.waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull())
    await flushPromises()
  }

  const cases = [true, false].flatMap(modal =>
    (['Escape', 'outside click', 'trigger click'] as CloseBy[])
      // A modal popover makes everything outside inert, so its trigger cannot be clicked
      .filter(by => !(modal && by === 'trigger click'))
      .map(by => ({ modal, by })),
  )

  it.each(cases)('should emit each auto focus event once per open and close with modal=$modal closing by $by', async ({ modal, by }) => {
    const { wrapper, counts } = setup(modal)

    for (let cycle = 1; cycle <= 2; cycle++) {
      await open(wrapper)
      expect(counts.openAutoFocus).toBe(cycle)
      expect(counts.closeAutoFocus).toBe(cycle - 1)

      await close(wrapper, by)
      expect(counts.openAutoFocus).toBe(cycle)
      expect(counts.closeAutoFocus).toBe(cycle)
    }
  })

  it.each([true, false])('should emit each dismiss event once with modal=%s', async (modal) => {
    const { wrapper, counts } = setup(modal)

    await open(wrapper)
    await close(wrapper, 'outside click')
    expect(counts).toMatchObject({ pointerDownOutside: 1, interactOutside: 1, escapeKeyDown: 0 })

    await open(wrapper)
    await close(wrapper, 'Escape')
    expect(counts).toMatchObject({ pointerDownOutside: 1, interactOutside: 1, escapeKeyDown: 1 })
  })

  it.each([true, false])('should return focus to the trigger on close with modal=%s', async (modal) => {
    const { wrapper } = setup(modal)

    await open(wrapper)
    await close(wrapper, 'Escape')
    expect(document.activeElement).toBe(wrapper.get('#trigger').element)
  })

  it.each([true, false])('should not return focus to the trigger when closeAutoFocus is prevented with modal=%s', async (modal) => {
    const { wrapper, counts } = setup(modal, (event) => {
      event.preventDefault()
      document.getElementById('elsewhere')!.focus()
    })

    await open(wrapper)
    await close(wrapper, 'Escape')
    expect(counts.closeAutoFocus).toBe(1)
    expect(document.activeElement).toBe(document.getElementById('elsewhere'))
  })

  // A modal popover returns focus to its trigger unless focus has already moved elsewhere,
  // so preventing the event alone is only covered for the non-modal one.
  it('should leave focus alone when closeAutoFocus is only prevented with modal=false', async () => {
    const { wrapper, counts } = setup(false, event => event.preventDefault())

    await open(wrapper)
    expect(document.activeElement).toBe(document.getElementById('inside'))
    await close(wrapper, 'Escape')
    expect(counts.closeAutoFocus).toBe(1)
    expect(document.activeElement).not.toBe(wrapper.get('#trigger').element)
  })

  it.each([true, false])('should emit closeAutoFocus once when an open content is unmounted with modal=%s', async (modal) => {
    const { wrapper, counts } = setup(modal)

    await open(wrapper)
    wrapper.unmount()
    await flushPromises()
    expect(counts.closeAutoFocus).toBe(1)
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
