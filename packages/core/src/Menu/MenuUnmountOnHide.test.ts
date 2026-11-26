import type { Ref } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, nextTick, onMounted, ref } from 'vue'
import { ContextMenuContent, ContextMenuItem, ContextMenuRoot, ContextMenuTrigger } from '@/ContextMenu'
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRoot,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/DropdownMenu'
import { MenubarContent, MenubarItem, MenubarMenu, MenubarRoot, MenubarTrigger } from '@/Menubar'
import { sleep } from '@/test'

globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

async function settle() {
  await nextTick()
  await sleep(20)
  await nextTick()
}

const get = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)

function isHidden(id: string) {
  for (let el = get(id); el; el = el.parentElement) {
    if (el.style.display === 'none')
      return true
  }
  return !get(id)
}

/** Local state of the content: how often it mounted, and how often it was clicked since. */
function stateful(id: string, mounts: Ref<number>) {
  return defineComponent({
    setup() {
      const clicks = ref(0)
      onMounted(() => mounts.value++)
      return () => h('span', { 'data-testid': id, 'onClick': () => clicks.value++ }, String(clicks.value))
    },
  })
}

async function clickTwice(id: string) {
  get(id)!.click()
  get(id)!.click()
  await nextTick()
}

const clicksOf = (id: string) => get(id)!.textContent

interface Family {
  name: string
  /** Renders the family with `open` controlling its (first) menu. */
  render: (open: Ref<boolean>, unmountOnHide: Ref<boolean>, mounts: Ref<number>) => () => ReturnType<typeof h>
}

const FAMILIES: Family[] = [
  {
    name: 'DropdownMenu',
    render: (open, unmountOnHide, mounts) => {
      const Stateful = stateful('field', mounts)
      return () => h(DropdownMenuRoot, {
        'open': open.value,
        'onUpdate:open': (value: boolean) => open.value = value,
        'unmountOnHide': unmountOnHide.value,
      }, () => [
        h(DropdownMenuTrigger, null, () => 'Open'),
        h(DropdownMenuContent, { 'data-testid': 'content' }, () => [
          h(Stateful),
          h(DropdownMenuItem, null, () => 'Item'),
        ]),
      ])
    },
  },
  {
    name: 'ContextMenu',
    render: (open, unmountOnHide, mounts) => {
      const Stateful = stateful('field', mounts)
      return () => h(ContextMenuRoot, {
        'open': open.value,
        'onUpdate:open': (value: boolean) => open.value = value,
        'unmountOnHide': unmountOnHide.value,
      }, () => [
        h(ContextMenuTrigger, null, () => 'Area'),
        h(ContextMenuContent, { 'data-testid': 'content' }, () => [
          h(Stateful),
          h(ContextMenuItem, null, () => 'Item'),
        ]),
      ])
    },
  },
  {
    name: 'Menubar',
    render: (open, unmountOnHide, mounts) => {
      const Stateful = stateful('field', mounts)
      return () => h(MenubarRoot, {
        'modelValue': open.value ? 'file' : '',
        'onUpdate:modelValue': (value: string) => open.value = value === 'file',
        'unmountOnHide': unmountOnHide.value,
      }, () => [
        h(MenubarMenu, { value: 'file' }, () => [
          h(MenubarTrigger, null, () => 'File'),
          h(MenubarContent, { 'data-testid': 'content' }, () => [
            h(Stateful),
            h(MenubarItem, null, () => 'Item'),
          ]),
        ]),
        h(MenubarMenu, { value: 'edit' }, () => [
          h(MenubarTrigger, null, () => 'Edit'),
          h(MenubarContent, { 'data-testid': 'edit-content' }, () => h(MenubarItem, null, () => 'Undo')),
        ]),
      ])
    },
  },
]

describe.each(FAMILIES)('given a $name', ({ render }) => {
  let open: Ref<boolean>
  let unmountOnHide: Ref<boolean>
  let mounts: Ref<number>
  let wrapper: ReturnType<typeof mount>

  function mountFamily(initial: { unmountOnHide: boolean, open?: boolean }) {
    open = ref(initial.open ?? false)
    unmountOnHide = ref(initial.unmountOnHide)
    mounts = ref(0)
    wrapper = mount(defineComponent({ setup: () => render(open, unmountOnHide, mounts) }), { attachTo: document.body })
  }

  beforeEach(() => {
    document.body.innerHTML = ''
  })

  afterEach(() => wrapper?.unmount())

  describe('with unmountOnHide=true (default)', () => {
    it('should only render the content while open, and remount it on every open', async () => {
      mountFamily({ unmountOnHide: true })
      await settle()
      expect(get('content')).toBeNull()

      open.value = true
      await settle()
      expect(isHidden('content')).toBe(false)
      await clickTwice('field')

      open.value = false
      await settle()
      expect(get('content')).toBeNull()

      open.value = true
      await settle()
      expect(mounts.value).toBe(2)
      expect(clicksOf('field')).toBe('0')
    })
  })

  // TODO(v3-port): #3324 v3 menus have no `unmountOnHide` prop
  describe.skip('with unmountOnHide=false', () => {
    it('should keep the content mounted and hidden while closed', async () => {
      mountFamily({ unmountOnHide: false })
      await settle()
      expect(get('content')).not.toBeNull()
      expect(isHidden('content')).toBe(true)
      expect(get('content')!.getAttribute('data-state')).toBe('closed')
    })

    it('should keep the local state of the content across close and reopen', async () => {
      mountFamily({ unmountOnHide: false })
      await settle()

      for (let cycle = 0; cycle < 2; cycle++) {
        open.value = true
        await settle()
        expect(isHidden('content')).toBe(false)
        if (cycle === 0)
          await clickTwice('field')

        open.value = false
        await settle()
        expect(isHidden('content')).toBe(true)
        expect(clicksOf('field')).toBe('2')
      }

      open.value = true
      await settle()
      expect(mounts.value).toBe(1)
      expect(clicksOf('field')).toBe('2')
    })

    it('should keep the content and its state when unmountOnHide changes while open', async () => {
      mountFamily({ unmountOnHide: true, open: true })
      await settle()
      await clickTwice('field')

      unmountOnHide.value = false
      await settle()
      expect(isHidden('content')).toBe(false)

      open.value = false
      await settle()
      expect(isHidden('content')).toBe(true)

      unmountOnHide.value = true
      await settle()
      expect(get('content')).toBeNull()
      expect(mounts.value).toBe(1)
    })

    it('should pass axe accessibility tests while closed and while open', async () => {
      mountFamily({ unmountOnHide: false })
      await settle()
      expect(await axe(document.body)).toHaveNoViolations()

      open.value = true
      await settle()
      expect(await axe(document.body)).toHaveNoViolations()
    })
  })
})

