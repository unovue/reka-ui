import type { VueWrapper } from '@vue/test-utils'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, KeepAlive, nextTick, ref } from 'vue'
import { sleep } from '@/test'
import HoverCardContent from './HoverCardContent.vue'
import HoverCardRoot, { injectHoverCardRootContext } from './HoverCardRoot.vue'
import HoverCardTrigger from './HoverCardTrigger.vue'
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

describe('given a HoverCardTrigger rendered as a button', () => {
  function mountTrigger(triggerProps: Record<string, unknown> = {}) {
    const wrapper = mount(() => h(HoverCardRoot, () => h(HoverCardTrigger, { as: 'button', ...triggerProps }, () => 'trigger')))
    return wrapper.get('button')
  }

  it('should set type="button" so it does not submit a surrounding form', () => {
    expect(mountTrigger().attributes('type')).toBe('button')
  })

  it('should keep an explicit type', () => {
    expect(mountTrigger({ type: 'submit' }).attributes('type')).toBe('submit')
  })
})

describe('given a HoverCard that unmounts while its open delay is running', () => {
  it('should not leave its open timer pending', async () => {
    vi.useFakeTimers()
    try {
      const wrapper = mount(
        () => h(HoverCardRoot, { openDelay: 500 }, () => h(HoverCardTrigger, null, () => 'trigger')),
        { attachTo: document.body },
      )
      await wrapper.find('a').trigger('pointerenter', { pointerType: 'mouse' })
      expect(vi.getTimerCount()).toBeGreaterThan(0)

      wrapper.unmount()

      expect(vi.getTimerCount()).toBe(0)
    }
    finally {
      vi.useRealTimers()
    }
  })
})

describe('given a HoverCard trigger that is hovered then focused within the open delay', () => {
  it('should not leave a stale open timer after unmount', async () => {
    vi.useFakeTimers()
    try {
      const wrapper = mount(
        () => h(HoverCardRoot, { openDelay: 500 }, () => h(HoverCardTrigger, null, () => 'trigger')),
        { attachTo: document.body },
      )
      await wrapper.find('a').trigger('pointerenter', { pointerType: 'mouse' })
      try {
        await wrapper.find('a').trigger('focus')
        expect(vi.getTimerCount()).toBe(1)
      }
      finally {
        wrapper.unmount()
      }

      expect(vi.getTimerCount()).toBe(0)
    }
    finally {
      vi.useRealTimers()
    }
  })
})

describe('given a HoverCardTrigger that unmounts after the pointer left but before the leave check ran', () => {
  it('should cancel the pending open request', async () => {
    vi.useFakeTimers()
    try {
      const show = ref(true)
      const wrapper = mount(
        () => h(HoverCardRoot, { openDelay: 500 }, () => show.value ? h(HoverCardTrigger, null, () => 'trigger') : null),
        { attachTo: document.body },
      )
      try {
        const trigger = wrapper.find('a')
        await trigger.trigger('pointerenter', { pointerType: 'mouse' })
        await trigger.trigger('pointerleave', { pointerType: 'mouse' })
        show.value = false
        await nextTick()

        expect(vi.getTimerCount()).toBe(0)
      }
      finally {
        wrapper.unmount()
      }
    }
    finally {
      vi.useRealTimers()
    }
  })
})

describe('given a HoverCardTrigger that unmounts right after the pointer left an open card', () => {
  it('should not close the card or emit update:open', async () => {
    vi.useFakeTimers()
    try {
      const show = ref(true)
      const onUpdateOpen = vi.fn()
      const wrapper = mount(
        () => h(
          HoverCardRoot,
          { 'open': true, 'onUpdate:open': onUpdateOpen },
          () => show.value ? h(HoverCardTrigger, null, () => 'trigger') : null,
        ),
        { attachTo: document.body },
      )
      try {
        await wrapper.find('a').trigger('pointerleave', { pointerType: 'mouse' })
        show.value = false
        await nextTick()

        expect(onUpdateOpen).not.toHaveBeenCalled()
      }
      finally {
        wrapper.unmount()
      }
    }
    finally {
      vi.useRealTimers()
    }
  })
})

