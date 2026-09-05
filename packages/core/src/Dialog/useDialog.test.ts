import { fireEvent, render } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, ref } from 'vue'
import * as Reka from '../index'
import { useDialog } from './useDialog'

function noDataAttrs(props: Record<string, any>) {
  return Object.keys(props).every(k => !k.startsWith('data-'))
}

describe('useDialog — state', () => {
  it('defaults to closed, modal, unmountOnHide, uncontrolled', () => {
    const d = useDialog()
    expect(d.open.value).toBe(false)
    expect(d.modal.value).toBe(true)
    expect(d.unmountOnHide.value).toBe(true)
    expect(d.isControlled.value).toBe(false)
    expect(d.lastChangeDetails.value.reason).toBe('none')
  })

  it('honours defaultOpen / modal / unmountOnHide getters', () => {
    const modal = ref(false)
    const d = useDialog({ defaultOpen: true, modal, unmountOnHide: () => false })
    expect(d.open.value).toBe(true)
    expect(d.modal.value).toBe(false)
    expect(d.unmountOnHide.value).toBe(false)
    modal.value = true
    expect(d.modal.value).toBe(true)
    expect(d.context.modal.value).toBe(true)
  })

  it('onOpenChange / onOpenToggle / openModal drive the model and report imperative-action', () => {
    const d = useDialog()
    expect(d.onOpenChange(true)).toBe(true)
    expect(d.open.value).toBe(true)
    expect(d.lastChangeDetails.value.reason).toBe('imperative-action')
    // Unchanged → false, no new details.
    expect(d.onOpenChange(true)).toBe(false)
    expect(d.onOpenToggle()).toBe(true)
    expect(d.open.value).toBe(false)
    expect(d.openModal()).toBe(true)
    expect(d.open.value).toBe(true)
    expect(d.openModal()).toBe(false)
  })

  it('ref-owned mode writes through the passed ref', () => {
    const open = ref(false)
    const d = useDialog({ open })
    expect(d.isControlled.value).toBe(true)
    d.onOpenToggle()
    expect(open.value).toBe(true)
    expect(d.open.value).toBe(true)
  })

  it('controlled getter + emit: emits beforeUpdate:open then update:open and does not write locally', () => {
    const emit = vi.fn()
    const d = useDialog({ open: () => false, emit })
    expect(d.isControlled.value).toBe(true)
    const event = new MouseEvent('click')
    d.trigger.props.value.onClick(event)
    expect(d.open.value).toBe(false)
    expect(emit).toHaveBeenCalledTimes(2)
    expect(emit).toHaveBeenNthCalledWith(1, 'beforeUpdate:open', true, expect.objectContaining({ reason: 'trigger-press', event }))
    expect(emit).toHaveBeenNthCalledWith(2, 'update:open', true, expect.objectContaining({ reason: 'trigger-press', event }))
    expect(emit.mock.calls[0][2]).toBe(emit.mock.calls[1][2])
  })

  it('cancel() in onBeforeUpdate vetoes the change and skips onUpdate', () => {
    const onUpdate = vi.fn()
    const d = useDialog({ defaultOpen: true, onBeforeUpdate: (_value, details) => details.cancel(), onUpdate })
    expect(d.close.props.value.onClick(new MouseEvent('click'))).toBe(false)
    expect(d.open.value).toBe(true)
    expect(d.lastChangeDetails.value).toMatchObject({ reason: 'close-press', isCanceled: true })
    expect(onUpdate).not.toHaveBeenCalled()
    expect(d.trigger.attrs.value['data-state']).toBe('open')
  })
})

