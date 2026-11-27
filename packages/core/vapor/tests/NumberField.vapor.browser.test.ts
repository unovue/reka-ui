import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import Fixture from './fixtures/NumberField.vue'
import { byId, expectAdopted, expectNoAxeViolations, expectSlotted, mount, text, until } from './utils'

describe('number field (Vapor)', () => {
  it('renders a spinbutton with its value', async () => {
    await mount(Fixture)
    const input = byId<HTMLInputElement>('input')
    expect(input.getAttribute('role')).toBe('spinbutton')
    expect(input.getAttribute('aria-valuenow')).toBe('5')
    expect(input.value).toBe('5')
  })

  it('steps v-model with the buttons and the keyboard, clamped to min/max', async () => {
    await mount(Fixture)
    const input = byId<HTMLInputElement>('input')
    await userEvent.click(byId('inc'))
    await until(() => expect(text('value')).toBe('6'))
    await userEvent.click(byId('dec'))
    await userEvent.click(byId('dec'))
    await until(() => expect(text('value')).toBe('4'))
    input.focus()
    await userEvent.keyboard('{ArrowUp}')
    await until(() => expect(text('value')).toBe('5'))
    await userEvent.keyboard('{End}')
    await until(() => expect(text('value')).toBe('10'))
    expect(byId('inc').hasAttribute('disabled')).toBe(true)
    await userEvent.keyboard('{Home}')
    await until(() => expect(text('value')).toBe('0'))
    expect(document.activeElement).toBe(input)
  })

  it('commits a typed value on Enter', async () => {
    await mount(Fixture)
    const input = byId<HTMLInputElement>('input')
    await userEvent.clear(input)
    await userEvent.type(input, '8{Enter}')
    await until(() => expect(text('value')).toBe('8'))
  })

  it('asChild in both forms', async () => {
    await mount(Fixture)
    expectAdopted('dec-adopted', { 'aria-label': 'Less', 'tabindex': '-1' })
    expectSlotted('inc-slotted', { 'aria-label': 'More', 'tabindex': '-1' })
    await userEvent.click(byId('inc-slotted'))
    await until(() => expect(text('other')).toBe('2'))
    await userEvent.click(byId('dec-adopted'))
    await until(() => expect(text('other')).toBe('1'))
  })

  it('has no axe violations', async () => {
    await mount(Fixture)
    await expectNoAxeViolations()
  })
})
