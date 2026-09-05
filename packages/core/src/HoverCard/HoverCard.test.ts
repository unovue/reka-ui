import type { DOMWrapper, VueWrapper } from '@vue/test-utils'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, nextTick, ref } from 'vue'
import { sleep } from '@/test'
import { HoverCardContent, HoverCardRoot, HoverCardTrigger } from '.'
import HoverCard from './story/_HoverCard.vue'

describe('given a default HoverCard', () => {
  let wrapper: VueWrapper<InstanceType<typeof HoverCard>>
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  beforeEach(() => {
    wrapper = mount(HoverCard, { attachTo: document.body })
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  describe('after mouse enter for a 100ms', () => {
    it('should pass axe accessibility tests', async () => {
      await wrapper.find('a').trigger('mouseenter')
      await sleep(100)
      expect(await axe(document.body)).toHaveNoViolations()
    })
  })

  describe('a touch tap on the trigger', () => {
    it('should not open the hover card by default', async () => {
      await wrapper.find('a').trigger('pointerup', { pointerType: 'touch' })
      await sleep(100)
      expect(wrapper.find('a').attributes('data-state')).toBe('closed')
    })
  })

  // HoverCard mainly depends on Popper, test for Popper is not required here
})

describe('given a HoverCard with enableTouch', () => {
  let wrapper: VueWrapper<InstanceType<typeof HoverCard>>
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  beforeEach(() => {
    wrapper = mount(HoverCard, { props: { enableTouch: true }, attachTo: document.body })
  })

  it('should toggle open/closed on touch tap', async () => {
    const trigger = wrapper.find('a')

    await trigger.trigger('pointerup', { pointerType: 'touch' })
    await sleep(10)
    expect(trigger.attributes('data-state')).toBe('open')

    await trigger.trigger('pointerup', { pointerType: 'touch' })
    await sleep(10)
    expect(trigger.attributes('data-state')).toBe('closed')
  })

  it('should ignore non-touch pointers', async () => {
    const trigger = wrapper.find('a')

    await trigger.trigger('pointerup', { pointerType: 'mouse' })
    await sleep(10)
    expect(trigger.attributes('data-state')).toBe('closed')
  })

  it('should not reopen from a pending focus timer after closing on touch', async () => {
    const trigger = wrapper.find('a')

    // focus schedules a delayed open (openDelay), then a touch tap opens immediately
    await trigger.trigger('focus')
    await trigger.trigger('pointerup', { pointerType: 'touch' })
    await sleep(10)
    expect(trigger.attributes('data-state')).toBe('open')

    // closing must cancel the pending open timer so it doesn't reopen
    await trigger.trigger('pointerup', { pointerType: 'touch' })
    await sleep(150)
    expect(trigger.attributes('data-state')).toBe('closed')
  })
})

describe('hoverCardRoot change events (v3 foundation contract)', () => {
  // No Portal: keeps the content inside `wrapper` so DOM assertions stay local.
  const HoverCardWithModel = defineComponent({
    components: { HoverCardRoot, HoverCardTrigger, HoverCardContent },
    props: {
      onBeforeUpdateOpen: { type: Function, default: undefined },
    },
    setup() {
      return { open: ref(false) }
    },
    template: `
      <HoverCardRoot v-model:open="open" :open-delay="700" :close-delay="300" @before-update:open="onBeforeUpdateOpen">
        <HoverCardTrigger href="#">Trigger</HoverCardTrigger>
        <HoverCardContent>Content</HoverCardContent>
      </HoverCardRoot>
    `,
  })

  const mounted: VueWrapper<any>[] = []

  function mountHoverCard(props: Record<string, unknown> = {}) {
    const wrapper = mount(HoverCardWithModel, { props, attachTo: document.body })
    mounted.push(wrapper)
    const root = wrapper.findComponent(HoverCardRoot)
    const vm = wrapper.vm as unknown as { open: boolean }
    const trigger = () => wrapper.find('[data-grace-area-trigger]')
    // `DismissableLayer` is `as-child`, so its attribute lands on the content element itself.
    const content = () => wrapper.find('[data-dismissable-layer]')
    return { wrapper, root, vm, trigger, content }
  }

  // Hover, then let `openDelay` elapse. Two ticks: one for the open render, one
  // for the grace-area listeners that register once the content element exists.
  async function hoverOpen(trigger: () => DOMWrapper<Element>) {
    await trigger().trigger('pointerenter', { pointerType: 'mouse' })
    vi.advanceTimersByTime(700)
    await nextTick()
    await nextTick()
  }

  // Leave `element` at (0, 0), then move outside the grace area. Both rects are
  // empty in jsdom, so any point away from the origin exits the polygon.
  async function leaveAndExitGraceArea(element: DOMWrapper<Element>) {
    await element.trigger('pointerleave', { pointerType: 'mouse', clientX: 0, clientY: 0 })
    document.body.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 100, clientY: 100 }))
    await nextTick()
  }

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    document.body.innerHTML = ''
  })

  // Unmount (not just clear the DOM) so each layer leaves the shared
  // DismissableLayer stack and Escape keeps routing to the right hover card.
  afterEach(() => {
    mounted.splice(0).forEach(w => w.unmount())
    vi.useRealTimers()
  })

  it('emits beforeUpdate:open then update:open with (value, details) once openDelay elapses after a hover', async () => {
    const { root, trigger, content } = mountHoverCard()
    await trigger().trigger('pointerenter', { pointerType: 'mouse' })
    vi.advanceTimersByTime(699)
    await nextTick()
    // Timer has not fired yet: nothing emitted, still closed.
    expect(root.emitted('beforeUpdate:open')).toBeUndefined()
    expect(trigger().attributes('data-state')).toBe('closed')

    vi.advanceTimersByTime(1)
    await nextTick()

    const keys = Object.keys(root.emitted()).filter(k => k.endsWith(':open'))
    expect(keys).toEqual(['beforeUpdate:open', 'update:open'])
    const [beforeValue, beforeDetails] = root.emitted('beforeUpdate:open')![0]
    const [value, details] = root.emitted('update:open')![0]
    expect(beforeValue).toBe(true)
    expect(value).toBe(true)
    expect(beforeDetails).toBe(details)
    expect(details).toMatchObject({ reason: 'trigger-hover', isCanceled: false })
    expect(details.event).toBeInstanceOf(Event)
    expect(details.event.type).toBe('pointerenter')
    expect(typeof details.cancel).toBe('function')
    expect(trigger().attributes('data-state')).toBe('open')
    expect(content().exists()).toBe(true)
  })

  it('reports reason "trigger-leave" after closeDelay when the pointer leaves the trigger and the grace area', async () => {
    const { root, vm, trigger, content } = mountHoverCard()
    await hoverOpen(trigger)
    expect(vm.open).toBe(true)

    await leaveAndExitGraceArea(trigger())
    // The close is deferred by `closeDelay`.
    expect(root.emitted('update:open')).toHaveLength(1)
    vi.advanceTimersByTime(300)
    // Presence resolves the exit after its own `nextTick`; flush so the content is gone.
    await flushPromises()

    const [value, details] = root.emitted('update:open')![1]
    expect(value).toBe(false)
    expect(details).toMatchObject({ reason: 'trigger-leave' })
    expect(details.event.type).toBe('pointerleave')
    expect(vm.open).toBe(false)
    expect(trigger().attributes('data-state')).toBe('closed')
    expect(content().exists()).toBe(false)
  })

  it('reports reason "content-leave" when the pointer last left the content before exiting the grace area', async () => {
    const { root, vm, trigger, content } = mountHoverCard()
    await hoverOpen(trigger)

    // Trigger -> content (inside the grace area), then content -> away.
    await trigger().trigger('pointerleave', { pointerType: 'mouse', clientX: 0, clientY: 0 })
    await content().trigger('pointerenter', { pointerType: 'mouse' })
    await leaveAndExitGraceArea(content())
    vi.advanceTimersByTime(300)
    await flushPromises()

    const [value, details] = root.emitted('update:open')![1]
    expect(value).toBe(false)
    expect(details).toMatchObject({ reason: 'content-leave' })
    expect(details.event.type).toBe('pointerleave')
    expect(vm.open).toBe(false)
  })

  it('reports reason "trigger-focus" once openDelay elapses after focus', async () => {
    const { root, vm, trigger } = mountHoverCard()
    await trigger().trigger('focus')
    expect(root.emitted('update:open')).toBeUndefined()

    vi.advanceTimersByTime(700)
    await nextTick()

    const [value, details] = root.emitted('update:open')![0]
    expect(value).toBe(true)
    expect(details).toMatchObject({ reason: 'trigger-focus' })
    expect(details.event).toBeInstanceOf(FocusEvent)
    expect(vm.open).toBe(true)
  })

  it('reports reason "trigger-blur" after closeDelay when the trigger blurs', async () => {
    const { root, vm, trigger } = mountHoverCard()
    await trigger().trigger('focus')
    vi.advanceTimersByTime(700)
    await nextTick()

    await trigger().trigger('blur')
    vi.advanceTimersByTime(300)
    await flushPromises()

    const [value, details] = root.emitted('update:open')![1]
    expect(value).toBe(false)
    expect(details).toMatchObject({ reason: 'trigger-blur' })
    expect(details.event).toBeInstanceOf(FocusEvent)
    expect(vm.open).toBe(false)
  })

  it('reports reason "escape-key" when Escape dismisses the hover card', async () => {
    const { root, vm, trigger, content } = mountHoverCard()
    await hoverOpen(trigger)
    expect(content().exists()).toBe(true)

    await content().trigger('keydown', { key: 'Escape' })
    await flushPromises()

    const [value, details] = root.emitted('update:open')![1]
    expect(value).toBe(false)
    expect(details).toMatchObject({ reason: 'escape-key' })
    expect(details.event).toBeInstanceOf(KeyboardEvent)
    expect(vm.open).toBe(false)
    expect(content().exists()).toBe(false)
  })

  it('details.cancel() in @before-update:open keeps the current state and skips update:open', async () => {
    const onBeforeUpdateOpen = vi.fn((_value: boolean, details: { cancel: () => void }) => details.cancel())
    const { root, vm, trigger, content } = mountHoverCard({ onBeforeUpdateOpen })
    await hoverOpen(trigger)

    expect(onBeforeUpdateOpen).toHaveBeenCalledTimes(1)
    expect(onBeforeUpdateOpen.mock.calls[0][1]).toMatchObject({ reason: 'trigger-hover', isCanceled: true })
    expect(root.emitted('update:open')).toBeUndefined()
    expect(vm.open).toBe(false)
    expect(trigger().attributes('data-state')).toBe('closed')

    // The open was cancelled: force the model open directly, then cancel a close.
    vm.open = true
    await nextTick()
    await nextTick()
    expect(content().exists()).toBe(true)
    onBeforeUpdateOpen.mockClear()

    await trigger().trigger('blur')
    vi.advanceTimersByTime(300)
    await flushPromises()

    expect(onBeforeUpdateOpen).toHaveBeenCalledTimes(1)
    expect(onBeforeUpdateOpen.mock.calls[0][1]).toMatchObject({ reason: 'trigger-blur', isCanceled: true })
    expect(root.emitted('beforeUpdate:open')).toHaveLength(2)
    expect(root.emitted('update:open')).toBeUndefined()
    expect(vm.open).toBe(true)
    expect(trigger().attributes('data-state')).toBe('open')
    expect(content().exists()).toBe(true)
  })

  it('v-model:open round-trips through a wrapper component', async () => {
    const { root, vm, trigger, content } = mountHoverCard()
    expect(vm.open).toBe(false)
    expect(trigger().attributes('data-state')).toBe('closed')

    await hoverOpen(trigger)
    expect(vm.open).toBe(true)
    expect(trigger().attributes('data-state')).toBe('open')
    expect(content().exists()).toBe(true)

    await trigger().trigger('blur')
    vi.advanceTimersByTime(300)
    // Presence resolves the exit after its own `nextTick`; flush so the content is gone.
    await flushPromises()
    expect(vm.open).toBe(false)
    expect(trigger().attributes('data-state')).toBe('closed')
    expect(content().exists()).toBe(false)

    // Parent-driven change: the prop wins and nothing is emitted for it.
    vm.open = true
    await nextTick()
    expect(trigger().attributes('data-state')).toBe('open')
    expect(root.emitted('update:open')).toHaveLength(2)
  })
})
