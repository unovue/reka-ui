import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import Fixture from './fixtures/Overlays.vue'
import { byId, expectAdopted, expectNoAxeViolations, expectSlotted, mount, text, until } from './utils'

const active = () => document.activeElement?.id
const gone = (id: string) => until(() => expect(document.getElementById(id)).toBeNull())
const shown = (id: string) => until(() => expect(document.getElementById(id)).not.toBeNull())

describe('popover, dialog, alert dialog (Vapor)', () => {
  it('popover: opens below the trigger in a portal, Escape and outside click close it', async () => {
    const host = await mount(Fixture)
    const trigger = expectAdopted('popover-trigger', { 'aria-haspopup': 'dialog', 'aria-expanded': 'false' })
    await userEvent.click(trigger)
    await shown('popover-content')
    const content = byId('popover-content')
    expect(host.contains(content)).toBe(false)
    expect(text('popover')).toBe('true')
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(trigger.getAttribute('aria-controls')).toBe('popover-content')
    await until(() => expect(Math.abs(content.getBoundingClientRect().top - trigger.getBoundingClientRect().bottom - 4)).toBeLessThan(2))
    await userEvent.keyboard('{Escape}')
    await gone('popover-content')
    expect(active()).toBe('popover-trigger')
    await userEvent.click(trigger)
    await shown('popover-content')
    await userEvent.click(byId('outside'))
    await gone('popover-content')
  })

  it('dialog: labelled, traps focus, locks scroll, Escape and overlay click close, focus returns', async () => {
    await mount(Fixture)
    const trigger = expectSlotted('dialog-trigger', { 'aria-haspopup': 'dialog', 'aria-expanded': 'false' })
    await userEvent.click(trigger)
    await shown('dialog-content')
    const content = byId('dialog-content')
    expect(content.getAttribute('role')).toBe('dialog')
    expect(document.getElementById(content.getAttribute('aria-labelledby')!)?.textContent).toBe('Edit profile')
    expect(document.getElementById(content.getAttribute('aria-describedby')!)?.textContent).toBe('Change your name')
    await until(() => expect(active()).toBe('dialog-input'))
    for (let i = 0; i < 3; i++) {
      await userEvent.keyboard('{Tab}')
      expect(content.contains(document.activeElement)).toBe(true)
    }
    expect(document.body.style.overflow).toBe('hidden')
    await userEvent.keyboard('{Escape}')
    await gone('dialog-content')
    expect(text('dialog')).toBe('false')
    await until(() => expect(active()).toBe('dialog-trigger'))
    await userEvent.click(trigger)
    await shown('dialog-overlay')
    await userEvent.click(byId('dialog-overlay'), { position: { x: 5, y: 5 } })
    await gone('dialog-content')
  })

  it('alert dialog: focuses Cancel, ignores outside clicks, Action closes', async () => {
    await mount(Fixture)
    await userEvent.click(byId('alert-trigger'))
    await shown('alert-content')
    expect(byId('alert-content').getAttribute('role')).toBe('alertdialog')
    await until(() => expect(active()).toBe('alert-cancel'))
    await userEvent.keyboard('{Tab}')
    expect(active()).toBe('alert-action')
    await userEvent.keyboard('{Enter}')
    await gone('alert-content')
    expect(text('actions')).toBe('1')
    await until(() => expect(active()).toBe('alert-trigger'))
  })

  it('has no axe violations, closed and open', async () => {
    await mount(Fixture)
    await expectNoAxeViolations()
    await userEvent.click(byId('dialog-trigger'))
    await shown('dialog-content')
    await expectNoAxeViolations()
  })
})
