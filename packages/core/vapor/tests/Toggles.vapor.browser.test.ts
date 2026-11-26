import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import Fixture from './fixtures/Toggles.vue'
import { byId, expectAdopted, expectNoAxeViolations, expectSlotted, mount, text, until } from './utils'

describe('checkbox, toggle, collapsible (Vapor)', () => {
  it('checkbox: toggles v-model with click and Space (not Enter), Presence mounts the indicator', async () => {
    await mount(Fixture)
    const box = byId('checkbox')
    expect(box.getAttribute('role')).toBe('checkbox')
    expect(box.getAttribute('aria-checked')).toBe('false')
    expect(document.getElementById('checkbox-indicator')).toBeNull()
    await userEvent.click(box)
    await until(() => expect(box.getAttribute('aria-checked')).toBe('true'))
    expect(byId('checkbox-indicator').dataset.state).toBe('checked')
    await until(() => expect(byId('form').querySelector<HTMLInputElement>('input[name="terms"]')?.checked).toBe(true))
    await userEvent.keyboard('{Enter}')
    expect(text('checked')).toBe('true')
    await userEvent.keyboard(' ')
    await until(() => expect(text('checked')).toBe('false'))
    await until(() => expect(document.getElementById('checkbox-indicator')).toBeNull())
    expect(document.activeElement).toBe(box)
  })

  it('toggle: aria-pressed and data-state follow v-model', async () => {
    await mount(Fixture)
    const toggle = byId('toggle')
    expect(toggle.getAttribute('aria-pressed')).toBe('false')
    await userEvent.click(toggle)
    await until(() => expect(toggle.getAttribute('aria-pressed')).toBe('true'))
    expect(toggle.dataset.state).toBe('checked')
    await userEvent.keyboard(' ')
    await until(() => expect(text('pressed')).toBe('false'))
  })

  it('collapsible: opens with click and Enter, links trigger and content', async () => {
    await mount(Fixture)
    const trigger = byId('collapsible-trigger')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    await userEvent.click(trigger)
    await until(() => expect(text('open')).toBe('true'))
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(trigger.getAttribute('aria-controls')).toBe('collapsible-content')
    expect(byId('collapsible-content').dataset.state).toBe('open')
    await userEvent.keyboard('{Enter}')
    await until(() => expect(trigger.getAttribute('aria-expanded')).toBe('false'))
  })

  it('asChild in both forms: attributes and merged listeners', async () => {
    await mount(Fixture)
    const adopted = expectAdopted('checkbox-adopted', { 'role': 'checkbox', 'aria-checked': 'false', 'aria-label': 'Adopted', 'class': 'mine' })
    await userEvent.click(adopted)
    await until(() => expect(adopted.getAttribute('aria-checked')).toBe('true'))
    const slotted = expectSlotted('toggle-slotted', { 'aria-pressed': 'false', 'data-state': 'unchecked' })
    await userEvent.click(slotted)
    await until(() => expect(slotted.getAttribute('aria-pressed')).toBe('true'))
    expect(slotted.textContent?.trim()).toBe('on')
    expect(text('clicks')).toBe('2')
  })

  it('has no axe violations', async () => {
    await mount(Fixture)
    await expectNoAxeViolations()
  })
})
