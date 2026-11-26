import type { VueWrapper } from '@vue/test-utils'
import type { ChangeEventDetails } from '@/shared'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, nextTick, ref, Transition } from 'vue'
import { PopoverClose, PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from '.'
import Popover from './story/_Popover.vue'

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

    expect(document.getElementById(trigger.attributes('aria-controls')!)).not.toBeNull()
  })

  describe('after opening popover', async () => {
    beforeEach(async () => {
      wrapper.find('button').element.click()
      await nextTick()
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

describe('popoverRoot change events (v3 foundation contract)', () => {
  // No Portal: keeps the content inside `wrapper` so DOM assertions stay local.
  const PopoverWithModel = defineComponent({
    components: { PopoverRoot, PopoverTrigger, PopoverContent, PopoverClose },
    props: {
      onBeforeUpdateOpen: { type: Function, default: undefined },
    },
    setup() {
      return { open: ref(false) }
    },
    template: `
      <PopoverRoot v-model:open="open" @before-update:open="onBeforeUpdateOpen">
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>
          Content
          <PopoverClose>Close</PopoverClose>
        </PopoverContent>
      </PopoverRoot>
    `,
  })

  const mounted: VueWrapper<any>[] = []

  function mountPopover(props: Record<string, unknown> = {}) {
    const wrapper = mount(PopoverWithModel, { props, attachTo: document.body })
    mounted.push(wrapper)
    const root = wrapper.findComponent(PopoverRoot)
    const vm = wrapper.vm as unknown as { open: boolean }
    const trigger = () => wrapper.find<HTMLElement>('[aria-haspopup="dialog"]')
    const close = () => wrapper.find<HTMLElement>('[role="dialog"] button')
    return { wrapper, root, vm, trigger, close }
  }

  beforeEach(() => {
    document.body.innerHTML = ''
  })

  // Unmount (not just clear the DOM) so each layer leaves the shared
  // DismissableLayer stack and Escape keeps routing to the right popover.
  afterEach(() => {
    mounted.splice(0).forEach(w => w.unmount())
  })

  it('emits beforeUpdate:open then update:open with (value, details) on trigger click', async () => {
    const { root, trigger } = mountPopover()
    trigger().element.click()
    await nextTick()

    const keys = Object.keys(root.emitted()).filter(k => k.endsWith(':open'))
    expect(keys).toEqual(['beforeUpdate:open', 'update:open'])
    const [beforeValue, beforeDetails] = root.emitted<[boolean, ChangeEventDetails]>('beforeUpdate:open')![0]
    const [value, details] = root.emitted<[boolean, ChangeEventDetails]>('update:open')![0]
    expect(beforeValue).toBe(true)
    expect(value).toBe(true)
    expect(beforeDetails).toBe(details)
    expect(details).toMatchObject({ reason: 'trigger-press', isCanceled: false })
    expect(details.event).toBeInstanceOf(MouseEvent)
    expect(typeof details.cancel).toBe('function')
  })

  it('reports reason "escape-key" when Escape closes the popover', async () => {
    const { wrapper, root, vm, trigger } = mountPopover()
    trigger().element.click()
    await nextTick()
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)

    await wrapper.find('[role="dialog"]').trigger('keydown', { key: 'Escape' })
    await nextTick()

    const [value, details] = root.emitted<[boolean, ChangeEventDetails]>('update:open')![1]
    expect(value).toBe(false)
    expect(details).toMatchObject({ reason: 'escape-key' })
    expect(details.event).toBeInstanceOf(KeyboardEvent)
    expect(vm.open).toBe(false)
  })

  it('reports reason "close-press" when PopoverClose is clicked', async () => {
    const { wrapper, root, trigger, close } = mountPopover()
    trigger().element.click()
    await nextTick()

    close().element.click()
    // Presence resolves the exit after its own `nextTick`; flush so the content is gone.
    await flushPromises()

    const [value, details] = root.emitted<[boolean, ChangeEventDetails]>('update:open')![1]
    expect(value).toBe(false)
    expect(details).toMatchObject({ reason: 'close-press' })
    expect(details.event).toBeInstanceOf(MouseEvent)
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('details.cancel() in @before-update:open keeps the popover open and skips update:open', async () => {
    const onBeforeUpdateOpen = vi.fn((_value: boolean, details: { cancel: () => void }) => details.cancel())
    const { wrapper, root, vm, trigger, close } = mountPopover({ onBeforeUpdateOpen })
    trigger().element.click()
    await nextTick()
    // The open transition was cancelled too: force the model open directly.
    expect(onBeforeUpdateOpen).toHaveBeenCalledTimes(1)
    expect(root.emitted('update:open')).toBeUndefined()
    vm.open = true
    await nextTick()
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
    onBeforeUpdateOpen.mockClear()

    close().element.click()
    // Presence resolves the exit after its own `nextTick`; flush so the content is gone.
    await flushPromises()

    expect(onBeforeUpdateOpen).toHaveBeenCalledTimes(1)
    expect(onBeforeUpdateOpen.mock.calls[0][1]).toMatchObject({ reason: 'close-press', isCanceled: true })
    expect(root.emitted('beforeUpdate:open')).toHaveLength(2)
    expect(root.emitted('update:open')).toBeUndefined()
    expect(vm.open).toBe(true)
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
    expect(trigger().attributes('data-popup-open')).toBe('')
  })

  it('v-model:open round-trips through a wrapper component', async () => {
    const { wrapper, root, vm, trigger, close } = mountPopover()
    expect(vm.open).toBe(false)
    expect(trigger().attributes('data-popup-open')).toBeUndefined()

    trigger().element.click()
    await nextTick()
    expect(vm.open).toBe(true)
    expect(trigger().attributes('data-popup-open')).toBe('')
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)

    close().element.click()
    // Presence resolves the exit after its own `nextTick`; flush so the content is gone.
    await flushPromises()
    expect(vm.open).toBe(false)
    expect(trigger().attributes('data-popup-open')).toBeUndefined()
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)

    // Parent-driven change: the prop wins and nothing is emitted for it.
    vm.open = true
    await nextTick()
    expect(trigger().attributes('data-popup-open')).toBe('')
    expect(root.emitted('update:open')).toHaveLength(2)
  })

  it('slot `close` closes with the default "imperative-action" reason', async () => {
    const wrapper = mount(defineComponent({
      components: { PopoverRoot, PopoverTrigger },
      template: `
        <PopoverRoot :default-open="true" v-slot="{ open, close }">
          <PopoverTrigger>{{ open }}</PopoverTrigger>
          <button data-testid="slot-close" @click="close()">slot close</button>
        </PopoverRoot>
      `,
    }), { attachTo: document.body })
    mounted.push(wrapper)
    const root = wrapper.findComponent(PopoverRoot)
    expect(wrapper.find('[aria-haspopup="dialog"]').text()).toBe('true')

    wrapper.find<HTMLElement>('[data-testid="slot-close"]').element.click()
    await nextTick()

    const [value, details] = root.emitted<[boolean, ChangeEventDetails]>('update:open')![0]
    expect(value).toBe(false)
    expect(details).toMatchObject({ reason: 'imperative-action' })
    expect(details.event).toBeUndefined()
    expect(wrapper.find('[aria-haspopup="dialog"]').text()).toBe('false')
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
      // v3 exposes the element as a ref (`element`), released to `null` once the content is closed.
      expect(exposed.element.value.contains(document.querySelector('[role="dialog"]'))).toBe(true)

      open.value = false
      await flushPromises()
      expect(document.querySelector('[role="dialog"]')).toBeNull()
      expect(content.vm.$.isUnmounted).toBe(false)
      expect(exposed.element.value).toBeNull()
    }

    wrapper.unmount()
  })
})

describe.each([true, false])('given a Popover with unmountOnHide and modal=%s', (modal) => {
  function mountPopover(rootProps: Record<string, unknown>) {
    const open = ref(false)
    const wrapper = mount(defineComponent({
      setup: () => () => h(PopoverRoot, { 'open': open.value, 'onUpdate:open': (value: boolean) => open.value = value, modal, ...rootProps }, () => [
        h(PopoverTrigger, () => 'Open'),
        h(PopoverPortal, null, () => h(PopoverContent, { 'data-testid': 'content' }, () => 'Content')),
      ]),
    }), { attachTo: document.body })
    onTestFinished(() => wrapper.unmount())
    const content = () => document.querySelector<HTMLElement>('[data-testid="content"]')
    // `v-show` hides the wrapper element that positions the content.
    const isShown = () => content()?.parentElement?.style.display !== 'none'
    return { open, content, isShown }
  }

  it('should keep the content in the DOM, hidden, while closed when unmountOnHide=false', async () => {
    const { open, content, isShown } = mountPopover({ unmountOnHide: false })
    await vi.waitFor(() => expect(content()).not.toBeNull())
    expect(isShown()).toBe(false)
    expect(content()!.getAttribute('data-state')).toBe('closed')

    open.value = true
    await vi.waitFor(() => expect(isShown()).toBe(true))
    expect(content()!.getAttribute('data-state')).toBe('open')

    open.value = false
    await vi.waitFor(() => expect(isShown()).toBe(false))
    expect(content()).not.toBeNull()
  })

  it('should unmount the content on close by default', async () => {
    const { open, content } = mountPopover({})
    await flushPromises()
    expect(content()).toBeNull()

    open.value = true
    await vi.waitFor(() => expect(content()).not.toBeNull())
    expect(content()!.parentElement!.style.display).not.toBe('none')

    open.value = false
    await vi.waitFor(() => expect(content()).toBeNull())
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
  // TODO(v3-port): #3060 an `id` on the asChild child is not adopted by the trigger: the shared part-id
  // code (`usePartId`, core lane) only reads the part's own `id` prop
  it.skip('points content aria-labelledby at the id the trigger actually renders', async () => {
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

  it.each(cases)('should leave focus alone when closeAutoFocus is only prevented with modal=$modal closing by $by', async ({ modal, by }) => {
    const { wrapper, counts } = setup(modal, event => event.preventDefault())

    await open(wrapper)
    expect(document.activeElement).toBe(document.getElementById('inside'))
    await close(wrapper, by)
    expect(counts.closeAutoFocus).toBe(1)
    // Nothing restores focus, so it falls back to the body once the content is removed
    expect(document.activeElement).toBe(document.body)
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
})

describe.each([true, false])('given an open Popover whose unmountOnHide changes with modal=%s', (modal) => {
  it('should keep the content mounted, with its state', async () => {
    const unmountOnHide = ref(true)
    const open = ref(true)
    const wrapper = mount(defineComponent({
      setup: () => () => h(PopoverRoot, { open: open.value, modal, unmountOnHide: unmountOnHide.value }, () => [
        h(PopoverTrigger, () => 'Open'),
        h(PopoverContent, null, () => [
          h('input', { 'data-testid': 'field' }),
        ]),
      ]),
    }), { attachTo: document.body })
    onTestFinished(() => wrapper.unmount())
    const field = () => document.querySelector<HTMLInputElement>('[data-testid="field"]')
    await vi.waitFor(() => expect(field()).not.toBeNull())
    const input = field()!
    input.value = 'typed'

    for (const value of [false, true]) {
      unmountOnHide.value = value
      await flushPromises()
      expect(field()).toBe(input)
      expect(input.value).toBe('typed')
      expect(input.closest('[data-reka-popper-content-wrapper]')!.matches('[style*="display: none"]')).toBe(false)
    }

    // Kept mounted from now on: hidden on close, and shown again on open
    unmountOnHide.value = false
    await flushPromises()
    open.value = false
    await vi.waitFor(() => expect(input.closest('[data-reka-popper-content-wrapper]')!.matches('[style*="display: none"]')).toBe(true))
    open.value = true
    await vi.waitFor(() => expect(input.closest('[data-reka-popper-content-wrapper]')!.matches('[style*="display: none"]')).toBe(false))
    expect(field()).toBe(input)
    expect(input.value).toBe('typed')
  })
})

describe.each([true, false])('given a kept-mounted Popover content wrapped in a Vue Transition with modal=%s', (modal) => {
  function setup(rootProps: { open: boolean, unmountOnHide: boolean }, transitionProps: Record<string, unknown>) {
    const root = ref(rootProps)
    const wrapper = mount(defineComponent({
      setup: () => () => h(PopoverRoot, { ...root.value, modal }, () => [
        h(PopoverTrigger, () => 'Open'),
        h(Transition, transitionProps, () => h(PopoverContent, { 'data-testid': 'kept' }, () => 'Content')),
      ]),
    }), { attachTo: document.body, global: { stubs: { transition: false } } })
    onTestFinished(() => wrapper.unmount())
    const element = () => document.querySelector<HTMLElement>('[data-testid="kept"]')
    const isShown = () => !element()!.closest('[style*="display: none"]')
    return { root, element, isShown }
  }

  it('should run the appear hook once when it mounts open', async () => {
    const onEnter = vi.fn((_el: Element, done: () => void) => done())
    const { element } = setup({ open: true, unmountOnHide: false }, { appear: true, onEnter })
    await vi.waitFor(() => expect(element()).not.toBeNull())
    await flushPromises()
    expect(onEnter).toHaveBeenCalledOnce()
  })

  it('should stay shown when reopened during its leave as unmountOnHide becomes true', async () => {
    let finishLeave: (() => void) | undefined
    const { root, element, isShown } = setup({ open: true, unmountOnHide: false }, {
      onEnter: (_el: Element, done: () => void) => done(),
      onLeave: (_el: Element, done: () => void) => finishLeave = done,
    })
    await vi.waitFor(() => expect(element()).not.toBeNull())
    await flushPromises()

    root.value = { open: false, unmountOnHide: false }
    await vi.waitFor(() => expect(finishLeave).toBeDefined())
    root.value = { open: true, unmountOnHide: true }
    await flushPromises()
    finishLeave!()
    await flushPromises()
    expect(element()).not.toBeNull()
    expect(isShown()).toBe(true)
  })
})
