import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import Fixture from './fixtures/Roving.vue'
import { byId, expectAdopted, expectNoAxeViolations, expectSlotted, mount, text, until } from './utils'

const active = () => document.activeElement?.id

describe('tabs, radio group, toggle group, accordion (Vapor)', () => {
  it('tabs: click and arrow keys move the selection; tabs control their panels', async () => {
    await mount(Fixture)
    expect(byId('tabs-list').getAttribute('role')).toBe('tablist')
    expect(byId('tab-a').getAttribute('aria-selected')).toBe('true')
    expect(byId(byId('tab-a').getAttribute('aria-controls')!).getAttribute('role')).toBe('tabpanel')
    await userEvent.click(byId('tab-b'))
    await until(() => expect(text('tab')).toBe('b'))
    await userEvent.keyboard('{ArrowRight}')
    await until(() => expect(text('tab')).toBe('c'))
    expect(active()).toBe('tab-c')
    await userEvent.keyboard('{End}')
    await until(() => expect(active()).toBe('tab-d'))
    await userEvent.keyboard('{ArrowRight}')
    await until(() => expect(active()).toBe('tab-a'))
    expect(text('tab')).toBe('a')
    expect(byId('panel-a').hidden).toBe(false)
    expect(document.getElementById('panel-b')?.textContent?.trim() ?? '').toBe('')
  })

  it('tabs: asChild in both forms', async () => {
    await mount(Fixture)
    expectAdopted('tab-c', { 'role': 'tab', 'aria-selected': 'false' })
    expectSlotted('tab-d', { 'role': 'tab', 'aria-selected': 'false', 'data-state': 'inactive' })
  })

  it('radio group: arrows check and roam, one tab stop, form value', async () => {
    await mount(Fixture)
    expect(byId('radio').getAttribute('role')).toBe('radiogroup')
    expect(byId('radio-r1').getAttribute('aria-checked')).toBe('true')
    await userEvent.click(byId('radio-r2'))
    await until(() => expect(text('radio-value')).toBe('r2'))
    expect(document.getElementById('radio-indicator-r1')).toBeNull()
    expect(byId('radio-indicator-r2')).toBeTruthy()
    await userEvent.keyboard('{ArrowDown}')
    await until(() => expect(text('radio-value')).toBe('r3'))
    expect(active()).toBe('radio-r3')
    await userEvent.keyboard('{ArrowDown}')
    await until(() => expect(active()).toBe('radio-r1'))
    expect(['r1', 'r2', 'r3'].map(v => byId(`radio-${v}`).getAttribute('tabindex')).join()).toBe('0,-1,-1')
  })

  it('toggle group: multiple v-model, roving focus, asChild in both forms', async () => {
    await mount(Fixture)
    expectAdopted('tg-italic', { 'aria-pressed': 'false' })
    expectSlotted('tg-underline', { 'aria-pressed': 'false', 'data-state': 'off' })
    await userEvent.click(byId('tg-bold'))
    await until(() => expect(text('formats')).toBe('bold'))
    await userEvent.keyboard('{ArrowRight}')
    await until(() => expect(active()).toBe('tg-italic'))
    await userEvent.keyboard(' ')
    await until(() => expect(text('formats')).toBe('bold,italic'))
    await userEvent.keyboard('{ArrowRight}{Enter}')
    await until(() => expect(text('formats')).toBe('bold,italic,underline'))
    expect(byId('tg-underline').getAttribute('aria-pressed')).toBe('true')
  })

  it('accordion: expands by click, roams triggers with arrows, collapsible; asChild in both forms', async () => {
    await mount(Fixture)
    expectSlotted('acc-header-slotted', { 'data-state': 'closed' })
    expectAdopted('acc-three', { 'aria-expanded': 'false' })
    await userEvent.click(byId('acc-one'))
    await until(() => expect(text('section')).toBe('one'))
    expect(byId('acc-one').getAttribute('aria-expanded')).toBe('true')
    expect(byId('acc-one').getAttribute('aria-controls')).toBe('acc-content-one')
    await userEvent.keyboard('{ArrowDown}')
    await until(() => expect(active()).toBe('acc-two'))
    await userEvent.keyboard('{End}')
    await until(() => expect(active()).toBe('acc-three'))
    await userEvent.keyboard('{Enter}')
    await until(() => expect(text('section')).toBe('three'))
    await userEvent.keyboard('{Enter}')
    await until(() => expect(text('section')).toBe(''))
  })

  it('has no axe violations', async () => {
    await mount(Fixture)
    await expectNoAxeViolations()
  })
})
