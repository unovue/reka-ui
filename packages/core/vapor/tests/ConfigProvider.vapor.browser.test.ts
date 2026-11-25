import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import Fixture from './fixtures/ConfigProvider.vue'
import { byId, expectNoAxeViolations, mount, until } from './utils'

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
})
