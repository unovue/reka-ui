import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import Fixture from './fixtures/Stepper.vue'
import { byId, expectAdopted, expectNoAxeViolations, expectSlotted, mount, text, until } from './utils'

describe('stepper (Vapor)', () => {
  it('marks the steps by state', async () => {
    await mount(Fixture)
    expect(byId('item-1').dataset.state).toBe('active')
    expect(byId('item-2').dataset.state).toBe('inactive')
    expect(byId('trigger-1').getAttribute('aria-current')).toBe('step')
  })

  it('moves v-model by click and the arrow keys', async () => {
    await mount(Fixture)
    await userEvent.click(byId('trigger-3'))
    await until(() => expect(text('step')).toBe('3'))
    expect(byId('item-1').dataset.state).toBe('completed')
    expect(byId('item-3').dataset.state).toBe('active')
    await userEvent.keyboard('{ArrowLeft}')
    await until(() => expect(document.activeElement?.id).toBe('trigger-2'))
    await userEvent.keyboard('{Enter}')
    await until(() => expect(text('step')).toBe('2'))
  })

  it('asChild in both forms', async () => {
    await mount(Fixture)
    expectAdopted('trigger-adopted', { 'aria-label': 'First', 'aria-current': 'step' })
    const second = expectSlotted('trigger-slotted', { 'aria-label': 'Second', 'data-state': 'inactive' })
    await userEvent.click(second)
    await until(() => expect(second.dataset.state).toBe('active'))
  })

  it('has no axe violations', async () => {
    await mount(Fixture)
    await expectNoAxeViolations()
  })
})
