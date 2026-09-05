import { fireEvent, render } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, ref } from 'vue'
import * as Reka from '../index'
import { usePopover } from './usePopover'

function noDataAttrs(props: Record<string, any>) {
  return Object.keys(props).every(k => !k.startsWith('data-'))
}

describe('usePopover — state', () => {
  it('defaults to closed, non-modal and uncontrolled', () => {
    const p = usePopover({ baseId: 'x' })
    expect(p.open.value).toBe(false)
    expect(p.context.modal.value).toBe(false)
    expect(p.isControlled.value).toBe(false)
    expect(p.lastChangeDetails.value.reason).toBe('none')
  })

  it('honours defaultOpen and a reactive modal getter', () => {
    const modal = ref(false)
    const p = usePopover({ defaultOpen: true, modal: () => modal.value, baseId: 'x' })
    expect(p.open.value).toBe(true)
    expect(p.context.modal.value).toBe(false)
    modal.value = true
    expect(p.context.modal.value).toBe(true)
  })

  it('onOpenChange() sets the state and reports imperative-action by default', () => {
    const p = usePopover({ baseId: 'x' })
    expect(p.onOpenChange(true)).toBe(true)
    expect(p.open.value).toBe(true)
    expect(p.lastChangeDetails.value.reason).toBe('imperative-action')
    // Unchanged → false, no new details.
    expect(p.onOpenChange(true)).toBe(false)
    expect(p.onOpenChange(false)).toBe(true)
    expect(p.open.value).toBe(false)
  })

  it('onOpenToggle() flips the state and carries reason + event', () => {
    const onUpdate = vi.fn()
    const p = usePopover({ baseId: 'x', onUpdate })
    const event = new MouseEvent('click')
    expect(p.onOpenToggle('trigger-press', event)).toBe(true)
    expect(p.open.value).toBe(true)
    expect(onUpdate).toHaveBeenCalledWith(true, expect.objectContaining({ reason: 'trigger-press', event, isCanceled: false }))
    p.onOpenToggle()
    expect(p.open.value).toBe(false)
    expect(p.lastChangeDetails.value.reason).toBe('imperative-action')
  })

  it('ref-owned mode writes through the passed ref', () => {
    const open = ref(false)
    const p = usePopover({ open, baseId: 'x' })
    expect(p.isControlled.value).toBe(true)
    p.onOpenToggle()
    expect(open.value).toBe(true)
    expect(p.open.value).toBe(true)
  })

  it('controlled getter + emit: emits beforeUpdate/update with details and does not write locally', () => {
    const emit = vi.fn()
    const p = usePopover({ open: () => false, emit, baseId: 'x' })
    expect(p.isControlled.value).toBe(true)
    p.onOpenChange(true, 'trigger-press')
    expect(p.open.value).toBe(false)
    expect(emit).toHaveBeenNthCalledWith(1, 'beforeUpdate:open', true, expect.objectContaining({ reason: 'trigger-press' }))
    expect(emit).toHaveBeenNthCalledWith(2, 'update:open', true, expect.objectContaining({ reason: 'trigger-press' }))
    const [, , beforeDetails] = emit.mock.calls[0]
    const [, , details] = emit.mock.calls[1]
    expect(beforeDetails).toBe(details)
  })

  it('cancel() in onBeforeUpdate vetoes the change', () => {
    const onUpdate = vi.fn()
    const p = usePopover({ baseId: 'x', onBeforeUpdate: (_value, details) => details.cancel(), onUpdate })
    expect(p.onOpenChange(true, 'trigger-press')).toBe(false)
    expect(p.open.value).toBe(false)
    expect(p.lastChangeDetails.value).toMatchObject({ reason: 'trigger-press', isCanceled: true })
    expect(onUpdate).not.toHaveBeenCalled()
  })
})

describe('usePopover — ids', () => {
  it('derives trigger/content ids from baseId', () => {
    const p = usePopover({ baseId: 'x' })
    expect(p.context.triggerId).toBe('x-trigger')
    expect(p.context.contentId).toBe('x-content')
    expect(p.trigger.props.value.id).toBe('x-trigger')
    expect(p.trigger.props.value['aria-controls']).toBe('x-content')
    expect(p.content.props.value.id).toBe('x-content')
    expect(p.content.props.value['aria-labelledby']).toBe('x-trigger')
  })

  it('two standalone calls without a baseId get different ids', () => {
    const a = usePopover()
    const b = usePopover()
    expect(a.context.triggerId).toMatch(/^reka-popover-\d+-trigger$/)
    expect(b.context.contentId).toMatch(/^reka-popover-\d+-content$/)
    expect(a.context.triggerId).not.toBe(b.context.triggerId)
    expect(a.context.contentId).not.toBe(b.context.contentId)
  })
})

