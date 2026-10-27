import type { UseDropdownMenuProps, UseDropdownMenuReturn } from './useDropdownMenu'
import { fireEvent, render } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, nextTick } from 'vue'
import * as Reka from '../index'
import { useDropdownMenu } from './useDropdownMenu'

function noDataAttrs(props: Record<string, any>) {
  return Object.keys(props).every(k => !k.startsWith('data-'))
}

// `useDropdownMenu` composes `useMenuRoot` (mount-bound), so it runs in a setup harness.
function harness(props: UseDropdownMenuProps = {}) {
  let api!: UseDropdownMenuReturn
  const wrapper = mount(defineComponent({
    setup() {
      api = useDropdownMenu(props)
      return () => null
    },
  }))
  return { api, wrapper }
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('useDropdownMenu — state and context', () => {
  it('composes useMenuRoot: one open model shared by the dropdown and Menu contexts', () => {
    const { api } = harness()
    expect(api.open.value).toBe(false)
    expect(api.isControlled.value).toBe(false)
    expect(api.context.open).toBe(api.open)
    expect(api.menuContext.open).toBe(api.open)
    expect(api.context.modal).toBe(api.menuRootContext.modal)
    expect(api.context.dir).toBe(api.menuRootContext.dir)
    // A Menu close (here Escape) and a dropdown open go through the same model.
    api.context.onOpenToggle()
    expect(api.open.value).toBe(true)
    expect(api.lastChangeDetails.value.reason).toBe('trigger-press')
    api.menuRootContext.onClose('escape-key')
    expect(api.open.value).toBe(false)
    expect(api.lastChangeDetails.value.reason).toBe('escape-key')
  })

  it('derives trigger/content ids from baseId up-front', () => {
    const { api } = harness({ baseId: 'x' })
    expect(api.context.triggerId).toBe('x-trigger')
    expect(api.context.contentId).toBe('x-content')
    expect(api.content.attrs.value).toEqual({ 'id': 'x-content', 'aria-labelledby': 'x-trigger' })
    const a = harness().api
    const b = harness().api
    expect(a.context.triggerId).toMatch(/^reka-dropdown-menu-\d+-trigger$/)
    expect(a.context.triggerId).not.toBe(b.context.triggerId)
  })
})

describe('useDropdownMenu — trigger surface', () => {
  it('exposes aria wiring with NO data-* in props, state as data-*', () => {
    const { api } = harness({ baseId: 'x' })
    expect(noDataAttrs(api.trigger.props.value)).toBe(true)
    expect(api.trigger.props.value).toMatchObject({
      'id': 'x-trigger',
      'aria-haspopup': 'menu',
      'aria-expanded': false,
      'aria-controls': undefined,
      'disabled': false,
    })
    expect(api.trigger.attrs.value['data-state']).toBe('closed')
    expect(api.trigger.attrs.value['data-disabled']).toBeUndefined()
    api.onOpenChange(true)
    expect(api.trigger.props.value['aria-controls']).toBe('x-content')
    expect(api.trigger.attrs.value['data-state']).toBe('open')
  })

  it('a left click toggles with reason trigger-press and the event', async () => {
    const onUpdate = vi.fn()
    const { api } = harness({ onUpdate })
    const event = new MouseEvent('click', { button: 0, cancelable: true })
    await api.trigger.props.value.onClick(event)
    expect(api.open.value).toBe(true)
    expect(onUpdate).toHaveBeenCalledWith(true, expect.objectContaining({ reason: 'trigger-press', event }))
    // Opening prevents the trigger from taking focus from the content.
    expect(event.defaultPrevented).toBe(true)
  })

  it('ignores ctrl+click and non-left buttons', async () => {
    const { api } = harness()
    await api.trigger.props.value.onClick(new MouseEvent('click', { button: 0, ctrlKey: true }))
    await api.trigger.props.value.onClick(new MouseEvent('click', { button: 2 }))
    expect(api.open.value).toBe(false)
  })

  it('arrowDown opens, Enter toggles, other keys are ignored', () => {
    const onUpdate = vi.fn()
    const { api } = harness({ onUpdate })
    const other = new KeyboardEvent('keydown', { key: 'a', cancelable: true })
    api.trigger.props.value.onKeydown(other)
    expect(api.open.value).toBe(false)
    expect(other.defaultPrevented).toBe(false)

    const down = new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true })
    api.trigger.props.value.onKeydown(down)
    expect(api.open.value).toBe(true)
    expect(down.defaultPrevented).toBe(true)
    expect(onUpdate).toHaveBeenLastCalledWith(true, expect.objectContaining({ reason: 'trigger-press', event: down }))

    api.trigger.props.value.onKeydown(new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }))
    expect(api.open.value).toBe(false)
  })

  it('disabled blocks click and keys and sets data-disabled', async () => {
    const { api } = harness({ disabled: true })
    await api.trigger.props.value.onClick(new MouseEvent('click', { button: 0 }))
    api.trigger.props.value.onKeydown(new KeyboardEvent('keydown', { key: 'Enter' }))
    expect(api.open.value).toBe(false)
    expect(api.trigger.attrs.value['data-disabled']).toBe('')
    expect(api.trigger.props.value.disabled).toBe(true)
  })
})