function describeSubmenu(unmountOnHide: boolean) {
  it(`should ${unmountOnHide ? 'remount' : 'keep'} the submenu content and its state`, async () => {
    document.body.innerHTML = ''
    const open = ref(true)
    const subOpen = ref(false)
    const mounts = ref(0)
    const Stateful = stateful('sub-field', mounts)
    const wrapper = mount(defineComponent({
      setup: () => () => h(DropdownMenuRoot, {
        'open': open.value,
        'onUpdate:open': (value: boolean) => open.value = value,
        unmountOnHide,
      }, () => [
        h(DropdownMenuTrigger, null, () => 'Open'),
        h(DropdownMenuContent, { 'data-testid': 'content' }, () => h(DropdownMenuSub, {
          'open': subOpen.value,
          'onUpdate:open': (value: boolean) => subOpen.value = value,
        }, () => [
          h(DropdownMenuSubTrigger, null, () => 'More'),
          h(DropdownMenuSubContent, { 'data-testid': 'sub-content' }, () => [
            h(Stateful),
            h(DropdownMenuItem, null, () => 'Sub item'),
          ]),
        ])),
      ]),
    }), { attachTo: document.body })
    await settle()
    subOpen.value = true
    await settle()
    expect(isHidden('sub-content')).toBe(false)
    await clickTwice('sub-field')

    // Closing the root closes the submenu too
    open.value = false
    await settle()
    expect(subOpen.value).toBe(false)
    expect(isHidden('content')).toBe(true)
    expect(isHidden('sub-content')).toBe(true)
    expect(!!get('sub-content')).toBe(!unmountOnHide)

    open.value = true
    await settle()
    subOpen.value = true
    await settle()
    expect(isHidden('sub-content')).toBe(false)
    expect(mounts.value).toBe(unmountOnHide ? 2 : 1)
    expect(clicksOf('sub-field')).toBe(unmountOnHide ? '0' : '2')
    wrapper.unmount()
  })
}

describe.each([true])('given a DropdownMenu submenu with unmountOnHide=%s', describeSubmenu)

// TODO(v3-port): #3324 v3 menus have no `unmountOnHide` prop
describe.skip.each([false])('given a DropdownMenu submenu with unmountOnHide=%s', describeSubmenu)

describe.each([true, false])('given two DropdownMenus with unmountOnHide=%s', (unmountOnHide) => {
  it('should close the open menu on Escape even when a hidden one is mounted after it', async () => {
    document.body.innerHTML = ''
    const first = ref(false)
    const menu = (open: Ref<boolean>, id: string) => h(DropdownMenuRoot, {
      'open': open.value,
      'onUpdate:open': (value: boolean) => open.value = value,
      unmountOnHide,
    }, () => [
      h(DropdownMenuTrigger, null, () => id),
      h(DropdownMenuContent, { 'data-testid': id }, () => h(DropdownMenuItem, null, () => 'Item')),
    ])
    const second = ref(false)
    const wrapper = mount(defineComponent({ setup: () => () => h('div', [menu(first, 'first'), menu(second, 'second')]) }), { attachTo: document.body })
    await settle()

    second.value = true
    await settle()
    second.value = false
    await settle()

    first.value = true
    await settle()
    document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await settle()
    expect(first.value).toBe(false)
    expect(isHidden('first')).toBe(true)
    wrapper.unmount()
  })
})

describe('given a DropdownMenu kept mounted with unmountOnHide=false', () => {
  it('should start a new typeahead search after it is closed and reopened', async () => {
    document.body.innerHTML = ''
    const open = ref(false)
    const wrapper = mount(defineComponent({
      setup: () => () => h(DropdownMenuRoot, {
        'open': open.value,
        'onUpdate:open': (value: boolean) => open.value = value,
        'unmountOnHide': false,
      }, () => [
        h(DropdownMenuTrigger, null, () => 'Open'),
        h(DropdownMenuContent, { 'data-testid': 'content' }, () => [
          h(DropdownMenuItem, { 'data-testid': 'apple' }, () => 'Apple'),
          h(DropdownMenuItem, { 'data-testid': 'banana' }, () => 'Banana'),
        ]),
      ]),
    }), { attachTo: document.body })
    const type = (key: string) => document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))

    // The typeahead search resets 1 second after the last key, so all of this runs well within it.
    open.value = true
    await settle()
    type('a')
    expect(document.activeElement).toBe(get('apple'))

    open.value = false
    await settle()
    open.value = true
    await settle()
    get('content')!.focus()
    type('b')
    expect(document.activeElement).toBe(get('banana'))
    wrapper.unmount()
  })
})
