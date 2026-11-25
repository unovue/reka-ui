import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import Fixture from './fixtures/NavigationMenu.vue'
import { byId, expectAdopted, expectNoAxeViolations, expectSlotted, mount, text, until } from './utils'

const active = () => document.activeElement?.id
const shown = (id: string) => until(() => expect(document.getElementById(id)).not.toBeNull())
const gone = (id: string) => until(() => expect(document.getElementById(id)).toBeNull())

describe('navigation menu (Vapor)', () => {
  it('opens a content by click into the viewport, Escape closes and returns focus', async () => {
    await mount(Fixture)
    const trigger = byId('nav-products')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    await userEvent.click(trigger)
    await shown('nav-products-content')
    expect(text('current')).toBe('products')
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(byId('nav-viewport').contains(byId('nav-products-content'))).toBe(true)
    expect(trigger.getAttribute('aria-controls')).toBe('nav-products-content')
    await userEvent.keyboard('{Escape}')
    await gone('nav-products-content')
    expect(active()).toBe('nav-products')
  })

  it('moves between triggers with the arrows and into the content with Tab', async () => {
    await mount(Fixture)
    byId('nav-products').focus()
    await userEvent.keyboard('{Enter}')
    await shown('nav-products-content')
    await userEvent.keyboard('{Tab}')
    await until(() => expect(active()).toBe('nav-link-a'))
    await userEvent.keyboard('{ArrowDown}')
    await until(() => expect(active()).toBe('nav-link-b'))
    await userEvent.keyboard('{Escape}')
    await until(() => expect(active()).toBe('nav-products'))
    await userEvent.keyboard('{ArrowRight}')
    await until(() => expect(active()).toBe('nav-company'))
    await userEvent.keyboard('{ArrowRight}')
    await until(() => expect(active()).toBe('nav-docs'))
  })

  it('opens on hover', async () => {
    await mount(Fixture)
    await userEvent.hover(byId('nav-company'))
    await shown('nav-company-content')
    expect(text('current')).toBe('company')
  })

  it('asChild in both forms', async () => {
    await mount(Fixture)
    expectAdopted('nav-company', { 'aria-expanded': 'false' })
    expectSlotted('nav-docs', { 'data-reka-collection-item': '' })
  })

  it('has no axe violations, closed and open', async () => {
    await mount(Fixture)
    await expectNoAxeViolations()
    await userEvent.click(byId('nav-products'))
    await shown('nav-products-content')
    await expectNoAxeViolations()
  })
})
