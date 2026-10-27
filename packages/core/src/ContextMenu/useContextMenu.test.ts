import type { UseContextMenuProps, UseContextMenuReturn } from './useContextMenu'
import { fireEvent, render } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, nextTick } from 'vue'
import * as Reka from '../index'
import { useContextMenu } from './useContextMenu'

function noDataAttrs(props: Record<string, any>) {
  return Object.keys(props).every(k => !k.startsWith('data-'))
}

// `useContextMenu` composes `useMenuRoot` and the trigger owns a watcher: mount harness.
function harness(props: UseContextMenuProps = {}) {
  let api!: UseContextMenuReturn
  const wrapper = mount(defineComponent({
    setup() {
      api = useContextMenu(props)
      return () => null
    },
  }))
  return { api, wrapper }
}

function contextMenuEvent(init: MouseEventInit = {}) {
  return new MouseEvent('contextmenu', { cancelable: true, clientX: 40, clientY: 60, ...init }) as PointerEvent
}

afterEach(() => {
  document.body.innerHTML = ''
  vi.useRealTimers()
})

describe('useContextMenu — state and context', () => {
  it('composes useMenuRoot: one open model shared by the context-menu and Menu contexts', () => {
    const { api } = harness({ pressOpenDelay: 300 })
    expect(api.open.value).toBe(false)
    expect(api.context.open).toBe(api.open)
    expect(api.menuContext.open).toBe(api.open)
    expect(api.context.modal).toBe(api.menuRootContext.modal)
    expect(api.context.pressOpenDelay.value).toBe(300)
    api.context.onOpenChange(true)
    expect(api.lastChangeDetails.value.reason).toBe('trigger-press')
    api.menuRootContext.onClose('item-press')
    expect(api.open.value).toBe(false)
    expect(api.lastChangeDetails.value.reason).toBe('item-press')
  })

  it('pressOpenDelay defaults to 700', () => {
    expect(harness().api.context.pressOpenDelay.value).toBe(700)
  })
})

describe('useContextMenu — trigger surface', () => {
  it('carries the touch-callout style and handlers; data-state/data-disabled from state', () => {
    const { api } = harness()
    expect(noDataAttrs(api.trigger.props.value)).toBe(true)
    expect(api.trigger.props.value.style).toEqual({ WebkitTouchCallout: 'none', pointerEvents: 'auto' })
    expect(api.trigger.attrs.value['data-state']).toBe('closed')
    expect(api.trigger.attrs.value['data-disabled']).toBeUndefined()
    expect(harness({ disabled: true }).api.trigger.attrs.value['data-disabled']).toBe('')
  })

  it('a right click opens at the pointer with reason trigger-press and the event', async () => {
    const onUpdate = vi.fn()
    const { api } = harness({ onUpdate })
    const event = contextMenuEvent()
    await api.trigger.props.value.onContextmenu(event)
    expect(api.open.value).toBe(true)
    expect(event.defaultPrevented).toBe(true)
    expect(onUpdate).toHaveBeenCalledWith(true, expect.objectContaining({ reason: 'trigger-press', event }))
    await nextTick()
    // The anchor is the pointer position, not the trigger element.
    const rect = (api.trigger.reference.value as { getBoundingClientRect: () => DOMRect }).getBoundingClientRect()
    expect(rect).toMatchObject({ x: 40, y: 60, width: 0, height: 0 })
  })

  it('a long press (touch) opens after pressOpenDelay', async () => {
    vi.useFakeTimers()
    const { api } = harness({ pressOpenDelay: 100 })
    const down = new MouseEvent('pointerdown', { clientX: 5, clientY: 5 }) as PointerEvent
    Object.defineProperty(down, 'pointerType', { value: 'touch' })
    await api.trigger.props.value.onPointerdown(down)
    expect(api.open.value).toBe(false)
    vi.advanceTimersByTime(100)
    expect(api.open.value).toBe(true)
    expect(api.lastChangeDetails.value.reason).toBe('trigger-press')
  })

  it('disabled ignores the right click', async () => {
    const { api } = harness({ disabled: true })
    const event = contextMenuEvent()
    await api.trigger.props.value.onContextmenu(event)
    expect(api.open.value).toBe(false)
    expect(event.defaultPrevented).toBe(false)
  })
})

