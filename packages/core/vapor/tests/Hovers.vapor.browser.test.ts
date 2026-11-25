import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import Fixture from './fixtures/Hovers.vue'
import { byId, expectAdopted, expectNoAxeViolations, expectSlotted, mount, text, until } from './utils'

const gone = (id: string) => until(() => expect(document.getElementById(id)).toBeNull())
const shown = (id: string) => until(() => expect(document.getElementById(id)).not.toBeNull())

describe('tooltip, hover card (Vapor)', () => {
  it('tooltip: shows on hover and keyboard focus, describes the trigger, Escape hides it', async () => {
    await mount(Fixture)
    const trigger = expectAdopted('tooltip-trigger', {})
    await userEvent.hover(trigger)
    await shown('tooltip-content')
    expect(text('tooltip')).toBe('true')
    expect(trigger.dataset.state).toBe('mine')
    const tip = document.querySelector('[role="tooltip"]')!
    expect(tip.textContent?.trim()).toBe('Add to library')
    expect(trigger.getAttribute('aria-describedby')).toBe(tip.id)
    await until(() => expect(byId('tooltip-content').getBoundingClientRect().top).toBeGreaterThan(trigger.getBoundingClientRect().bottom))
    await userEvent.hover(byId('away'))
    await gone('tooltip-content')
    trigger.focus()
    await shown('tooltip-content')
    await userEvent.keyboard('{Escape}')
    await gone('tooltip-content')
  })

  it('hover card: opens on hover and focus, closes on leave', async () => {
    await mount(Fixture)
    const trigger = expectSlotted('card-trigger', { 'data-state': 'closed' })
    await userEvent.hover(trigger)
    await shown('card-content')
    expect(text('card')).toBe('true')
    expect(trigger.dataset.state).toBe('open')
    await userEvent.hover(byId('away'))
    await gone('card-content')
    trigger.focus()
    await shown('card-content')
  })

  it('has no axe violations, closed and open', async () => {
    await mount(Fixture)
    await expectNoAxeViolations()
    await userEvent.hover(byId('tooltip-trigger'))
    await shown('tooltip-content')
    await expectNoAxeViolations()
  })
})
