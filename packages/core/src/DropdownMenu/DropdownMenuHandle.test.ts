import { mount } from '@vue/test-utils'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, nextTick, ref, shallowRef } from 'vue'
import { createDropdownMenuHandle, DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuTrigger } from '.'

interface Row { id: number, name: string }

beforeAll(() => {
  globalThis.ResizeObserver ??= class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

function mountDetached() {
  const handle = createDropdownMenuHandle<Row>()
  const rows = ref<Row[]>([{ id: 1, name: 'Ada' }, { id: 2, name: 'Bob' }])
  const onBeforeUpdate = vi.fn()
  const onUpdate = vi.fn()
  const onSelect = vi.fn()
  const wrapper = mount(defineComponent({
    setup: () => () => h('div', [
      h('ul', rows.value.map(row => h('li', { key: row.id }, [
        row.name,
        h(DropdownMenuTrigger, { 'id': `row-${row.id}`, handle, 'payload': row, 'aria-label': `Actions for ${row.name}` }, () => '…'),
      ]))),
      h(DropdownMenuRoot, {
        handle,
        'onBeforeUpdate:open': onBeforeUpdate,
        'onUpdate:open': onUpdate,
      }, {
        default: ({ payload }: { payload?: Row }) => h(DropdownMenuPortal, null, () => h(DropdownMenuContent, null, () => [
          h(DropdownMenuItem, { onSelect: () => onSelect(payload) }, () => `Rename ${payload?.name}`),
        ])),
      }),
    ]),
  }), { attachTo: document.body })
  return {
    wrapper,
    handle,
    rows,
    onBeforeUpdate,
    onUpdate,
    onSelect,
    byId: (id: string) => document.getElementById(id) as HTMLElement,
    menu: () => document.querySelector<HTMLElement>('[role="menu"]'),
  }
}

function press(element: HTMLElement) {
  element.dispatchEvent(new MouseEvent('click', { bubbles: true, button: 0 }))
}

describe('dropdownMenu detached triggers (#2826)', () => {
  let cleanup: (() => void) | undefined
  afterEach(() => {
    cleanup?.()
    cleanup = undefined
    document.body.innerHTML = ''
  })

  it('opens for the pressed row and hands its payload to the items', async () => {
    const t = mountDetached()
    cleanup = () => t.wrapper.unmount()

    press(t.byId('row-2'))
    await nextTick()
    expect(t.menu()).not.toBeNull()
    expect(t.menu()!.textContent).toContain('Rename Bob')
    expect(t.menu()!.getAttribute('aria-labelledby')).toBe('row-2')
    expect(t.byId('row-2').getAttribute('aria-expanded')).toBe('true')
    expect(t.byId('row-2').getAttribute('aria-controls')).toBe(t.menu()!.id)
    expect(t.byId('row-1').getAttribute('aria-expanded')).toBe('false')
    expect(t.byId('row-1').getAttribute('aria-controls')).toBeNull()
    expect(await axe(document.body)).toHaveNoViolations()

    document.querySelector<HTMLElement>('[role="menuitem"]')!.click()
    await vi.waitFor(() => expect(t.menu()).toBeNull())
    expect(t.onSelect).toHaveBeenCalledWith({ id: 2, name: 'Bob' })
  })

  it('opens from the keyboard (ArrowDown) on a detached trigger', async () => {
    const t = mountDetached()
    cleanup = () => t.wrapper.unmount()

    t.byId('row-1').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    await nextTick()
    expect(t.menu()!.textContent).toContain('Rename Ada')
    expect(t.onUpdate).toHaveBeenLastCalledWith(true, expect.objectContaining({ reason: 'trigger-press', trigger: t.byId('row-1') }))
  })

  it('opens and closes imperatively with reason imperative-action, cancellable', async () => {
    const t = mountDetached()
    cleanup = () => t.wrapper.unmount()

    t.handle.open('row-1')
    await nextTick()
    expect(t.handle.isOpen).toBe(true)
    expect(t.onUpdate).toHaveBeenLastCalledWith(true, expect.objectContaining({ reason: 'imperative-action' }))

    t.onBeforeUpdate.mockImplementationOnce((_value, details) => details.cancel())
    t.handle.close()
    await nextTick()
    expect(t.handle.isOpen).toBe(true)

    t.handle.close()
    await vi.waitFor(() => expect(t.menu()).toBeNull())
    expect(() => t.handle.open('row-9')).toThrow(/no trigger with that id/)
  })

  it('keeps the payload when the active row is removed while open', async () => {
    const t = mountDetached()
    cleanup = () => t.wrapper.unmount()

    press(t.byId('row-2'))
    await nextTick()
    expect(t.menu()!.getAttribute('aria-labelledby')).toBe('row-2')
    t.rows.value = t.rows.value.slice(0, 1)
    await nextTick()
    expect(t.menu()!.textContent).toContain('Rename Bob')
    // The removed row's id no longer labels the menu.
    await vi.waitFor(() => expect(t.menu()!.hasAttribute('aria-labelledby')).toBe(false))
    expect(t.byId('row-1').getAttribute('aria-expanded')).toBe('false')
    t.handle.close()
    await vi.waitFor(() => expect(t.menu()).toBeNull())
  })
  it('a Root that gets its handle after mount returns focus to the detached trigger that opened it', async () => {
    const handle = createDropdownMenuHandle<Row>()
    const rootHandle = shallowRef<typeof handle>()
    const wrapper = mount(defineComponent({
      setup: () => () => h('div', [
        h(DropdownMenuTrigger, { id: 'detached', handle, payload: { id: 1, name: 'Ada' } }, () => 'Detached'),
        h(DropdownMenuRoot, { handle: rootHandle.value, modal: false }, {
          default: ({ payload }: { payload?: Row }) => [
            h(DropdownMenuTrigger, { id: 'in-tree' }, () => 'In tree'),
            h(DropdownMenuPortal, null, () => h(DropdownMenuContent, null, () => [
              h(DropdownMenuItem, null, () => `Rename ${payload?.name ?? 'nobody'}`),
            ])),
          ],
        }),
      ]),
    }), { attachTo: document.body })
    cleanup = () => wrapper.unmount()
    const menu = () => document.querySelector<HTMLElement>('[role="menu"]')
    const detached = () => document.getElementById('detached') as HTMLElement
    await nextTick()
    rootHandle.value = handle
    await nextTick()

    detached().focus()
    press(detached())
    await vi.waitFor(() => expect(menu()?.textContent).toContain('Rename Ada'))
    // A press on the detached trigger is a trigger interaction, not an outside one.
    detached().dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0 }))
    await nextTick()
    expect(menu()).not.toBeNull()

    menu()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await vi.waitFor(() => expect(menu()).toBeNull())
    await vi.waitFor(() => expect(document.activeElement).toBe(detached()))
  })
})