describe('useDialog — ids', () => {
  it('derives content/title/description ids from baseId', () => {
    const d = useDialog({ baseId: 'x' })
    expect(d.context.contentId).toBe('x-content')
    expect(d.context.titleId).toBe('x-title')
    expect(d.context.descriptionId).toBe('x-description')
    expect(d.content.props.value).toMatchObject({
      'id': 'x-content',
      'aria-labelledby': 'x-title',
      'aria-describedby': 'x-description',
    })
    expect(d.title.props.value).toEqual({ id: 'x-title' })
    expect(d.description.props.value).toEqual({ id: 'x-description' })
  })

  it('two standalone calls without a baseId get different ids', () => {
    const a = useDialog()
    const b = useDialog()
    expect(a.context.contentId).toMatch(/^reka-dialog-\d+-content$/)
    expect(b.context.contentId).toMatch(/^reka-dialog-\d+-content$/)
    expect(a.context.contentId).not.toBe(b.context.contentId)
    expect(a.title.props.value.id).not.toBe(b.title.props.value.id)
  })
})

describe('useDialog — trigger surface', () => {
  it('exposes aria-haspopup/aria-expanded/aria-controls + onClick with NO data-*', () => {
    const d = useDialog({ baseId: 'x' })
    expect(d.trigger.props.value).toMatchObject({ 'aria-haspopup': 'dialog', 'aria-expanded': false })
    // `aria-controls` only points at the content while open (ported verbatim).
    expect(d.trigger.props.value['aria-controls']).toBeUndefined()
    expect(noDataAttrs(d.trigger.props.value)).toBe(true)
    expect(typeof d.trigger.props.value.onClick).toBe('function')
  })

  it('onClick toggles with reason trigger-press and the original event', () => {
    const onUpdate = vi.fn()
    const d = useDialog({ baseId: 'x', onUpdate })
    const event = new MouseEvent('click')
    expect(d.trigger.props.value.onClick(event)).toBe(true)
    expect(d.open.value).toBe(true)
    expect(onUpdate).toHaveBeenCalledWith(true, expect.objectContaining({ reason: 'trigger-press', event, isCanceled: false }))
    expect(d.trigger.props.value['aria-expanded']).toBe(true)
    expect(d.trigger.props.value['aria-controls']).toBe('x-content')
    d.trigger.props.value.onClick(new MouseEvent('click'))
    expect(d.open.value).toBe(false)
    expect(onUpdate).toHaveBeenLastCalledWith(false, expect.objectContaining({ reason: 'trigger-press' }))
  })

  it('attrs merges props with data-state derived from state', () => {
    const d = useDialog({ baseId: 'x' })
    expect(d.trigger.state.value).toEqual({ state: 'closed' })
    expect(d.trigger.attrs.value).toMatchObject({ 'aria-haspopup': 'dialog', 'data-state': 'closed' })
    d.openModal()
    expect(d.trigger.state.value.state).toBe('open')
    expect(d.trigger.attrs.value['data-state']).toBe('open')
  })
})

describe('useDialog — close, content, overlay, title & description surfaces', () => {
  it('close.props.onClick closes with reason close-press; no data-*', () => {
    const onUpdate = vi.fn()
    const d = useDialog({ defaultOpen: true, onUpdate })
    const event = new MouseEvent('click')
    expect(d.close.props.value.onClick(event)).toBe(true)
    expect(d.open.value).toBe(false)
    expect(onUpdate).toHaveBeenCalledWith(false, expect.objectContaining({ reason: 'close-press', event }))
    expect(d.lastChangeDetails.value.reason).toBe('close-press')
    expect(Object.keys(d.close.attrs.value)).toEqual(['onClick'])
    // Already closed → no-op.
    expect(d.close.props.value.onClick(new MouseEvent('click'))).toBe(false)
  })

  it('content.attrs carries id/role="dialog"/aria + data-state', () => {
    const d = useDialog({ baseId: 'x' })
    expect(noDataAttrs(d.content.props.value)).toBe(true)
    expect(d.content.attrs.value).toEqual({
      'id': 'x-content',
      'role': 'dialog',
      'aria-describedby': 'x-description',
      'aria-labelledby': 'x-title',
      'data-state': 'closed',
    })
    d.openModal()
    expect(d.content.state.value).toEqual({ state: 'open' })
    expect(d.content.attrs.value['data-state']).toBe('open')
  })

  it('overlay is state-only', () => {
    const d = useDialog({ baseId: 'x' })
    expect(d.overlay.props.value).toEqual({})
    expect(d.overlay.attrs.value).toEqual({ 'data-state': 'closed' })
    d.openModal()
    expect(d.overlay.attrs.value).toEqual({ 'data-state': 'open' })
  })

  it('title/description attrs are their ids only', () => {
    const d = useDialog({ baseId: 'x' })
    expect(d.title.attrs.value).toEqual({ id: 'x-title' })
    expect(d.description.attrs.value).toEqual({ id: 'x-description' })
  })
})