describe('usePopover — trigger surface', () => {
  it('props expose id/aria/handlers but NO data-* (and no tag-dependent type)', () => {
    const p = usePopover({ baseId: 'x' })
    expect(p.trigger.props.value).toMatchObject({
      'id': 'x-trigger',
      'aria-haspopup': 'dialog',
      'aria-expanded': false,
      'aria-controls': 'x-content',
    })
    expect(p.trigger.props.value.type).toBeUndefined()
    expect(noDataAttrs(p.trigger.props.value)).toBe(true)
    expect(typeof p.trigger.props.value.onClick).toBe('function')
  })

  it('attrs merge props with the data-state derived from state', () => {
    const p = usePopover({ baseId: 'x' })
    expect(p.trigger.state.value).toEqual({ state: 'closed' })
    expect(p.trigger.attrs.value).toMatchObject({ 'aria-expanded': false, 'data-state': 'closed' })
    p.onOpenChange(true)
    expect(p.trigger.state.value).toEqual({ state: 'open' })
    expect(p.trigger.attrs.value).toMatchObject({ 'aria-expanded': true, 'data-state': 'open' })
  })

  it('onClick toggles with reason trigger-press and the original event', () => {
    const onUpdate = vi.fn()
    const p = usePopover({ baseId: 'x', onUpdate })
    const event = new MouseEvent('click')
    p.trigger.props.value.onClick(event)
    expect(p.open.value).toBe(true)
    expect(onUpdate).toHaveBeenCalledWith(true, expect.objectContaining({ reason: 'trigger-press', event }))
    p.trigger.props.value.onClick(new MouseEvent('click'))
    expect(p.open.value).toBe(false)
    expect(p.lastChangeDetails.value.reason).toBe('trigger-press')
  })
})

describe('usePopover — close surface', () => {
  it('renders only the closing handler and no state', () => {
    const p = usePopover({ baseId: 'x' })
    expect(p.close.props.value.type).toBeUndefined()
    expect(typeof p.close.props.value.onClick).toBe('function')
    expect(p.close.state.value).toEqual({})
    expect(noDataAttrs(p.close.attrs.value)).toBe(true)
  })

  it('onClick closes with reason close-press; a no-op when already closed', () => {
    const onUpdate = vi.fn()
    const p = usePopover({ defaultOpen: true, baseId: 'x', onUpdate })
    const event = new MouseEvent('click')
    p.close.props.value.onClick(event)
    expect(p.open.value).toBe(false)
    expect(onUpdate).toHaveBeenCalledWith(false, expect.objectContaining({ reason: 'close-press', event }))
    p.close.props.value.onClick(new MouseEvent('click'))
    expect(onUpdate).toHaveBeenCalledTimes(1)
  })
})

describe('usePopover — content surface', () => {
  it('props expose id/role/aria-labelledby with NO data-*; attrs add data-state', () => {
    const p = usePopover({ baseId: 'x' })
    expect(p.content.props.value).toEqual({
      'id': 'x-content',
      'role': 'dialog',
      'aria-labelledby': 'x-trigger',
    })
    expect(noDataAttrs(p.content.props.value)).toBe(true)
    expect(p.content.state.value).toEqual({ state: 'closed' })
    expect(p.content.attrs.value['data-state']).toBe('closed')
    p.onOpenChange(true)
    expect(p.content.attrs.value['data-state']).toBe('open')
  })
})

describe('usePopover — context', () => {
  it('exposes the frozen-shape PopoverRootContext', () => {
    const p = usePopover({ baseId: 'x' })
    expect(p.context.open).toBe(p.open)
    expect(p.context.onOpenChange).toBe(p.onOpenChange)
    expect(p.context.onOpenToggle).toBe(p.onOpenToggle)
    expect(p.context.triggerElement.value).toBeUndefined()
    expect(p.context.hasCustomAnchor.value).toBe(false)
    expect(p.context.onOpenToggle('trigger-press')).toBe(true)
    expect(p.context.open.value).toBe(true)
    // Unchanged → false, so a caller can tell "nothing to do" from "cancelled".
    expect(p.context.onOpenChange(true)).toBe(false)
    // Dismissal reasons arrive through `onOpenChange` from the layer the consumer composes.
    const event = new KeyboardEvent('keydown', { key: 'Escape' })
    expect(p.context.onOpenChange(false, 'escape-key', event)).toBe(true)
    expect(p.lastChangeDetails.value).toMatchObject({ reason: 'escape-key', event })
  })
})

describe('usePopover — rendered surfaces', () => {
  // A standalone consumer binding the surfaces to plain elements, without the
  // Popper / Presence / FocusScope / DismissableLayer wrappers: the aria wiring
  // alone has to satisfy axe, closed and open.
  const Fixture = defineComponent({
    setup() {
      const p = usePopover({ baseId: 'fixture' })
      return { p }
    },
    template: `
      <button v-bind="p.trigger.attrs.value">Toggle</button>
      <div v-if="p.open.value" v-bind="p.content.attrs.value">
        <p>Body</p>
        <button v-bind="p.close.attrs.value">Close</button>
      </div>
    `,
  })

  it('wires trigger and content together and passes axe, closed and open', async () => {
    const { container, getByRole, getByText, queryByRole } = render(Fixture)
    const trigger = getByText('Toggle')
    expect(trigger.id).toBe('fixture-trigger')
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(trigger.getAttribute('aria-controls')).toBe('fixture-content')
    expect(trigger.getAttribute('data-state')).toBe('closed')
    expect(queryByRole('dialog')).toBeNull()
    expect(await axe(container)).toHaveNoViolations()

    await fireEvent.click(trigger)
    const dialog = getByRole('dialog')
    expect(dialog.id).toBe('fixture-content')
    expect(dialog.getAttribute('aria-labelledby')).toBe(trigger.id)
    expect(dialog.getAttribute('data-state')).toBe('open')
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(trigger.getAttribute('data-state')).toBe('open')
    expect(await axe(container)).toHaveNoViolations()

    await fireEvent.click(getByText('Close'))
    expect(queryByRole('dialog')).toBeNull()
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })
})

describe('usePopover — public export', () => {
  it('is exported from the package barrel; the surface builders are internal', () => {
    expect(typeof Reka.usePopover).toBe('function')
    expect('getPopoverTriggerSurface' in Reka).toBe(false)
    expect('getPopoverCloseSurface' in Reka).toBe(false)
    expect('getPopoverContentSurface' in Reka).toBe(false)
  })
})
