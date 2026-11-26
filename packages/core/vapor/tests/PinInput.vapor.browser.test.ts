import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import Fixture from './fixtures/PinInput.vue'
import { byId, expectAdopted, expectNoAxeViolations, expectSlotted, mount, text, until } from './utils'

describe('pin input (Vapor)', () => {
  it('moves focus as digits are typed and completes v-model', async () => {
    await mount(Fixture)
    await userEvent.click(byId('pin-0'))
    await userEvent.keyboard('1')
    await until(() => expect(document.activeElement?.id).toBe('pin-1'))
    await userEvent.keyboard('23')
    await until(() => expect(text('completed')).toBe('123'))
    expect(text('value')).toBe('123')
  })

  it('goes back on Backspace and with the arrows', async () => {
    await mount(Fixture)
    await userEvent.click(byId('pin-0'))
    await userEvent.keyboard('12')
    await until(() => expect(document.activeElement?.id).toBe('pin-2'))
    await userEvent.keyboard('{Backspace}')
    await until(() => expect(document.activeElement?.id).toBe('pin-1'))
    await userEvent.keyboard('{ArrowLeft}')
    await until(() => expect(document.activeElement?.id).toBe('pin-0'))
    await userEvent.keyboard('{ArrowRight}')
    await until(() => expect(document.activeElement?.id).toBe('pin-1'))
  })

  it('submits through a hidden input', async () => {
    await mount(Fixture)
    await userEvent.click(byId('pin-0'))
    await userEvent.keyboard('987')
    await until(() => expect(Array.from(byId('form').querySelectorAll<HTMLInputElement>('input[name^="code"]'), i => i.value).join('')).toBe('987'))
  })

  it('asChild in both forms', async () => {
    await mount(Fixture)
    const first = expectAdopted('pin-adopted', { 'aria-label': 'First', 'autocomplete': 'off' })
    expectSlotted('pin-slotted', { 'aria-label': 'Second', 'autocomplete': 'off' })
    await userEvent.click(first)
    await userEvent.keyboard('4')
    await until(() => expect(document.activeElement?.id).toBe('pin-slotted'))
  })

  it('has no axe violations', async () => {
    await mount(Fixture)
    await expectNoAxeViolations()
  })
})