describe('given a controlled closed HoverCard that unmounts after the pointer left', () => {
  it('should not emit update:open during unmount', async () => {
    vi.useFakeTimers()
    try {
      const onUpdateOpen = vi.fn()
      const wrapper = mount(
        () => h(
          HoverCardRoot,
          { 'open': false, 'onUpdate:open': onUpdateOpen },
          () => h(HoverCardTrigger, null, () => 'trigger'),
        ),
        { attachTo: document.body },
      )
      await wrapper.find('a').trigger('pointerleave', { pointerType: 'mouse' })
      wrapper.unmount()

      expect(onUpdateOpen).not.toHaveBeenCalled()
    }
    finally {
      vi.useRealTimers()
    }
  })
})

describe('given a controlled open HoverCard whose trigger unmounts with an open request pending', () => {
  it('should not emit update:open(true) after the card is closed', async () => {
    vi.useFakeTimers()
    try {
      const show = ref(true)
      const open = ref(true)
      const onUpdateOpen = vi.fn()
      const wrapper = mount(
        () => h(HoverCardRoot, { 'open': open.value, 'openDelay': 500, 'onUpdate:open': onUpdateOpen }, () => show.value ? h(HoverCardTrigger, null, () => 'trigger') : null),
        { attachTo: document.body },
      )
      try {
        await wrapper.find('a').trigger('pointerenter', { pointerType: 'mouse' })
        show.value = false
        await nextTick()
        open.value = false
        await nextTick()

        vi.advanceTimersByTime(1000)

        expect(onUpdateOpen).not.toHaveBeenCalledWith(true)
      }
      finally {
        wrapper.unmount()
      }
    }
    finally {
      vi.useRealTimers()
    }
  })
})

describe('given a HoverCard whose open delay is already running', () => {
  function mountWithDelay() {
    return mount(
      () => h(HoverCardRoot, { openDelay: 500 }, () => h(HoverCardTrigger, null, () => 'trigger')),
      { attachTo: document.body },
    )
  }

  it('should keep the first deadline when another open request arrives', async () => {
    vi.useFakeTimers()
    const wrapper = mountWithDelay()
    try {
      const trigger = wrapper.find('a')
      await trigger.trigger('pointerenter', { pointerType: 'mouse' })
      vi.advanceTimersByTime(450)
      await trigger.trigger('focus')

      vi.advanceTimersByTime(49)
      await nextTick()
      expect(trigger.attributes('data-state')).toBe('closed')

      vi.advanceTimersByTime(1)
      await nextTick()
      expect(trigger.attributes('data-state')).toBe('open')
    }
    finally {
      wrapper.unmount()
      vi.useRealTimers()
    }
  })

  it('should start a fresh delay when the pointer leaves and re-enters', async () => {
    vi.useFakeTimers()
    const wrapper = mountWithDelay()
    try {
      const trigger = wrapper.find('a')
      await trigger.trigger('pointerenter', { pointerType: 'mouse' })
      vi.advanceTimersByTime(100)
      await trigger.trigger('pointerleave', { pointerType: 'mouse' })
      vi.advanceTimersByTime(350)
      await trigger.trigger('pointerenter', { pointerType: 'mouse' })

      vi.advanceTimersByTime(499)
      await nextTick()
      expect(trigger.attributes('data-state')).toBe('closed')

      vi.advanceTimersByTime(1)
      await nextTick()
      expect(trigger.attributes('data-state')).toBe('open')
    }
    finally {
      wrapper.unmount()
      vi.useRealTimers()
    }
  })
})

