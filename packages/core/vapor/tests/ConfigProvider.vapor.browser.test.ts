import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import Fixture from './fixtures/ConfigProvider.vue'
import Translations from './fixtures/ConfigProviderTranslations.vue'
import { byId, expectNoAxeViolations, exposed, mount, until } from './utils'

describe('configProvider (Vapor)', () => {
  it('provides dir to its descendants: RTL arrow keys', async () => {
    await mount(Fixture)
    expect(byId('tabs').getAttribute('dir')).toBe('rtl')
    await userEvent.click(byId('tab-one'))
    await userEvent.keyboard('{ArrowLeft}')
    await until(() => expect(document.activeElement).toBe(byId('tab-two')))
    expect(byId('tab-two').getAttribute('aria-selected')).toBe('true')
  })

  it('provides useId for generated ids', async () => {
    await mount(Fixture)
    const controls = byId('tab-one').getAttribute('aria-controls')
    expect(controls).toMatch(/cfg-\d+/)
  })

  it('provides teleportTo for portals', async () => {
    await mount(Fixture)
    await userEvent.click(byId('dialog-trigger'))
    await until(() => expect(byId('portal-target').contains(byId('dialog-content'))).toBe(true))
    await expectNoAxeViolations()
  })

  it('provides translations for the built-in labels', async () => {
    await mount(Translations)
    // A string, a string with a placeholder, a function of the values, and a key that is left out.
    await until(() => expect(byId('pin-2').getAttribute('aria-label')).toBe('Stelle 2 von 3'))
    expect(byId('next').getAttribute('aria-label')).toBe('Nächste Seite')
    expect(byId('page-2').getAttribute('aria-label')).toBe('Seite 2')
    expect(byId('prev').getAttribute('aria-label')).toBe('Previous Page')
    expect(byId('pagination').getAttribute('aria-label')).toBe('pagination')
    // A label on the part itself still wins.
    expect(byId('next-labelled').getAttribute('aria-label')).toBe('Forward')

    exposed().translations = { paginationPrev: 'Vorherige Seite' }
    await until(() => expect(byId('prev').getAttribute('aria-label')).toBe('Vorherige Seite'))
    expect(byId('next').getAttribute('aria-label')).toBe('Next Page')
    expect(byId('page-2').getAttribute('aria-label')).toBe('Page 2')
  })
})
