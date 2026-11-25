import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import Fixture from './fixtures/Slider.vue'
import { byId, expectAdopted, expectNoAxeViolations, expectSlotted, mount, text, until } from './utils'

describe('slider (Vapor)', () => {
  it('renders a slider thumb with ARIA values and a form input', async () => {
    await mount(Fixture)
    const thumb = byId('thumb')
    expect(thumb.getAttribute('role')).toBe('slider')
    expect(thumb.getAttribute('aria-valuenow')).toBe('20')
    expect(thumb.getAttribute('aria-valuemin')).toBe('0')
    expect(thumb.getAttribute('aria-valuemax')).toBe('100')
    await until(() => expect(byId('form').querySelector<HTMLInputElement>('input[name^="volume"]')?.value).toBe('20'))
  })

  it('steps v-model with the keyboard', async () => {
    await mount(Fixture)
    const thumb = byId('thumb')
    thumb.focus()
    await userEvent.keyboard('{ArrowRight}')
    await until(() => expect(text('value')).toBe('30'))
    expect(thumb.getAttribute('aria-valuenow')).toBe('30')
    await userEvent.keyboard('{End}')
    await until(() => expect(text('value')).toBe('100'))
    await userEvent.keyboard('{Home}')
    await until(() => expect(text('value')).toBe('0'))
    expect(document.activeElement).toBe(thumb)
  })

  it('moves to a click on the track', async () => {
    await mount(Fixture)
    const track = byId('track')
    const box = track.getBoundingClientRect()
    await userEvent.click(track, { position: { x: box.width * 0.75, y: box.height / 2 } })
    await until(() => expect(Number(text('value'))).toBeGreaterThanOrEqual(60))
  })

  it('asChild in both forms: a range with two thumbs', async () => {
    await mount(Fixture)
    expectAdopted('thumb-adopted', { 'role': 'slider', 'aria-valuenow': '20', 'aria-label': 'Minimum' })
    const max = expectSlotted('thumb-slotted', { 'role': 'slider', 'aria-valuenow': '60' })
    max.focus()
    await userEvent.keyboard('{ArrowLeft}')
    await until(() => expect(text('range-value')).toBe('20,59'))
  })

  it('has no axe violations', async () => {
    await mount(Fixture)
    await expectNoAxeViolations()
  })
})
