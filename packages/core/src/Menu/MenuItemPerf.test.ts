import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from '@/DropdownMenu'

const ITEMS = 40

// What each component did while `counting`: a global mixin sees every component of the menu.
let counting = false
let mounts: Record<string, number> = {}
let updates: Record<string, number> = {}
function nameOf(vm: any) {
  return vm.$options.name || vm.$options.__name || 'Anonymous'
}
const counter = {
  beforeMount(this: any) {
    if (counting)
      mounts[nameOf(this)] = (mounts[nameOf(this)] ?? 0) + 1
  },
  beforeUpdate(this: any) {
    if (counting)
      updates[nameOf(this)] = (updates[nameOf(this)] ?? 0) + 1
  },
}
async function count(run: () => unknown) {
  mounts = {}
  updates = {}
  counting = true
  await run()
  await settle()
  counting = false
  const total = (record: Record<string, number>) => Object.values(record).reduce((a, b) => a + b, 0)
  return { mounts, updates, mounted: total(mounts), updated: total(updates) }
}

async function settle() {
  for (let i = 0; i < 4; i++)
    await nextTick()
  await new Promise(resolve => setTimeout(resolve))
  await nextTick()
}

function mountMenu(items: number) {
  const Menu = defineComponent({
    components: { DropdownMenuRoot, DropdownMenuTrigger, DropdownMenuPortal, DropdownMenuContent, DropdownMenuItem },
    setup: () => ({ labels: Array.from({ length: items }, (_, i) => `Option ${String(i).padStart(2, '0')}`) }),
    template: `<DropdownMenuRoot>
      <DropdownMenuTrigger>Open</DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent>
          <DropdownMenuItem v-for="label in labels" :key="label">{{ label }}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenuRoot>`,
  })
  return mount(Menu, { attachTo: document.body, global: { mixins: [counter] } })
}

const menu = () => document.querySelector<HTMLElement>('[role=menu]')!
const items = () => Array.from(document.querySelectorAll<HTMLElement>('[role=menuitem]'))
const keydown = (target: Element, key: string) => target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))

async function open(wrapper: ReturnType<typeof mountMenu>) {
  await wrapper.find('button').trigger('click')
  await settle()
}

describe('given a DropdownMenu with many items', () => {
  let wrapper: ReturnType<typeof mountMenu> | undefined
  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
    vi.restoreAllMocks()
  })

  it('should mount four components per item and no collection wrapper', async () => {
    wrapper = mountMenu(0)
    const empty = await count(() => open(wrapper!))
    wrapper.unmount()

    wrapper = mountMenu(ITEMS)
    const full = await count(() => open(wrapper!))

    expect(items()).toHaveLength(ITEMS)
    // DropdownMenuItem, MenuItem, MenuItemImpl and the Primitive that renders the element.
    expect((full.mounted - empty.mounted) / ITEMS).toBe(4)
    expect(full.mounts.CollectionItem).toBeUndefined()
    expect(full.mounts.MenuItemImpl).toBe(ITEMS)
  })

  it('should register every item with the collection in DOM order', async () => {
    wrapper = mountMenu(ITEMS)
    await open(wrapper)

    expect(items().every(item => item.hasAttribute('data-reka-collection-item'))).toBe(true)
    // Home on the content focuses the first registered item, End the last.
    menu().focus()
    keydown(menu(), 'End')
    expect(document.activeElement).toBe(items()[ITEMS - 1])
    menu().focus()
    keydown(menu(), 'Home')
    expect(document.activeElement).toBe(items()[0])
  })

  it('should re-render only the two items a highlight move touches', async () => {
    wrapper = mountMenu(ITEMS)
    await open(wrapper)
    items()[3].focus()
    await settle()
    expect(items()[3].hasAttribute('data-highlighted')).toBe(true)

    const move = await count(() => keydown(items()[3], 'ArrowDown'))

    expect(document.activeElement).toBe(items()[4])
    expect(items().filter(item => item.hasAttribute('data-highlighted'))).toEqual([items()[4]])
    // The item that lost the highlight and the one that got it, each with its element.
    expect(move.updates).toEqual({ MenuItemImpl: 2, Primitive: 2 })
    expect(move.mounted).toBe(0)
  })

  it('should query the DOM for the items at most once while typing ahead', async () => {
    wrapper = mountMenu(ITEMS)
    await open(wrapper)
    items()[0].focus()
    await settle()

    const query = vi.spyOn(menu(), 'querySelectorAll')
    // The same character again moves to the next match.
    for (let i = 0; i < 3; i++) {
      keydown(document.activeElement!, 'o')
      await settle()
    }

    // Focus moved, which re-renders items. That must not register them again.
    expect(document.activeElement).toBe(items()[3])
    expect(query.mock.calls.length).toBeLessThanOrEqual(1)
  })

  it('should follow the highlight when the pointer moves between items', async () => {
    wrapper = mountMenu(5)
    await open(wrapper)
    const [first, second] = items()
    const highlighted = () => items().filter(item => item.hasAttribute('data-highlighted'))

    first.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerType: 'mouse' }))
    await settle()
    expect(highlighted()).toEqual([first])

    second.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerType: 'mouse' }))
    await settle()
    expect(highlighted()).toEqual([second])

    second.dispatchEvent(new PointerEvent('pointerleave', { bubbles: false, pointerType: 'mouse' }))
    await settle()
    expect(highlighted()).toEqual([])
  })
})
