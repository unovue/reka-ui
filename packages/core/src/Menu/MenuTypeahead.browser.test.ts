import type { Component } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, ref } from 'vue'
import * as ContextMenu from '../ContextMenu'
import * as DropdownMenu from '../DropdownMenu'
import * as Menubar from '../Menubar'

interface Family {
  parts: Record<string, any>
  Wrap?: (content: () => any) => any
  open: (trigger: HTMLElement) => Promise<void>
}

// Opened from the keyboard, so the first item takes focus and typeahead starts from an item.
async function openFromKeyboard(trigger: HTMLElement) {
  trigger.focus()
  await userEvent.keyboard('{Enter}')
}

const families: Record<string, Family> = {
  DropdownMenu: { parts: DropdownMenu, open: openFromKeyboard },
  // Opened from the pointer, so the content takes focus and typeahead starts from it.
  ContextMenu: { parts: ContextMenu, open: trigger => userEvent.click(trigger, { button: 'right' }) },
  Menubar: { parts: Menubar, Wrap: content => h(Menubar.MenubarMenu, { value: 'file' }, content), open: openFromKeyboard },
}

const get = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)
const active = () => document.activeElement?.textContent?.trim()

async function openMenu(familyName: string, extra: () => any[] = () => [], spaceExtendsTypeahead = true) {
  const family = families[familyName]
  const onSelect = vi.fn()
  // The part of this family, like `DropdownMenuItem` for 'Item'
  const part = (name: string): Component => family.parts[familyName + name]
  const item = (name: string) => h(part('Item'), { onSelect: () => onSelect(name) }, () => name)
  const content = () => [
    h(part('Trigger'), { 'data-testid': 'trigger', 'style': 'display: block; width: 120px; height: 40px;' }, () => 'File'),
    h(part('Portal'), null, () => h(part('Content'), { 'data-testid': 'content', spaceExtendsTypeahead }, () => [
      item('New Tab'),
      item('New Window'),
      item('New Private Window'),
      h(part('Sub'), null, () => [
        h(part('SubTrigger'), null, () => 'More Tools'),
        // Not portalled, so its keys bubble through the parent content.
        h(part('SubContent'), { 'data-testid': 'sub-content', spaceExtendsTypeahead }, () => [item('Save Page'), item('Developer Tools')]),
      ]),
      item('More Settings'),
      ...extra(),
    ])),
  ]
  mount(defineComponent({
    setup: () => () => h(part('Root'), null, () => family.Wrap ? family.Wrap(content) : content()),
  }), { attachTo: document.body })

  await family.open(get('trigger')!)
  await expect.poll(() => get('content')?.contains(document.activeElement)).toBe(true)
  return onSelect
}

describe.each(Object.keys(families))('%s typeahead with Space, in a real browser', (name) => {
  it('selects the focused item with Space during a search by default', async () => {
    const onSelect = await openMenu(name, undefined, false)

    await userEvent.keyboard('new')
    await expect.poll(active).toMatch(/^New /)
    const highlighted = active()
    await userEvent.keyboard(' ')
    await expect.poll(() => onSelect.mock.calls).toEqual([[highlighted]])
    await expect.poll(() => get('content')).toBeNull()
  })

  it('extends an in-progress search instead of selecting the focused item', async () => {
    const onSelect = await openMenu(name)

    await userEvent.keyboard('new p')
    expect(onSelect).not.toHaveBeenCalled()
    await expect.poll(active).toBe('New Private Window')

    await userEvent.keyboard('{Enter}')
    expect(onSelect.mock.calls).toEqual([['New Private Window']])
  })

  it('extends an in-progress search instead of opening the focused submenu', async () => {
    const onSelect = await openMenu(name)

    await userEvent.keyboard('more s')
    expect(get('sub-content')).toBeNull()
    await expect.poll(active).toBe('More Settings')
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('selects the focused item with Space when no search is in progress', async () => {
    const onSelect = await openMenu(name)

    await userEvent.keyboard('{End}')
    await expect.poll(active).toBe('More Settings')
    await userEvent.keyboard(' ')
    await expect.poll(() => onSelect.mock.calls).toEqual([['More Settings']])
    await expect.poll(() => get('content')).toBeNull()
  })
})

describe('contextMenu typeahead with Space, in a real browser', () => {
  it('does not start a search with Space on the content', async () => {
    const onSelect = await openMenu('ContextMenu')
    expect(document.activeElement).toBe(get('content'))

    await userEvent.keyboard(' {ArrowDown}')
    await expect.poll(active).toBe('New Tab')
    await userEvent.keyboard(' ')
    await expect.poll(() => onSelect.mock.calls).toEqual([['New Tab']])
  })
})

describe('dropdownMenu typeahead with Space, in a real browser', () => {
  const name = 'DropdownMenu'

  it('selects the focused item with Space once the search has reset', async () => {
    const onSelect = await openMenu(name)

    await userEvent.keyboard('new')
    await expect.poll(active).toBe('New Window')
    // The search resets 1000ms after its last key
    await new Promise(r => setTimeout(r, 1100))
    await userEvent.keyboard(' ')
    await expect.poll(() => onSelect.mock.calls).toEqual([['New Window']])
  })

  it('toggles a checkbox item on each of two quick Spaces', async () => {
    const checked = ref(false)
    const onCheck = vi.fn()
    await openMenu(name, () => [h(DropdownMenu.DropdownMenuCheckboxItem, {
      'modelValue': checked.value,
      'onUpdate:modelValue': (value: boolean) => {
        checked.value = value
        onCheck(value)
      },
      // Keep the menu open, so the same item can be toggled again.
      'onSelect': (event: Event) => event.preventDefault(),
    }, () => 'Show Bookmarks')])

    await userEvent.keyboard('{End}')
    await expect.poll(active).toBe('Show Bookmarks')
    await userEvent.keyboard('  ')
    await expect.poll(() => onCheck.mock.calls).toEqual([[true], [false]])
  })

  it('leaves Space to a submenu item while the parent search is in progress', async () => {
    const onSelect = await openMenu(name)

    await userEvent.keyboard('more')
    await expect.poll(active).toBe('More Tools')
    await userEvent.keyboard('{ArrowRight}')
    await expect.poll(active).toBe('Save Page')
    await userEvent.keyboard(' ')
    await expect.poll(() => onSelect.mock.calls).toEqual([['Save Page']])
  })

  it('keeps Space in the filter text', async () => {
    const onSelect = await openMenu(name, () => [h(DropdownMenu.DropdownMenuFilter, { 'data-testid': 'filter' })])

    get('filter')!.focus()
    await userEvent.keyboard('new p')
    expect((get('filter') as HTMLInputElement).value).toBe('new p')
    expect(onSelect).not.toHaveBeenCalled()
  })
})
