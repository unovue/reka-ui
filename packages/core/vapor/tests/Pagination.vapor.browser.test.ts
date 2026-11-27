import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import Fixture from './fixtures/Pagination.vue'
import { byId, expectAdopted, expectNoAxeViolations, expectSlotted, mount, text, until } from './utils'

describe('pagination (Vapor)', () => {
  it('renders pages with the current one marked', async () => {
    await mount(Fixture)
    expect(byId('pagination').tagName).toBe('NAV')
    expect(byId('page-1').getAttribute('aria-current')).toBe('page')
    expect(byId('page-10')).toBeTruthy()
    expect(byId('prev').hasAttribute('disabled')).toBe(true)
  })

  it('moves v-model:page with the page, next and last buttons', async () => {
    await mount(Fixture)
    await userEvent.click(byId('page-2'))
    await until(() => expect(text('page')).toBe('2'))
    expect(byId('page-2').getAttribute('aria-current')).toBe('page')
    await userEvent.click(byId('next-adopted'))
    await until(() => expect(text('page')).toBe('3'))
    await userEvent.click(byId('last-slotted'))
    await until(() => expect(text('page')).toBe('10'))
    await userEvent.click(byId('first'))
    await until(() => expect(text('page')).toBe('1'))
  })

  it('activates a focused page with Enter', async () => {
    await mount(Fixture)
    byId('page-3').focus()
    await userEvent.keyboard('{Enter}')
    await until(() => expect(text('page')).toBe('3'))
    expect(document.activeElement?.id).toBe('page-3')
  })

  it('asChild in both forms', async () => {
    await mount(Fixture)
    expectAdopted('next-adopted', { 'aria-label': 'Next' })
    expectSlotted('last-slotted', { 'aria-label': 'Last Page' })
  })

  it('has no axe violations', async () => {
    await mount(Fixture)
    await expectNoAxeViolations()
  })
})
