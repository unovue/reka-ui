import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { ContextMenuContent, ContextMenuItem, ContextMenuRoot, ContextMenuTrigger } from '@/ContextMenu'
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuRoot, DropdownMenuTrigger } from '@/DropdownMenu'
import { MenubarContent, MenubarItem, MenubarMenu, MenubarRoot, MenubarTrigger } from '@/Menubar'
import { MenuAnchor, MenuContent, MenuItem, MenuRoot } from '.'

globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const CONTENT_ATTRS = `
  data-testid="content"
  class="custom"
  @open-auto-focus="onOpenAutoFocus"
  @entry-focus="onEntryFocus"
`

function createHarness(template: string, components: Record<string, any>) {
  return defineComponent({
    components,
    props: ['onOpenAutoFocus', 'onEntryFocus'],
    template,
  })
}

const cases = [
  {
    name: 'MenuContent',
    exposesEntryFocus: true,
    harness: createHarness(`
      <MenuRoot :open="true" :modal="false">
        <MenuAnchor />
        <MenuContent ${CONTENT_ATTRS}>
          <MenuItem>Item</MenuItem>
        </MenuContent>
      </MenuRoot>
    `, { MenuRoot, MenuAnchor, MenuContent, MenuItem }),
  },
  {
    name: 'DropdownMenuContent',
    exposesEntryFocus: false,
    harness: createHarness(`
      <DropdownMenuRoot :open="true">
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent ${CONTENT_ATTRS}>
          <DropdownMenuItem>Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuRoot>
    `, { DropdownMenuRoot, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem }),
  },
  {
    name: 'ContextMenuContent',
    exposesEntryFocus: false,
    open: (wrapper: ReturnType<typeof mount>) => wrapper.find('span').trigger('contextmenu'),
    harness: createHarness(`
      <ContextMenuRoot>
        <ContextMenuTrigger><span>Right click</span></ContextMenuTrigger>
        <ContextMenuContent ${CONTENT_ATTRS}>
          <ContextMenuItem>Item</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenuRoot>
    `, { ContextMenuRoot, ContextMenuTrigger, ContextMenuContent, ContextMenuItem }),
  },
  {
    name: 'MenubarContent',
    exposesEntryFocus: false,
    harness: createHarness(`
      <MenubarRoot model-value="file">
        <MenubarMenu value="file">
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent ${CONTENT_ATTRS}>
            <MenubarItem>Item</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </MenubarRoot>
    `, { MenubarRoot, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem }),
  },
]

describe.each(cases)('$name emits', ({ harness, open, exposesEntryFocus }) => {
  let onOpenAutoFocus: ReturnType<typeof vi.fn>
  let onEntryFocus: ReturnType<typeof vi.fn>
  let wrapper: ReturnType<typeof mount>

  async function mountMenu(props: Record<string, unknown> = {}) {
    wrapper = mount(harness, {
      attachTo: document.body,
      props: { onOpenAutoFocus, onEntryFocus, ...props },
    })
    await open?.(wrapper)
    await nextTick()
    await nextTick()
    return document.querySelector<HTMLElement>('[data-testid="content"]')!
  }

  beforeEach(() => {
    document.body.innerHTML = ''
    onOpenAutoFocus = vi.fn()
    onEntryFocus = vi.fn()
  })

  afterEach(() => {
    wrapper.unmount()
  })

  it('emits `openAutoFocus` when the content mounts and focuses it', async () => {
    const content = await mountMenu()

    expect(content).toBeTruthy()
    expect(onOpenAutoFocus).toHaveBeenCalledTimes(1)
    expect(onOpenAutoFocus.mock.calls[0][0]).toBeInstanceOf(Event)
    expect(content.contains(document.activeElement)).toBe(true)
  })

  it('skips auto focus when `openAutoFocus` is prevented', async () => {
    onOpenAutoFocus.mockImplementation((event: Event) => event.preventDefault())
    const content = await mountMenu()

    expect(onOpenAutoFocus).toHaveBeenCalledTimes(1)
    expect(content.contains(document.activeElement)).toBe(false)
  })

  it(exposesEntryFocus ? 'emits `entryFocus`' : 'keeps `entryFocus` internal', async () => {
    await mountMenu()

    expect(onEntryFocus).toHaveBeenCalledTimes(exposesEntryFocus ? 1 : 0)
  })

  it('still forwards other attributes to the content element', async () => {
    const content = await mountMenu()

    expect(content.classList.contains('custom')).toBe(true)
  })
})
