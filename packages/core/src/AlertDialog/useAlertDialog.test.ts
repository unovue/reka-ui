import { fireEvent, render } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, nextTick } from 'vue'
import * as Reka from '../index'
import { useAlertDialog, useAlertDialogContent } from './useAlertDialog'

function noDataAttrs(props: Record<string, any>) {
  return Object.keys(props).every(k => !k.startsWith('data-'))
}

describe('useAlertDialog — composes useDialog', () => {
  it('is always modal and keeps the Dialog open model', () => {
    const d = useAlertDialog()
    expect(d.modal.value).toBe(true)
    expect(d.context.modal.value).toBe(true)
    expect(d.open.value).toBe(false)
    expect(d.lastChangeDetails.value.reason).toBe('none')
    expect(d.onOpenToggle()).toBe(true)
    expect(d.open.value).toBe(true)
    expect(d.lastChangeDetails.value.reason).toBe('imperative-action')
  })

  it('derives ids from baseId, and two standalone calls do not collide', () => {
    const d = useAlertDialog({ baseId: 'x' })
    expect(d.context.contentId).toBe('x-content')
    const a = useAlertDialog()
    const b = useAlertDialog()
    expect(a.context.contentId).toMatch(/^reka-alert-dialog-\d+-content$/)
    expect(a.context.contentId).not.toBe(b.context.contentId)
  })

  it('content surface is role="alertdialog" with the dialog aria wiring', () => {
    const d = useAlertDialog({ baseId: 'x' })
    expect(noDataAttrs(d.content.props.value)).toBe(true)
    expect(d.content.attrs.value).toEqual({
      'id': 'x-content',
      'role': 'alertdialog',
      'aria-describedby': 'x-description',
      'aria-labelledby': 'x-title',
      'data-state': 'closed',
    })
    d.openModal()
    expect(d.content.attrs.value['data-state']).toBe('open')
  })
})

describe('useAlertDialog — reasons and cancellation', () => {
  it('trigger reports trigger-press; action and cancel report close-press', () => {
    const onUpdate = vi.fn()
    const d = useAlertDialog({ onUpdate })
    const open = new MouseEvent('click')
    d.trigger.props.value.onClick(open)
    expect(onUpdate).toHaveBeenLastCalledWith(true, expect.objectContaining({ reason: 'trigger-press', event: open }))
    const action = new MouseEvent('click')
    d.action.props.value.onClick(action)
    expect(onUpdate).toHaveBeenLastCalledWith(false, expect.objectContaining({ reason: 'close-press', event: action }))
    d.openModal()
    d.cancel.props.value.onClick(new MouseEvent('click'))
    expect(d.open.value).toBe(false)
    expect(d.lastChangeDetails.value.reason).toBe('close-press')
  })

  it('emits beforeUpdate:open then update:open with the same details', () => {
    const emit = vi.fn()
    const d = useAlertDialog({ open: () => true, emit })
    d.context.onOpenChange(false, 'escape-key')
    expect(emit).toHaveBeenNthCalledWith(1, 'beforeUpdate:open', false, expect.objectContaining({ reason: 'escape-key' }))
    expect(emit).toHaveBeenNthCalledWith(2, 'update:open', false, expect.objectContaining({ reason: 'escape-key' }))
    // Controlled: nothing written locally.
    expect(d.open.value).toBe(true)
  })

  it('cancel() in onBeforeUpdate keeps it open', () => {
    const onUpdate = vi.fn()
    const d = useAlertDialog({ defaultOpen: true, onBeforeUpdate: (_v, details) => details.cancel(), onUpdate })
    expect(d.cancel.props.value.onClick(new MouseEvent('click'))).toBe(false)
    expect(d.open.value).toBe(true)
    expect(d.lastChangeDetails.value).toMatchObject({ reason: 'close-press', isCanceled: true })
    expect(onUpdate).not.toHaveBeenCalled()
  })
})

