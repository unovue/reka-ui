import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import Fixture from './fixtures/Tree.vue'
import { byId, expectAdopted, expectNoAxeViolations, expectSlotted, mount, text, until } from './utils'

const active = () => document.activeElement?.id

describe('tree (Vapor)', () => {
  it('renders a tree with levels; arrows move, expand and collapse; Enter selects', async () => {
    await mount(Fixture)
    expect(byId('tree').getAttribute('role')).toBe('tree')
    const lib = byId('node-lib')
    expect(lib.getAttribute('role')).toBe('treeitem')
    expect(lib.getAttribute('aria-expanded')).toBe('false')
    expect(lib.getAttribute('aria-level')).toBe('1')
    await userEvent.click(byId('node-index.vue'))
    await until(() => expect(text('selected')).toBe('index.vue'))
    await userEvent.keyboard('{ArrowDown}')
    await until(() => expect(active()).toBe('node-lib'))
    await userEvent.keyboard('{ArrowRight}')
    await until(() => expect(text('expanded')).toBe('lib'))
    await userEvent.keyboard('{ArrowDown}')
    await until(() => expect(active()).toBe('node-tree.vue'))
    expect(byId('node-tree.vue').getAttribute('aria-level')).toBe('2')
    await userEvent.keyboard('{Enter}')
    await until(() => expect(text('selected')).toBe('tree.vue'))
    await userEvent.keyboard('{ArrowLeft}')
    await until(() => expect(active()).toBe('node-lib'))
    await userEvent.keyboard('{ArrowLeft}')
    await until(() => expect(text('expanded')).toBe(''))
  })

  it('asChild in both forms', async () => {
    await mount(Fixture)
    expectAdopted('node-README', { 'role': 'treeitem', 'aria-level': '1' })
    await until(() => expect(document.getElementById('v-file-0')).not.toBeNull())
    expectSlotted('v-file-0', { 'role': 'treeitem', 'aria-selected': 'false' })
  })

  it('tree virtualizer: renders a window of 500 items, End/Home/typeahead reach any item', async () => {
    await mount(Fixture)
    await until(() => expect(document.getElementById('v-file-0')).not.toBeNull())
    const rows = byId('vtree').querySelectorAll('[role=treeitem]').length
    expect(rows).toBeGreaterThan(0)
    expect(rows).toBeLessThan(40)
    await userEvent.click(byId('v-file-0'))
    await until(() => expect(text('virtual-selected')).toBe('file-0'))
    await userEvent.keyboard('{End}')
    await until(() => expect(active()).toBe('v-file-499'))
    await userEvent.keyboard('{Enter}')
    await until(() => expect(text('virtual-selected')).toBe('file-499'))
    await userEvent.keyboard('{Home}')
    await until(() => expect(active()).toBe('v-file-0'))
  })

  it('has no axe violations', async () => {
    await mount(Fixture)
    await expectNoAxeViolations()
  })
})
