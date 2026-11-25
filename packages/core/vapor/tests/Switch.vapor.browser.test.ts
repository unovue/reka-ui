import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import Fixture from './fixtures/Switch.vue'
import { byId, expectNoAxeViolations, mount, until } from './utils'

describe('switch (Vapor)', () => {
  it('renders a switch with its label, thumb and hidden form input', async () => {
    await mount(Fixture)
    const root = byId('airplane')
    expect(root.tagName).toBe('BUTTON')
    expect(root.getAttribute('role')).toBe('switch')
    expect(root.getAttribute('aria-checked')).toBe('false')
    expect(root.dataset.state).toBe('unchecked')
    expect(root.className).toBe('switch')
    expect(byId('thumb').dataset.state).toBe('unchecked')
    await until(() => expect(byId('form').querySelector('input[name="airplane"]')).not.toBeNull())
  })

  it('toggles v-model on click, Space and Enter, and keeps focus', async () => {
    await mount(Fixture)
    const root = byId('airplane')
    await userEvent.click(root)
    await until(() => expect(root.getAttribute('aria-checked')).toBe('true'))
    expect(byId('state').textContent).toBe('true')
    expect(document.activeElement).toBe(root)
    await userEvent.keyboard(' ')
    await until(() => expect(root.getAttribute('aria-checked')).toBe('false'))
    await userEvent.keyboard('{Enter}')
    await until(() => expect(root.getAttribute('aria-checked')).toBe('true'))
    expect(byId('thumb').dataset.state).toBe('checked')
  })

  it('toggles through its label', async () => {
    await mount(Fixture)
    await userEvent.click(document.querySelector('label')!)
    await until(() => expect(byId('airplane').getAttribute('aria-checked')).toBe('true'))
  })

  it('resolves a template ref to its element', async () => {
    const host = await mount(Fixture)
    expect(host.querySelector('#airplane')).toBe(byId('airplane'))
  })

  it('asChild (template form): adopts the child, the child\'s attributes win', async () => {
    await mount(Fixture)
    const el = byId('adopted')
    expect(el.getAttribute('role')).toBe('switch')
    expect(el.dataset.state).toBe('mine')
    expect(el.getAttribute('aria-label')).toBe('Adopted')
    expect(el.className).toBe('mine')
    await userEvent.click(el)
    await until(() => expect(el.getAttribute('aria-checked')).toBe('true'))
  })

  it('asChild (v-slot="{ props }" form): binds the props the consumer spreads', async () => {
    await mount(Fixture)
    const el = byId('slotted')
    expect(el.getAttribute('role')).toBe('switch')
    expect(el.dataset.state).toBe('unchecked')
    await userEvent.click(el)
    await until(() => expect(el.getAttribute('aria-checked')).toBe('true'))
    expect(el.dataset.state).toBe('checked')
  })

  it('has no axe violations', async () => {
    await mount(Fixture)
    await expectNoAxeViolations()
  })
})
