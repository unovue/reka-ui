import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import Fixture from './fixtures/TagsInput.vue'
import { byId, expectAdopted, expectNoAxeViolations, expectSlotted, mount, text, until } from './utils'

describe('tags input (Vapor)', () => {
  it('adds a tag on Enter and removes one with its delete button', async () => {
    await mount(Fixture)
    await userEvent.click(byId('input'))
    await userEvent.keyboard('reka{Enter}')
    await until(() => expect(text('value')).toBe('vue,vapor,reka'))
    await userEvent.click(byId('delete-vue'))
    await until(() => expect(text('value')).toBe('vapor,reka'))
  })

  it('selects and deletes the last tag with Backspace', async () => {
    await mount(Fixture)
    await userEvent.click(byId('input'))
    await userEvent.keyboard('{Backspace}')
    await until(() => expect(byId('tag-vapor').hasAttribute('data-state')).toBe(true))
    expect(byId('tag-vapor').dataset.state).toBe('active')
    await userEvent.keyboard('{Backspace}')
    await until(() => expect(text('value')).toBe('vue'))
  })

  it('submits through hidden inputs', async () => {
    await mount(Fixture)
    await until(() => expect(Array.from(byId('form').querySelectorAll<HTMLInputElement>('input[name^="tags"]'), i => i.value).join()).toBe('vue,vapor'))
  })

  it('asChild in both forms', async () => {
    await mount(Fixture)
    expectAdopted('tag-adopted', { 'aria-current': 'false' })
    expectSlotted('clear-slotted', { 'aria-label': 'Clear all' })
    await userEvent.click(byId('clear-slotted'))
    await until(() => expect(text('value')).toBe(''))
  })

  it('has no axe violations', async () => {
    await mount(Fixture)
    await expectNoAxeViolations()
  })
})