describe('useAlertDialogContent', () => {
  it('prevents outside presses and focuses the registered cancel element on open', async () => {
    const c = useAlertDialogContent()
    const pointer = new CustomEvent('pointerdown.outside', { cancelable: true })
    c.onPointerDownOutside(pointer)
    expect(pointer.defaultPrevented).toBe(true)
    const interact = new CustomEvent('interact.outside', { cancelable: true })
    c.onInteractOutside(interact)
    expect(interact.defaultPrevented).toBe(true)

    const button = document.createElement('button')
    document.body.appendChild(button)
    c.contentContext.onCancelElementChange(button)
    expect(c.cancelElement.value).toBe(button)
    c.onOpenAutoFocus()
    expect(document.activeElement).not.toBe(button)
    await nextTick()
    expect(document.activeElement).toBe(button)
    button.remove()
  })
})

describe('useAlertDialog — through AlertDialogRoot', () => {
  it('cancelling beforeUpdate:open keeps the alert dialog closed', async () => {
    const wrapper = mount(defineComponent({
      setup() {
        return () => h(Reka.AlertDialogRoot, {
          'onBeforeUpdate:open': (_v: boolean, details: { cancel: () => void }) => details.cancel(),
        }, {
          default: () => h(Reka.AlertDialogTrigger, () => 'Open'),
        })
      },
    }), { attachTo: document.body })
    await wrapper.find('button').trigger('click')
    expect(wrapper.find('button').attributes('aria-expanded')).toBe('false')
    wrapper.unmount()
  })

  it('drops fallthrough attrs silently, like DialogRoot (no extraneous-attrs warning)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const wrapper = mount(defineComponent({
      setup() {
        return () => h(Reka.AlertDialogRoot, { class: 'x', id: 'y' }, {
          default: () => h(Reka.AlertDialogTrigger, () => 'Open'),
        })
      },
    }), { attachTo: document.body })
    expect(warn.mock.calls.filter(args => String(args[0]).includes('Extraneous non-props attributes'))).toEqual([])
    expect(wrapper.find('button').classes()).not.toContain('x')
    wrapper.unmount()
    warn.mockRestore()
  })
})

describe('useAlertDialog — rendered surfaces', () => {
  const Fixture = defineComponent({
    setup() {
      const d = useAlertDialog({ defaultOpen: true, baseId: 'fixture' })
      return { d }
    },
    template: `
      <button v-bind="d.trigger.attrs.value">Delete</button>
      <div v-if="d.open.value" v-bind="d.content.attrs.value">
        <h2 v-bind="d.title.attrs.value">Are you sure?</h2>
        <p v-bind="d.description.attrs.value">This cannot be undone.</p>
        <button v-bind="d.cancel.attrs.value">Cancel</button>
        <button v-bind="d.action.attrs.value">Confirm</button>
      </div>
    `,
  })

  it('wires the alertdialog and passes axe, open and closed', async () => {
    const { container, getByRole, getByText, queryByRole } = render(Fixture)
    const dialog = getByRole('alertdialog')
    expect(dialog.getAttribute('aria-labelledby')).toBe(getByText('Are you sure?').id)
    expect(dialog.getAttribute('aria-describedby')).toBe(getByText('This cannot be undone.').id)
    expect(await axe(container)).toHaveNoViolations()

    await fireEvent.click(getByText('Confirm'))
    expect(queryByRole('alertdialog')).toBeNull()
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('useAlertDialog — public export', () => {
  it('is exported from the package barrel with the reason union; builders are internal', () => {
    expect(typeof Reka.useAlertDialog).toBe('function')
    expect(typeof Reka.useAlertDialogContent).toBe('function')
    expect('getAlertDialogContentSurface' in Reka).toBe(false)
  })
})

describe('useAlertDialog — lazy surfaces', () => {
  it('keeps the dialog keys and overrides content with the alert surface', () => {
    const d = useAlertDialog()
    expect(d.content).toBe(d.content)
    expect(d.content.attrs.value.role).toBe('alertdialog')
    expect(d.action).not.toBe(d.cancel)
    expect(typeof d.onOpenChange).toBe('function')
    expect(d.context).toBeDefined()
    expect(Object.keys(d)).toEqual(expect.arrayContaining(['trigger', 'overlay', 'content', 'action', 'cancel', 'open', 'context']))
  })
})