describe('useContextMenu — change events', () => {
  it('cancel() in onBeforeUpdate keeps it closed and the anchor on the trigger', async () => {
    const onUpdate = vi.fn()
    const { api } = harness({ onBeforeUpdate: (_v, details) => details.cancel(), onUpdate })
    await api.trigger.props.value.onContextmenu(contextMenuEvent())
    await nextTick()
    expect(api.open.value).toBe(false)
    expect(api.lastChangeDetails.value).toMatchObject({ reason: 'trigger-press', isCanceled: true })
    expect(onUpdate).not.toHaveBeenCalled()
    expect(api.trigger.reference.value).toBe(api.context.triggerElement.value)
  })

  it('emits beforeUpdate:open then update:open through ContextMenuRoot with the reason', async () => {
    const wrapper = mount(defineComponent({
      setup: () => () => h(Reka.ContextMenuRoot, null, () => [
        h(Reka.ContextMenuTrigger, () => 'Area'),
        h(Reka.ContextMenuContent, () => h(Reka.ContextMenuItem, () => 'Item')),
      ]),
    }), { attachTo: document.body })
    const root = wrapper.findComponent(Reka.ContextMenuRoot)
    await fireEvent.contextMenu(wrapper.find('span').element, { clientX: 1, clientY: 1 })
    await nextTick()
    expect(root.emitted('beforeUpdate:open')).toHaveLength(1)
    const [value, details] = root.emitted('update:open')![0] as [boolean, { reason: string, event?: Event }]
    expect(value).toBe(true)
    expect(details.reason).toBe('trigger-press')
    expect(details.event).toBeInstanceOf(MouseEvent)
    wrapper.unmount()
  })
})

describe('useContextMenu — content handlers', () => {
  it('a right click on the trigger re-positions instead of dismissing', () => {
    const { api } = harness()
    const trigger = document.createElement('span')
    api.context.triggerElement.value = trigger
    const event = new CustomEvent('interact.outside', { cancelable: true, detail: { originalEvent: new PointerEvent('pointerdown', { button: 2 }) } })
    Object.defineProperty(event, 'target', { value: trigger })
    api.content.onInteractOutside(event as any)
    expect(event.defaultPrevented).toBe(true)
  })

  it('non-modal: no focus restore after an outside interaction', () => {
    const { api } = harness({ modal: false })
    const outside = new CustomEvent('interact.outside', { cancelable: true, detail: { originalEvent: new PointerEvent('pointerdown', { button: 0 }) } })
    Object.defineProperty(outside, 'target', { value: document.body })
    api.content.onInteractOutside(outside as any)
    const close = new Event('focus.close', { cancelable: true })
    api.content.onCloseAutoFocus(close)
    expect(close.defaultPrevented).toBe(true)
    // The flag resets after one close.
    const next = new Event('focus.close', { cancelable: true })
    api.content.onCloseAutoFocus(next)
    expect(next.defaultPrevented).toBe(false)
  })
})

describe('useContextMenu — rendered surfaces', () => {
  const Fixture = defineComponent({
    setup() {
      const api = useContextMenu()
      return { api }
    },
    template: `
      <div>
        <span v-bind="api.trigger.attrs.value">Right click here</span>
        <div v-if="api.open.value" role="menu" aria-label="Actions">
          <div role="menuitem" tabindex="-1">Copy</div>
        </div>
      </div>
    `,
  })

  it('opens on contextmenu and passes axe, closed and open', async () => {
    const { container, getByText, getByRole } = render(Fixture)
    const area = getByText('Right click here')
    expect(area.getAttribute('data-state')).toBe('closed')
    expect(await axe(container)).toHaveNoViolations()

    await fireEvent.contextMenu(area)
    await nextTick()
    expect(getByRole('menu')).toBeTruthy()
    expect(area.getAttribute('data-state')).toBe('open')
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('useContextMenu — public export', () => {
  it('is exported from the package barrel; the builders are internal', () => {
    expect(typeof Reka.useContextMenu).toBe('function')
    expect('createContextMenuTriggerSurface' in Reka).toBe(false)
    expect('createContextMenuContentHandlers' in Reka).toBe(false)
  })
})
