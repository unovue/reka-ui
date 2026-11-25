import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import Fixture from './fixtures/Display.vue'
import { byId, expectAdopted, expectNoAxeViolations, expectSlotted, mount, until } from './utils'

describe('progress, avatar, aspect ratio, separator (Vapor)', () => {
  it('progress: ARIA value follows v-model, null is indeterminate', async () => {
    await mount(Fixture)
    const root = byId('progress')
    expect(root.getAttribute('role')).toBe('progressbar')
    expect(root.getAttribute('aria-valuenow')).toBe('30')
    expect(root.getAttribute('aria-valuemax')).toBe('100')
    expect(root.dataset.state).toBe('loading')
    expect(byId('progress-indicator').dataset.state).toBe('loading')
    await userEvent.click(byId('progress-more'))
    await until(() => expect(root.getAttribute('aria-valuenow')).toBe('50'))
    await userEvent.click(byId('progress-unknown'))
    await until(() => expect(root.dataset.state).toBe('indeterminate'))
    expect(root.hasAttribute('aria-valuenow')).toBe(false)
  })

  it('avatar: shows the fallback when the image fails', async () => {
    await mount(Fixture)
    await until(() => expect(document.getElementById('avatar-fallback')).not.toBeNull())
    // v2 keeps the failed image in the DOM, hidden
    const img = document.getElementById('avatar-img')
    expect(img === null || img.style.display === 'none').toBe(true)
  })

  it('aspect ratio: sizes the box from the width', async () => {
    await mount(Fixture)
    await until(() => expect(byId('ratio-child').getBoundingClientRect().height).toBe(100))
  })

  it('separator: orientation and decorative', async () => {
    await mount(Fixture)
    expect(byId('sep').getAttribute('role')).toBe('separator')
    expect(byId('sep').getAttribute('aria-orientation')).toBe('vertical')
    expect(byId('sep-deco').getAttribute('role')).toBe('none')
  })

  it('asChild in both forms', async () => {
    await mount(Fixture)
    expectAdopted('progress-adopted', { 'role': 'progressbar', 'aria-valuenow': '50', 'aria-label': 'Adopted' })
    expectSlotted('sep-slotted', { 'role': 'separator', 'data-orientation': 'horizontal' })
  })

  it('has no axe violations', async () => {
    await mount(Fixture)
    await expectNoAxeViolations()
  })
})
