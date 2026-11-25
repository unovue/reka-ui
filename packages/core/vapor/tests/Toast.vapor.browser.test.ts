import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import Fixture from './fixtures/Toast.vue'
import { byId, expectAdopted, expectNoAxeViolations, expectSlotted, mount, text, until } from './utils'

const shown = (id: string) => until(() => expect(document.getElementById(id)).not.toBeNull())
const gone = (id: string) => until(() => expect(document.getElementById(id)).toBeNull())

describe('toast (Vapor)', () => {
  it('shows in the viewport with its title, description and action', async () => {
    await mount(Fixture)
    expect(document.getElementById('toast')).toBeNull()
    await userEvent.click(byId('show'))
    await shown('toast')
    expect(byId('viewport').contains(byId('toast'))).toBe(true)
    expect(text('toast-title')).toBe('Saved')
    expectAdopted('toast-description', {})
    expect(text('toast-description')).toBe('Your changes are saved')
    expectSlotted('toast-undo', { type: 'button' })
  })

  it('closes with its close button and the action, moving focus to the viewport', async () => {
    await mount(Fixture)
    await userEvent.click(byId('show'))
    await shown('toast-close')
    byId('toast-close').focus()
    await userEvent.keyboard('{Enter}')
    await until(() => expect(text('open')).toBe('false'))
    await gone('toast')
    expect(document.activeElement).toBe(byId('viewport'))
    await userEvent.click(byId('show'))
    await shown('toast-undo')
    await userEvent.click(byId('toast-undo'))
    await until(() => expect(text('open')).toBe('false'))
    expect(text('undone')).toBe('1')
  })

  it('closes with Escape from inside the toast', async () => {
    await mount(Fixture)
    await userEvent.click(byId('show'))
    await shown('toast-close')
    byId('toast-close').focus()
    await userEvent.keyboard('{Escape}')
    await until(() => expect(text('open')).toBe('false'))
  })

  it('has no axe violations, open', async () => {
    await mount(Fixture)
    await userEvent.click(byId('show'))
    await shown('toast')
    await expectNoAxeViolations()
  })
})
