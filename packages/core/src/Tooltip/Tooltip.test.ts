import type { VueWrapper } from '@vue/test-utils'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, nextTick, ref } from 'vue'
import { TooltipContent, TooltipProvider, TooltipRoot, TooltipTrigger } from '.'
import Tooltip from './stories/_Tooltip.vue'

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

// `data-state` is the disclosure axis only (`open` | `closed`, #2823); whether the
// open was delayed is a separate boolean qualifier, `data-delayed`.
describe('given tooltip data-state / data-delayed contract', () => {
  let wrapper: VueWrapper<InstanceType<typeof Tooltip>>

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    document.body.innerHTML = ''
    wrapper = mount(Tooltip, {
      global: { stubs: { teleport: { template: '<div><slot /></div>' } } },
      attachTo: document.body,
      props: { tooltipProvider: { delayDuration: 700 } },
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('is `closed` without `data-delayed` initially', () => {
    const trigger = wrapper.find('button')
    expect(trigger.attributes('data-state')).toBe('closed')
    expect(trigger.attributes('data-delayed')).toBeUndefined()
  })

  it('is `open` without `data-delayed` after an instant open (focus)', async () => {
    const trigger = wrapper.find('button')
    await trigger.trigger('focus')
    await nextTick()

    expect(trigger.attributes('data-state')).toBe('open')
    expect(trigger.attributes('data-delayed')).toBeUndefined()
    const content = wrapper.find('[data-state="open"]:not(button)')
    expect(content.exists()).toBe(true)
    expect(content.attributes('data-delayed')).toBeUndefined()
  })

  it('is `open` with `data-delayed=""` after a delayed open (pointer + timer)', async () => {
    const trigger = wrapper.find('button')
    await trigger.trigger('pointermove', { pointerType: 'mouse' })
    await nextTick()
    // Timer has not fired yet: still closed, no qualifier.
    expect(trigger.attributes('data-state')).toBe('closed')
    expect(trigger.attributes('data-delayed')).toBeUndefined()

    vi.advanceTimersByTime(700)
    await nextTick()
    await nextTick()

    expect(trigger.attributes('data-state')).toBe('open')
    expect(trigger.attributes('data-delayed')).toBe('')
    const content = wrapper.find('[data-state="open"]:not(button)')
    expect(content.exists()).toBe(true)
    expect(content.attributes('data-delayed')).toBe('')
  })

  it('drops `data-delayed` again once closed', async () => {
    const trigger = wrapper.find('button')
    await trigger.trigger('pointermove', { pointerType: 'mouse' })
    vi.advanceTimersByTime(700)
    await nextTick()
    expect(trigger.attributes('data-delayed')).toBe('')

    await trigger.trigger('blur')
    await nextTick()
    expect(trigger.attributes('data-state')).toBe('closed')
    expect(trigger.attributes('data-delayed')).toBeUndefined()
  })
})

describe('tooltipRoot change events (v3 foundation contract)', () => {
  // No Portal: keeps the content inside `wrapper` so DOM assertions stay local.
  const TooltipWithModel = defineComponent({
    components: { TooltipProvider, TooltipRoot, TooltipTrigger, TooltipContent },
    props: {
      disableHoverableContent: { type: Boolean, default: false },
      onBeforeUpdateOpen: { type: Function, default: undefined },
    },
    setup() {
      return { open: ref(false) }
    },
    template: `
      <TooltipProvider :delay-duration="700" :disable-hoverable-content="disableHoverableContent">
        <TooltipRoot v-model:open="open" @before-update:open="onBeforeUpdateOpen">
          <TooltipTrigger>Trigger</TooltipTrigger>
          <TooltipContent>Content</TooltipContent>
        </TooltipRoot>
      </TooltipProvider>
    `,
  })

  const mounted: VueWrapper<any>[] = []

  function mountTooltip(props: Record<string, unknown> = {}) {
    const wrapper = mount(TooltipWithModel, { props, attachTo: document.body })
    mounted.push(wrapper)
    const root = wrapper.findComponent(TooltipRoot)
    const vm = wrapper.vm as unknown as { open: boolean }
    const trigger = () => wrapper.find('button')
    const content = () => wrapper.find('[role="tooltip"]')
    return { wrapper, root, vm, trigger, content }
  }

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    document.body.innerHTML = ''
  })

  // Unmount (not just clear the DOM) so each layer leaves the shared
  // DismissableLayer stack and Escape keeps routing to the right tooltip.
  afterEach(() => {
    mounted.splice(0).forEach(w => w.unmount())
    vi.useRealTimers()
  })

  it('emits beforeUpdate:open then update:open with (value, details) on a delayed hover open', async () => {
    const { root, trigger } = mountTooltip()
    await trigger().trigger('pointermove', { pointerType: 'mouse' })
    // Timer has not fired yet: nothing emitted.
    expect(root.emitted('beforeUpdate:open')).toBeUndefined()
    expect(root.emitted('update:open')).toBeUndefined()

    vi.advanceTimersByTime(700)
    await nextTick()
    await nextTick()

    expect(root.emitted('beforeUpdate:open')).toHaveLength(1)
    expect(root.emitted('update:open')).toHaveLength(1)
    const [beforeValue, beforeDetails] = root.emitted('beforeUpdate:open')![0]
    const [value, details] = root.emitted('update:open')![0]
    expect(beforeValue).toBe(true)
    expect(beforeDetails).toMatchObject({ reason: 'trigger-hover' })
    expect(value).toBe(true)
    expect(details).toMatchObject({ reason: 'trigger-hover', isCanceled: false })
    // The `pointermove` that armed the timer travels with the delayed open.
    expect(details.event).toBeInstanceOf(Event)
    expect(details.event.type).toBe('pointermove')
    expect(typeof details.cancel).toBe('function')
    expect(trigger().attributes('data-state')).toBe('open')
    expect(trigger().attributes('data-delayed')).toBe('')
  })

  it('reports reason "trigger-focus" when focus opens the tooltip', async () => {
    const { root, vm, trigger } = mountTooltip()
    await trigger().trigger('focus')
    await nextTick()

    const [value, details] = root.emitted('update:open')![0]
    expect(value).toBe(true)
    expect(details).toMatchObject({ reason: 'trigger-focus', isCanceled: false })
    expect(details.event).toBeInstanceOf(Event)
    expect(details.event.type).toBe('focus')
    expect(vm.open).toBe(true)
    expect(trigger().attributes('data-delayed')).toBeUndefined()
  })

  it('reports reason "trigger-press" when clicking the trigger closes the tooltip', async () => {
    const { root, vm, trigger } = mountTooltip()
    await trigger().trigger('focus')
    await nextTick()
    expect(vm.open).toBe(true)

    await trigger().trigger('click')
    await nextTick()

    const [value, details] = root.emitted('update:open')![1]
    expect(value).toBe(false)
    expect(details).toMatchObject({ reason: 'trigger-press' })
    expect(details.event).toBeInstanceOf(MouseEvent)
    expect(vm.open).toBe(false)
  })

  it('reports reason "trigger-blur" when the trigger loses focus', async () => {
    const { root, vm, trigger } = mountTooltip()
    await trigger().trigger('focus')
    await nextTick()

    await trigger().trigger('blur')
    await nextTick()

    const [value, details] = root.emitted('update:open')![1]
    expect(value).toBe(false)
    expect(details).toMatchObject({ reason: 'trigger-blur' })
    expect(details.event.type).toBe('blur')
    expect(vm.open).toBe(false)
  })

  it('reports reason "trigger-leave" when the pointer leaves a trigger without hoverable content', async () => {
    const { root, vm, trigger } = mountTooltip({ disableHoverableContent: true })
    await trigger().trigger('pointermove', { pointerType: 'mouse' })
    vi.advanceTimersByTime(700)
    await nextTick()
    await nextTick()
    expect(vm.open).toBe(true)

    await trigger().trigger('pointerleave')
    await nextTick()

    const [value, details] = root.emitted('update:open')![1]
    expect(value).toBe(false)
    expect(details).toMatchObject({ reason: 'trigger-leave' })
    expect(details.event).toBeInstanceOf(Event)
    expect(details.event.type).toBe('pointerleave')
    expect(vm.open).toBe(false)
  })

  it('only cancels the pending delayed open when the pointer leaves a hoverable trigger', async () => {
    const { root, vm, trigger } = mountTooltip()
    await trigger().trigger('pointermove', { pointerType: 'mouse' })
    await trigger().trigger('pointerleave')
    vi.advanceTimersByTime(700)
    await nextTick()
    await nextTick()

    expect(root.emitted('beforeUpdate:open')).toBeUndefined()
    expect(root.emitted('update:open')).toBeUndefined()
    expect(vm.open).toBe(false)
  })

  it('reports reason "escape-key" when Escape closes the tooltip', async () => {
    const { root, vm, trigger, content } = mountTooltip()
    await trigger().trigger('focus')
    await nextTick()
    expect(content().exists()).toBe(true)

    await trigger().trigger('keydown', { key: 'Escape' })
    await nextTick()

    const [value, details] = root.emitted('update:open')![1]
    expect(value).toBe(false)
    expect(details).toMatchObject({ reason: 'escape-key' })
    expect(details.event).toBeInstanceOf(KeyboardEvent)
    expect(vm.open).toBe(false)
  })

  it('details.cancel() in @before-update:open keeps the tooltip closed and skips update:open', async () => {
    const onBeforeUpdateOpen = vi.fn((_value: boolean, details: { cancel: () => void }) => details.cancel())
    const { root, vm, trigger, content } = mountTooltip({ onBeforeUpdateOpen })
    await trigger().trigger('pointermove', { pointerType: 'mouse' })
    vi.advanceTimersByTime(700)
    await nextTick()
    await nextTick()

    expect(onBeforeUpdateOpen).toHaveBeenCalledTimes(1)
    expect(onBeforeUpdateOpen.mock.calls[0][0]).toBe(true)
    expect(onBeforeUpdateOpen.mock.calls[0][1]).toMatchObject({ reason: 'trigger-hover', isCanceled: true })
    expect(root.emitted('beforeUpdate:open')).toHaveLength(1)
    expect(root.emitted('update:open')).toBeUndefined()
    expect(vm.open).toBe(false)
    expect(trigger().attributes('data-state')).toBe('closed')
    expect(trigger().attributes('data-delayed')).toBeUndefined()
    expect(content().exists()).toBe(false)

    // A cancelled delayed open must not leave the "delayed" flag behind: a later
    // parent-driven open is not a delayed one.
    vm.open = true
    await nextTick()
    expect(trigger().attributes('data-state')).toBe('open')
    expect(trigger().attributes('data-delayed')).toBeUndefined()
    expect(content().exists()).toBe(true)
    onBeforeUpdateOpen.mockClear()

    // A cancelled close keeps it open.
    await trigger().trigger('blur')
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
    const { root, vm, trigger, content } = mountTooltip()
    expect(vm.open).toBe(false)
    expect(trigger().attributes('data-state')).toBe('closed')

    await trigger().trigger('focus')
    await nextTick()
    expect(vm.open).toBe(true)
    expect(trigger().attributes('data-state')).toBe('open')
    expect(trigger().attributes('aria-describedby')).toBe(content().attributes('id'))

    await trigger().trigger('click')
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