describe('useDialog — context', () => {
  it('exposes the frozen DialogRootContext shape', () => {
    const d = useDialog({ baseId: 'x' })
    expect(Object.keys(d.context).sort()).toEqual([
      'contentElement',
      'contentId',
      'descriptionId',
      'modal',
      'onOpenChange',
      'onOpenToggle',
      'open',
      'openModal',
      'titleId',
      'triggerElement',
      'unmountOnHide',
    ])
    expect(d.context.triggerElement.value).toBeUndefined()
    expect(d.context.contentElement.value).toBeUndefined()
    expect(d.context.onOpenToggle()).toBe(true)
    expect(d.context.open.value).toBe(true)
    expect(d.open.value).toBe(true)
    expect(d.context.onOpenChange(false, 'escape-key')).toBe(true)
    expect(d.lastChangeDetails.value.reason).toBe('escape-key')
  })
})

describe('useDialog — rendered surfaces', () => {
  // A standalone consumer binding the surfaces to plain elements, without the
  // Presence / FocusScope / DismissableLayer wrappers: the aria wiring alone
  // has to satisfy axe, open and closed.
  const Fixture = defineComponent({
    setup() {
      const d = useDialog({ defaultOpen: true, baseId: 'fixture' })
      return { d }
    },
    template: `
      <button v-bind="d.trigger.attrs.value">Open</button>
      <div v-if="d.open.value" v-bind="d.content.attrs.value">
        <h2 v-bind="d.title.attrs.value">Title</h2>
        <p v-bind="d.description.attrs.value">Description</p>
        <button v-bind="d.close.attrs.value">Close</button>
      </div>
    `,
  })

  it('wires trigger/content/title/description together and passes axe, open and closed', async () => {
    const { container, getByRole, getByText, queryByRole } = render(Fixture)
    const trigger = getByText('Open')
    const dialog = getByRole('dialog')
    expect(dialog.id).toBe('fixture-content')
    expect(dialog.getAttribute('aria-labelledby')).toBe(getByText('Title').id)
    expect(dialog.getAttribute('aria-describedby')).toBe(getByText('Description').id)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(trigger.getAttribute('aria-controls')).toBe(dialog.id)
    expect(trigger.getAttribute('data-state')).toBe('open')
    expect(dialog.getAttribute('data-state')).toBe('open')
    expect(await axe(container)).toHaveNoViolations()

    await fireEvent.click(getByText('Close'))
    expect(queryByRole('dialog')).toBeNull()
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(trigger.getAttribute('aria-controls')).toBeNull()
    expect(trigger.getAttribute('data-state')).toBe('closed')
    expect(await axe(container)).toHaveNoViolations()

    await fireEvent.click(trigger)
    expect(getByRole('dialog').id).toBe('fixture-content')
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
  })
})

describe('useDialog — public export', () => {
  it('is exported from the package barrel; the surface builders are internal', () => {
    expect(typeof Reka.useDialog).toBe('function')
    expect('getDialogTriggerSurface' in Reka).toBe(false)
    expect('getDialogContentSurface' in Reka).toBe(false)
  })
})
