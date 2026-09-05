import type { VueWrapper } from '@vue/test-utils'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, nextTick, ref } from 'vue'
import { PopoverClose, PopoverContent, PopoverRoot, PopoverTrigger } from '.'
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

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()
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
    const trigger = () => wrapper.find('[aria-haspopup="dialog"]')
    const close = () => wrapper.find('[role="dialog"] button')
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
    const [beforeValue, beforeDetails] = root.emitted('beforeUpdate:open')![0]
    const [value, details] = root.emitted('update:open')![0]
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

    const [value, details] = root.emitted('update:open')![1]
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

    const [value, details] = root.emitted('update:open')![1]
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
    expect(trigger().attributes('data-state')).toBe('open')
  })

  it('v-model:open round-trips through a wrapper component', async () => {
    const { wrapper, root, vm, trigger, close } = mountPopover()
    expect(vm.open).toBe(false)
    expect(trigger().attributes('data-state')).toBe('closed')

    trigger().element.click()
    await nextTick()
    expect(vm.open).toBe(true)
    expect(trigger().attributes('data-state')).toBe('open')
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)

    close().element.click()
    // Presence resolves the exit after its own `nextTick`; flush so the content is gone.
    await flushPromises()
    expect(vm.open).toBe(false)
    expect(trigger().attributes('data-state')).toBe('closed')
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)

    // Parent-driven change: the prop wins and nothing is emitted for it.
    vm.open = true
    await nextTick()
    expect(trigger().attributes('data-state')).toBe('open')
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

    wrapper.find('[data-testid="slot-close"]').element.click()
    await nextTick()

    const [value, details] = root.emitted('update:open')![0]
    expect(value).toBe(false)
    expect(details).toMatchObject({ reason: 'imperative-action' })
    expect(details.event).toBeUndefined()
    expect(wrapper.find('[aria-haspopup="dialog"]').text()).toBe('false')
  })
})
