import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import Fixture from './fixtures/Menus.vue'
import { byId, expectAdopted, expectNoAxeViolations, expectSlotted, mount, text, until } from './utils'

const active = () => document.activeElement?.id
const gone = (id: string) => until(() => expect(document.getElementById(id)).toBeNull())
const shown = (id: string) => until(() => expect(document.getElementById(id)).not.toBeNull())

describe('dropdown menu, context menu, menubar (Vapor)', () => {
  it('dropdown menu: keyboard, typeahead, select, focus return, outside click', async () => {
    await mount(Fixture)
    const trigger = expectAdopted('menu-trigger', { 'aria-haspopup': 'menu', 'aria-expanded': 'false' })
    trigger.focus()
    await userEvent.keyboard('{Enter}')
    await shown('menu-content')
    expect(byId('menu-content').getAttribute('role')).toBe('menu')
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    await until(() => expect(active()).toBe('menu-new'))
    await userEvent.keyboard('s')
    await until(() => expect(active()).toBe('menu-save'))
    await userEvent.keyboard('{Enter}')
    await gone('menu-content')
    expect(text('picked')).toBe('save')
    await until(() => expect(active()).toBe('menu-trigger'))
    await userEvent.click(trigger)
    await shown('menu-content')
    // A modal menu blocks pointer events outside it, so the click lands on the page behind
    await userEvent.click(byId('outside'), { force: true })
    await gone('menu-content')
  })

  it('dropdown menu: checkbox item and submenu', async () => {
    await mount(Fixture)
    await userEvent.click(byId('menu-trigger'))
    await shown('menu-bookmarks')
    expect(byId('menu-bookmarks').getAttribute('role')).toBe('menuitemcheckbox')
    await userEvent.click(byId('menu-bookmarks'))
    await until(() => expect(text('bookmarks')).toBe('true'))
    await userEvent.click(byId('menu-trigger'))
    await shown('menu-more')
    byId('menu-more').focus()
    await userEvent.keyboard('{ArrowRight}')
    await shown('menu-sub')
    await until(() => expect(active()).toBe('menu-print'))
    await userEvent.keyboard('{ArrowLeft}')
    await gone('menu-sub')
    expect(active()).toBe('menu-more')
    await userEvent.keyboard('{ArrowRight}')
    await until(() => expect(active()).toBe('menu-print'))
    await userEvent.keyboard('{Enter}')
    await gone('menu-content')
    expect(text('picked')).toBe('print')
  })

  it('context menu: opens on right click at the pointer, arrows and Enter select', async () => {
    await mount(Fixture)
    // A popup trigger marks the open state with `data-popup-open`
    const area = expectSlotted('context-area', { 'data-popup-open': null })
    await userEvent.click(area, { button: 'right', position: { x: 20, y: 20 } })
    await shown('context-content')
    expect(area.hasAttribute('data-popup-open')).toBe(true)
    const box = area.getBoundingClientRect()
    await until(() => expect(Math.abs(byId('context-content').getBoundingClientRect().left - (box.left + 20))).toBeLessThan(5))
    await userEvent.keyboard('{ArrowDown}{ArrowDown}')
    await until(() => expect(active()).toBe('context-paste'))
    await userEvent.keyboard('{Enter}')
    await gone('context-content')
    expect(text('picked')).toBe('paste')
  })

  it('menubar: opens a menu, moves between menus with the arrows', async () => {
    await mount(Fixture)
    expect(byId('menubar').getAttribute('role')).toBe('menubar')
    await userEvent.click(byId('bar-file'))
    await shown('bar-file-content')
    await userEvent.click(byId('bar-file'))
    await gone('bar-file-content')
    await userEvent.keyboard('{Enter}')
    await shown('bar-file-content')
    await until(() => expect(active()).toBe('bar-file-item'))
    await userEvent.keyboard('{ArrowRight}')
    await shown('bar-edit-content')
    await gone('bar-file-content')
    await until(() => expect(active()).toBe('bar-edit-content'))
    await userEvent.keyboard('{ArrowDown}')
    await until(() => expect(active()).toBe('bar-edit-item'))
    await userEvent.keyboard('{Enter}')
    await gone('bar-edit-content')
    expect(text('picked')).toBe('edit-item')
    await userEvent.keyboard('{ArrowLeft}')
    await until(() => expect(active()).toBe('bar-file'))
  })

  it('has no axe violations, closed and open', async () => {
    await mount(Fixture)
    await expectNoAxeViolations()
    await userEvent.click(byId('menu-trigger'))
    await shown('menu-content')
    // The open menu only: a modal menu sets aria-hidden on the rest of the page (the built entry runs
    // `useHideOthers`, which the source build skips in test mode), and the page keeps its focusables
    await expectNoAxeViolations(byId('menu-content'))
  })
})
