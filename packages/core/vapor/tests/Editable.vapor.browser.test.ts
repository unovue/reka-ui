import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import Fixture from './fixtures/Editable.vue'
import { byId, expectAdopted, expectNoAxeViolations, expectSlotted, mount, text, until } from './utils'

describe('editable (Vapor)', () => {
  it('edits and submits v-model with Enter', async () => {
    await mount(Fixture)
    expect(text('preview')).toBe('Hello')
    await userEvent.click(byId('edit'))
    const input = byId<HTMLInputElement>('input')
    await until(() => expect(document.activeElement).toBe(input))
    await userEvent.clear(input)
    await userEvent.type(input, 'Vapor{Enter}')
    await until(() => expect(text('value')).toBe('Vapor'))
    await until(() => expect(text('preview')).toBe('Vapor'))
  })

  it('cancels with Escape', async () => {
    await mount(Fixture)
    await userEvent.click(byId('edit'))
    const input = byId<HTMLInputElement>('input')
    await userEvent.type(input, ' world{Escape}')
    await until(() => expect(text('preview')).toBe('Hello'))
    expect(text('value')).toBe('Hello')
  })

  it('asChild in both forms: submit and cancel triggers', async () => {
    await mount(Fixture)
    await userEvent.click(byId('edit'))
    await until(() => expect(document.getElementById('submit-adopted')).not.toBeNull())
    expectAdopted('submit-adopted', { 'aria-label': 'Save' })
    expectSlotted('cancel-slotted', { 'aria-label': 'cancel' })
    await userEvent.type(byId('input'), '!')
    await userEvent.click(byId('submit-adopted'))
    await until(() => expect(text('value')).toBe('Hello!'))
  })

  it('has no axe violations', async () => {
    await mount(Fixture)
    await expectNoAxeViolations()
  })
})
