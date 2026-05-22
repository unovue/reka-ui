import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { useGraceArea } from './useGraceArea'

// jsdom doesn't support PointerEvent, so we use MouseEvent with `pointerType`.
function createPointerEvent(type: string, init: { clientX: number, clientY: number, target?: EventTarget, currentTarget?: EventTarget }) {
  const event = new MouseEvent(type, { bubbles: true, clientX: init.clientX, clientY: init.clientY })
  if (init.target)
    Object.defineProperty(event, 'target', { value: init.target, writable: false })
  if (init.currentTarget)
    Object.defineProperty(event, 'currentTarget', { value: init.currentTarget, writable: false })
  return event
}

function mockRect(el: HTMLElement, rect: Partial<DOMRect>) {
  el.getBoundingClientRect = vi.fn(() => ({
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    toJSON: () => ({}),
    ...rect,
  } as DOMRect))
}

interface SetupOptions {
  withOtherTrigger?: boolean
}

function setup({ withOtherTrigger = false }: SetupOptions = {}) {
  let exitCount = 0

  const TestComponent = defineComponent({
    setup() {
      const trigger = ref<HTMLElement>()
      const content = ref<HTMLElement>()

      const { onPointerExit } = useGraceArea(trigger, content)
      onPointerExit(() => {
        exitCount++
      })

      return () =>
        h('div', [
          h(
            'button',
            {
              'ref': (el: any) => {
                trigger.value = el
              },
              'data-grace-area-trigger': '',
              'data-testid': 'trigger',
            },
            'Trigger',
          ),
          withOtherTrigger
            ? h(
                'button',
                {
                  'data-grace-area-trigger': '',
                  'data-testid': 'other-trigger',
                },
                'Other Trigger',
              )
            : null,
          h(
            'div',
            {
              'ref': (el: any) => {
                content.value = el
              },
              'data-testid': 'content',
            },
            'Content',
          ),
        ])
    },
  })

  const wrapper = mount(TestComponent, { attachTo: document.body })
  const triggerEl = wrapper.element.querySelector('[data-testid="trigger"]') as HTMLElement
  const contentEl = wrapper.element.querySelector('[data-testid="content"]') as HTMLElement
  const otherTriggerEl = wrapper.element.querySelector('[data-testid="other-trigger"]') as HTMLElement | null

  mockRect(triggerEl, { top: 0, left: 0, bottom: 30, right: 100, width: 100, height: 30 })
  mockRect(contentEl, { top: 40, left: 0, bottom: 70, right: 100, width: 100, height: 30 })

  return {
    wrapper,
    triggerEl,
    contentEl,
    otherTriggerEl,
    getExitCount: () => exitCount,
  }
}

describe('useGraceArea', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('triggers exit when cursor is over content with another grace-area-trigger underneath', async () => {
    const { wrapper, triggerEl, contentEl, otherTriggerEl, getExitCount } = setup({ withOtherTrigger: true })
    await nextTick()

    // Create the grace area by leaving the trigger
    triggerEl.dispatchEvent(createPointerEvent('pointerleave', { clientX: 50, clientY: 30, currentTarget: triggerEl }))
    await nextTick()

    // Simulate the tooltip content being positioned over another grace-area-trigger.
    document.elementsFromPoint = vi.fn(() => [contentEl, otherTriggerEl!])

    // Cursor moves onto the content (which sits over the other trigger).
    document.dispatchEvent(createPointerEvent('pointermove', { clientX: 50, clientY: 55, target: contentEl }))
    await nextTick()

    expect(getExitCount()).toBe(1)

    wrapper.unmount()
  })

  it('does not trigger exit when cursor is over content with no other grace-area-trigger underneath', async () => {
    const { wrapper, triggerEl, contentEl, getExitCount } = setup()
    await nextTick()

    triggerEl.dispatchEvent(createPointerEvent('pointerleave', { clientX: 50, clientY: 30, currentTarget: triggerEl }))
    await nextTick()

    document.elementsFromPoint = vi.fn(() => [contentEl])

    document.dispatchEvent(createPointerEvent('pointermove', { clientX: 50, clientY: 55, target: contentEl }))
    await nextTick()

    expect(getExitCount()).toBe(0)

    wrapper.unmount()
  })

  it('keeps tracking pointer while cursor stays on content so later movement over another trigger still closes', async () => {
    const { wrapper, triggerEl, contentEl, otherTriggerEl, getExitCount } = setup({ withOtherTrigger: true })
    await nextTick()

    triggerEl.dispatchEvent(createPointerEvent('pointerleave', { clientX: 50, clientY: 30, currentTarget: triggerEl }))
    await nextTick()

    // First move: cursor lands on content at a spot with no other trigger underneath.
    document.elementsFromPoint = vi.fn(() => [contentEl])
    document.dispatchEvent(createPointerEvent('pointermove', { clientX: 50, clientY: 45, target: contentEl }))
    await nextTick()
    expect(getExitCount()).toBe(0)

    // Second move: cursor still on content but now over another grace-area-trigger.
    document.elementsFromPoint = vi.fn(() => [contentEl, otherTriggerEl!])
    document.dispatchEvent(createPointerEvent('pointermove', { clientX: 50, clientY: 60, target: contentEl }))
    await nextTick()

    expect(getExitCount()).toBe(1)

    wrapper.unmount()
  })
})
