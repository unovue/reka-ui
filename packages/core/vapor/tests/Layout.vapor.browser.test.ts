import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import Fixture from './fixtures/Layout.vue'
import { byId, expectAdopted, expectNoAxeViolations, expectSlotted, mount, text, until } from './utils'

describe('scroll area, splitter (Vapor)', () => {
  it('scroll area: sizes the thumb and follows the viewport scroll', async () => {
    await mount(Fixture)
    const thumb = byId('thumb')
    await until(() => expect(thumb.getBoundingClientRect().height).toBeGreaterThan(10))
    expect(thumb.getBoundingClientRect().height).toBeLessThan(byId('scrollbar').getBoundingClientRect().height)
    const top = thumb.getBoundingClientRect().top
    byId('viewport').scrollTop = 400
    await until(() => expect(thumb.getBoundingClientRect().top).toBeGreaterThan(top + 20))
    expect(byId('scrollbar').dataset.orientation).toBe('vertical')
  })

  it('scroll area: asChild, v-slot form', async () => {
    await mount(Fixture)
    expectSlotted('scroll-slotted', { 'aria-label': 'Notes', 'dir': 'ltr' })
  })

  it('scroll area virtualizer: renders a window of 1000 rows and follows the scroll', async () => {
    await mount(Fixture)
    const rows = () => [...byId('vscroll').querySelectorAll<HTMLElement>('.vrow')]
    await until(() => expect(rows().length).toBeGreaterThan(0))
    expect(rows().length).toBeLessThan(60)
    expect(rows()[0].dataset.index).toBe('0')
    expect(rows()[0].style.position).toBe('absolute')
    byId('vviewport').scrollTop = 20 * 500
    await until(() => expect(rows().some(r => r.textContent?.trim() === 'Item 500')).toBe(true))
    expect(rows().length).toBeLessThan(60)
  })

  it('splitter: lays out the panels and resizes them with the keyboard', async () => {
    await mount(Fixture)
    await until(() => expect(text('sizes')).toBe('50,50'))
    const handle = expectAdopted('handle', { 'role': 'separator', 'aria-valuenow': '50' })
    expect(byId('panel-a').getBoundingClientRect().width).toBeGreaterThan(150)
    handle.focus()
    await userEvent.keyboard('{ArrowLeft}')
    await until(() => expect(Number(handle.getAttribute('aria-valuenow'))).toBeLessThan(50))
    await userEvent.keyboard('{Home}')
    await until(() => expect(text('sizes')).toBe('20,80'))
    expect(document.activeElement).toBe(handle)
  })

  it('has no axe violations', async () => {
    await mount(Fixture)
    await expectNoAxeViolations()
  })
})