describe('useDropdownMenu — change events', () => {
  it('emits beforeUpdate:open then update:open once, with shared details', async () => {
    const emit = vi.fn()
    const { api } = harness({ emit })
    await api.trigger.props.value.onClick(new MouseEvent('click', { button: 0 }))
    expect(emit).toHaveBeenCalledTimes(2)
    expect(emit.mock.calls[0][0]).toBe('beforeUpdate:open')
    expect(emit.mock.calls[1][0]).toBe('update:open')
    expect(emit.mock.calls[0][2]).toBe(emit.mock.calls[1][2])
  })

  it('cancel() in onBeforeUpdate vetoes the open', async () => {
    const onUpdate = vi.fn()
    const { api } = harness({ onBeforeUpdate: (_v, details) => details.cancel(), onUpdate })
    await api.trigger.props.value.onClick(new MouseEvent('click', { button: 0 }))
    expect(api.open.value).toBe(false)
    expect(api.lastChangeDetails.value).toMatchObject({ reason: 'trigger-press', isCanceled: true })
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('controlled: requests the change but does not write it', async () => {
    const emit = vi.fn()
    const { api } = harness({ open: () => false, emit })
    await api.trigger.props.value.onClick(new MouseEvent('click', { button: 0 }))
    expect(emit).toHaveBeenCalledWith('update:open', true, expect.objectContaining({ reason: 'trigger-press' }))
    expect(api.open.value).toBe(false)
  })

  it('emits update:open once per change through DropdownMenuRoot (no inner MenuRoot layer)', async () => {
    const onUpdate = vi.fn()
    const wrapper = mount(defineComponent({
      setup: () => () => h(Reka.DropdownMenuRoot, { 'onUpdate:open': onUpdate }, () => [
        h(Reka.DropdownMenuTrigger, () => 'Open'),
        h(Reka.DropdownMenuContent, () => h(Reka.DropdownMenuItem, () => 'Item')),
      ]),
    }), { attachTo: document.body })
    await wrapper.find('button').trigger('click', { button: 0 })
    expect(onUpdate).toHaveBeenCalledTimes(1)
    await nextTick()
    await fireEvent.keyDown(document.querySelector('[role=menu]')!, { key: 'Escape' })
    expect(onUpdate).toHaveBeenCalledTimes(2)
    expect(onUpdate).toHaveBeenLastCalledWith(false, expect.objectContaining({ reason: 'escape-key' }))
    wrapper.unmount()
  })
})

describe('useDropdownMenu — content handlers', () => {
  it('closeAutoFocus refocuses the trigger and prevents the default', async () => {
    vi.useFakeTimers()
    const { api } = harness()
    const trigger = document.createElement('button')
    document.body.appendChild(trigger)
    api.context.triggerElement.value = trigger
    const event = new Event('focus.close', { cancelable: true })
    api.content.onCloseAutoFocus(event)
    expect(event.defaultPrevented).toBe(true)
    vi.runAllTimers()
    expect(document.activeElement).toBe(trigger)
    vi.useRealTimers()
  })

  it('an outside press on the trigger does not dismiss (the trigger toggles instead)', () => {
    const { api } = harness()
    const trigger = document.createElement('button')
    api.context.triggerElement.value = trigger
    const event = new CustomEvent('interact.outside', { cancelable: true, detail: { originalEvent: new PointerEvent('pointerdown', { button: 0 }) } })
    Object.defineProperty(event, 'target', { value: trigger })
    api.content.onInteractOutside(event as any)
    expect(event.defaultPrevented).toBe(true)
  })
})

describe('useDropdownMenu — rendered surfaces', () => {
  const Fixture = defineComponent({
    setup() {
      const api = useDropdownMenu({ baseId: 'fixture' })
      return { api }
    },
    template: `
      <button v-bind="api.trigger.attrs.value">Options</button>
      <div v-if="api.open.value" role="menu" v-bind="api.content.attrs.value">
        <div role="menuitem" tabindex="-1">Item</div>
      </div>
    `,
  })

  it('wires trigger and content and passes axe, closed and open', async () => {
    const { container, getByText, getByRole } = render(Fixture)
    const trigger = getByText('Options')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(await axe(container)).toHaveNoViolations()

    await fireEvent.click(trigger, { button: 0 })
    const menu = getByRole('menu')
    expect(menu.id).toBe('fixture-content')
    expect(menu.getAttribute('aria-labelledby')).toBe(trigger.id)
    expect(trigger.getAttribute('aria-controls')).toBe(menu.id)
    expect(trigger.getAttribute('data-state')).toBe('open')
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('useDropdownMenu — public export', () => {
  it('is exported from the package barrel; the surface builders are internal', () => {
    expect(typeof Reka.useDropdownMenu).toBe('function')
    expect('getDropdownMenuTriggerSurface' in Reka).toBe(false)
    expect('createDropdownMenuContentSurface' in Reka).toBe(false)
  })
})