describe('given a HoverCardContent with outside interaction listeners', () => {
  function mountWithListeners(preventClose: boolean) {
    const counts = { pointerDownOutside: 0, focusOutside: 0, interactOutside: 0 }
    const wrapper = mount(defineComponent({
      setup: () => () => h('div', [
        h('button', { id: 'outside' }, 'outside'),
        h(HoverCardRoot, { defaultOpen: true }, () => [
          h(HoverCardTrigger, () => 'trigger'),
          h(HoverCardContent, {
            onPointerDownOutside: () => counts.pointerDownOutside++,
            onFocusOutside: () => counts.focusOutside++,
            onInteractOutside: (event: Event) => {
              counts.interactOutside++
              if (preventClose)
                event.preventDefault()
            },
          }, () => 'content'),
        ]),
      ]),
    }), { attachTo: document.body })
    return { wrapper, counts }
  }

  async function waitForContent() {
    // The content is an async component
    await vi.waitFor(() => expect(document.querySelector('[data-dismissable-layer]')).not.toBeNull())
    // The outside listeners are registered on the next macrotask
    await sleep(0)
  }

  it.each([false, true])('should emit pointerDownOutside and interactOutside once per outside pointer down (preventClose=%s)', async (preventClose) => {
    const { wrapper, counts } = mountWithListeners(preventClose)
    try {
      await waitForContent()

      document.getElementById('outside')!.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0 }))
      await flushPromises()

      expect(counts.pointerDownOutside).toBe(1)
      expect(counts.interactOutside).toBe(1)
      expect(wrapper.find('[data-dismissable-layer]').exists()).toBe(preventClose)
    }
    finally {
      wrapper.unmount()
    }
  })

  // Focus outside never closes a hover card
  it('should emit focusOutside and interactOutside once per outside focus and stay open', async () => {
    const { wrapper, counts } = mountWithListeners(false)
    try {
      await waitForContent()

      document.getElementById('outside')!.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
      // Focus outside is reported a couple of ticks after the focus event
      await vi.waitFor(() => expect(counts.focusOutside).toBeGreaterThan(0))
      await flushPromises()

      expect(counts).toMatchObject({ focusOutside: 1, interactOutside: 1 })
      expect(wrapper.find('[data-dismissable-layer]').exists()).toBe(true)
    }
    finally {
      wrapper.unmount()
    }
  })
})

describe('given a controlled HoverCard that is dismissed', () => {
  const DismissButton = defineComponent({
    setup() {
      const rootContext = injectHoverCardRootContext()
      return () => h('button', { onClick: () => rootContext.onDismiss() }, 'dismiss')
    },
  })

  function mountControlled(open: boolean) {
    const onUpdateOpen = vi.fn()
    const wrapper = mount(
      () => h(HoverCardRoot, { 'open': open, 'onUpdate:open': onUpdateOpen }, () => h(DismissButton)),
      { attachTo: document.body },
    )
    return { wrapper, onUpdateOpen }
  }

  it('should emit update:open(false) when it was open', async () => {
    const { wrapper, onUpdateOpen } = mountControlled(true)
    await wrapper.find('button').trigger('click')
    expect(onUpdateOpen).toHaveBeenCalledExactlyOnceWith(false)
    wrapper.unmount()
  })

  it('should not emit update:open when it was already closed', async () => {
    const { wrapper, onUpdateOpen } = mountControlled(false)
    await wrapper.find('button').trigger('click')
    expect(onUpdateOpen).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})

function mountInKeepAlivePage(root: Record<string, unknown>) {
  const onPage = ref(true)
  const Page = defineComponent({
    name: 'Page',
    setup: () => () => h(HoverCardRoot, root, () => h(HoverCardTrigger, { href: '#' }, () => 'trigger')),
  })
  const wrapper = mount(defineComponent({
    setup: () => () => h(KeepAlive, null, () => onPage.value ? h(Page) : h('p', 'other page')),
  }), { attachTo: document.body })
  return { wrapper, onPage }
}

describe('given a hover card waiting to open in a KeepAlive page', () => {
  it('does not open once the page is deactivated', async () => {
    vi.useFakeTimers()
    const onUpdateOpen = vi.fn()
    const { wrapper, onPage } = mountInKeepAlivePage({ 'openDelay': 50, 'onUpdate:open': onUpdateOpen })
    try {
      await wrapper.find('a').trigger('pointerenter', { pointerType: 'mouse' })
      onPage.value = false
      await nextTick()
      vi.advanceTimersByTime(100)
      await nextTick()

      expect(onUpdateOpen).not.toHaveBeenCalled()
    }
    finally {
      wrapper.unmount()
      vi.useRealTimers()
    }
  })
})

describe('given a controlled hover card waiting to close in a KeepAlive page', () => {
  it('emits update:open(false) once when the page is deactivated', async () => {
    vi.useFakeTimers()
    const onUpdateOpen = vi.fn()
    const { wrapper, onPage } = mountInKeepAlivePage({ 'open': true, 'closeDelay': 200, 'onUpdate:open': onUpdateOpen })
    try {
      // Starts the close delay, as leaving the card does.
      await wrapper.find('a').trigger('blur')
      onPage.value = false
      await nextTick()
      vi.advanceTimersByTime(300)
      await nextTick()

      expect(onUpdateOpen).toHaveBeenCalledExactlyOnceWith(false)
    }
    finally {
      wrapper.unmount()
      vi.useRealTimers()
    }
  })
})
